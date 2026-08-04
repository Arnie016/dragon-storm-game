// Zero-dependency Chrome DevTools Protocol driver for Galevein verification runs.
// Every run launches a throwaway Chrome profile and kills it on exit so no WebGL
// tab is ever left resident; leaked tabs were the cause of earlier bad numbers.
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function loadSnapshot() {
  const uptime = execSync('uptime').toString().trim();
  const match = uptime.match(/load averages?:\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  return {
    uptime,
    loadAverage: match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
  };
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id != null) {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        if (message.error) entry.reject(new Error(`${message.error.message} (${JSON.stringify(message.error)})`));
        else entry.resolve(message.result);
        return;
      }
      for (const handler of this.listeners.get(message.method) || []) handler(message.params);
    });
  }

  on(method, handler) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(handler);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 120000);
    });
  }

  // Evaluates in the page and returns the value, throwing on page-side errors so
  // a broken hook fails the run instead of silently producing a null metric.
  async eval(expression, { awaitPromise = false } = {}) {
    const result = await this.send('Runtime.evaluate', {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise
    });
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
      throw new Error(`page eval failed: ${text}`);
    }
    return result.result.value;
  }
}

export class Browser {
  static async launch({ port = 9333 + Math.floor(Math.random() * 400), width = 1440, height = 900 } = {}) {
    const profile = mkdtempSync(join(tmpdir(), 'dsg-chrome-'));
    const child = spawn(CHROME, [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      '--window-position=0,0',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-component-update',
      '--disable-sync',
      '--no-experiments',
      '--autoplay-policy=no-user-gesture-required',
      // macOS occlusion detection and renderer backgrounding throttle
      // requestAnimationFrame, which would silently deflate frame samples.
      '--disable-features=CalculateNativeWinOcclusion,Translate',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--hide-crash-restore-bubble',
      'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    let target = null;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await sleep(200);
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        target = list.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
        if (target) break;
      } catch { /* chrome not listening yet */ }
    }
    if (!target) {
      child.kill('SIGKILL');
      rmSync(profile, { recursive: true, force: true });
      throw new Error('Chrome did not expose a page target.');
    }

    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new Browser(new CdpSession(socket), child, profile, port);
  }

  constructor(cdp, child, profile, port) {
    this.cdp = cdp;
    this.child = child;
    this.profile = profile;
    this.port = port;
    this.requests = [];
    this.problems = [];
    this.loaded = false;
  }

  async instrument() {
    const cdp = this.cdp;
    cdp.on('Network.requestWillBeSent', (params) => this.requests.push(params.request.url));
    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type !== 'error' && params.type !== 'warning' && params.type !== 'assert') return;
      this.problems.push({ kind: `console.${params.type}`, text: params.args.map((a) => a.value ?? a.description ?? a.type).join(' ') });
    });
    cdp.on('Runtime.exceptionThrown', (params) => {
      this.problems.push({ kind: 'exception', text: params.exceptionDetails.exception?.description || params.exceptionDetails.text });
    });
    cdp.on('Log.entryAdded', (params) => {
      if (params.entry.level !== 'error' && params.entry.level !== 'warning') return;
      this.problems.push({ kind: `log.${params.entry.level}`, text: params.entry.text, url: params.entry.url });
    });
    cdp.on('Page.loadEventFired', () => { this.loaded = true; });
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  }

  externalRequests() {
    return this.requests.filter((url) => !/^(https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/|data:|blob:|about:)/.test(url));
  }

  // Returns once the module graph has run, the dragon GLB is in the scene and the
  // landmark build promise has settled. Rejects loudly if the page reports failure.
  async openGame(url, { quality = 'med', settleMs = 1200 } = {}) {
    // Seed the graphics tier before any page script runs, so the game reads the
    // requested tier on its first pass and no reload is needed.
    if (this._qualityScript) await this.cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: this._qualityScript });
    const injected = await this.cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('galevein_gfx', ${JSON.stringify(quality)}); } catch (error) { /* opaque origin */ }`
    });
    this._qualityScript = injected.identifier;

    this.requests.length = 0;
    this.problems.length = 0;
    this.loaded = false;
    const navigation = await this.cdp.send('Page.navigate', { url });
    if (navigation.errorText) throw new Error(`navigation failed: ${navigation.errorText}`);
    for (let attempt = 0; attempt < 300 && !this.loaded; attempt += 1) await sleep(100);
    if (!this.loaded) throw new Error(`page never fired load for ${url}`);
    const href = await this.cdp.eval('return location.href;');
    if (!href.startsWith(url.split('#')[0].split('?')[0])) throw new Error(`unexpected document ${href}`);

    let ready = null;
    for (let attempt = 0; attempt < 300; attempt += 1) {
      ready = await this.cdp.eval('return { sim: !!window.SIM, model: !!(window.SIM && SIM.state), landmarkReady: !!(window.SIM && SIM.landmarkReady) };');
      if (ready.sim && ready.landmarkReady) break;
      await sleep(200);
    }
    if (!ready?.sim) throw new Error('window.SIM never appeared; the page failed to boot.');
    const landmarkResult = await this.cdp.eval('return SIM.landmarkReady.then(s => ({ ok: true, snapshot: s }), e => ({ ok: false, error: String(e && e.message || e) }));', { awaitPromise: true });
    if (!landmarkResult.ok) throw new Error(`landmark build rejected: ${landmarkResult.error}`);
    // The dragon GLB is large; wait for it so screenshots and benchmarks include it.
    for (let attempt = 0; attempt < 300; attempt += 1) {
      if (await this.cdp.eval('return !!document.getElementById("startBtn") && !document.getElementById("startBtn").disabled;')) break;
      await sleep(200);
    }
    await sleep(settleMs);
    return landmarkResult.snapshot;
  }

  async focusState() {
    return this.cdp.eval('return { visibility: document.visibilityState, focused: document.hasFocus() };');
  }

  async screenshot(path) {
    const shot = await this.cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(shot.data, 'base64'));
    return path;
  }

  async close() {
    try { await this.cdp.send('Browser.close'); } catch { /* already gone */ }
    await sleep(400);
    try { this.child.kill('SIGKILL'); } catch { /* already gone */ }
    await sleep(200);
    rmSync(this.profile, { recursive: true, force: true });
  }
}

// The static server is a child of this process so it lives exactly as long as the
// run and cannot be left listening after the harness exits.
export async function serve(root, port) {
  const child = spawn('nice', ['-n', '19', 'python3', '-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'ignore']
  });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await sleep(150);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/index.html`, { method: 'HEAD' });
      if (response.ok) return { port, root, stop: () => { try { child.kill('SIGKILL'); } catch { /* gone */ } } };
    } catch { /* not listening yet */ }
  }
  child.kill('SIGKILL');
  throw new Error(`static server for ${root} never came up on ${port}`);
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
