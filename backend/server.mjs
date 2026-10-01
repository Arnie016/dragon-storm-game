import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash} from 'node:crypto';
import {mkdirSync,createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateSave,MAX_SAVE_BYTES} from '../world-expansion/modules/saveSchema.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=s=>createHash('sha256').update(s).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const publicDirs=new Set(['audio','fonts','licensed-assets','synthesized-audio','utils','vendor','world-expansion']);
export function createGameServer({dbPath=resolve(ROOT,'.runtime/saves.sqlite'),root=ROOT,publicOrigin=null,secureCookies=false,rateLimit=120}={}){
  if(publicOrigin)new URL(publicOrigin);
  if(dbPath!==':memory:')mkdirSync(dirname(dbPath),{recursive:true,mode:0o700});
  const db=new DatabaseSync(dbPath);db.exec(`
    PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,expires INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS saves(owner TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,revision INTEGER NOT NULL,payload TEXT NOT NULL,updated INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS history(owner TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,revision INTEGER NOT NULL,payload TEXT NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(owner,revision)) STRICT;
  `);
  const limits=new Map();
  function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  function session(req){
    const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('gv_session='))?.slice(11);
    if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
    return db.prepare('SELECT id FROM sessions WHERE id=? AND expires>?').get(hash(token),Date.now())?.id??null;
  }
  async function body(req){
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'JSON required');
    if(Number(req.headers['content-length'])>MAX_SAVE_BYTES)throw fail(413,'Save too large');
    let size=0,chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>MAX_SAVE_BYTES)throw fail(413,'Save too large');chunks.push(chunk);}
    try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'Invalid JSON');}
  }
  function saved(owner){const row=db.prepare('SELECT revision,payload,updated FROM saves WHERE owner=?').get(owner);return row?{revision:row.revision,save:JSON.parse(row.payload),updatedAt:row.updated}:{revision:0,save:null,updatedAt:null};}
  const server=createServer({requestTimeout:15000,headersTimeout:10000,maxHeaderSize:16384},async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
    try{
      const expected=publicOrigin||`http://127.0.0.1:${server.address().port}`;
      const url=new URL(req.url,expected),path=url.pathname;
      if(path.startsWith('/api/')){
        const now=Date.now(),ip=req.socket.remoteAddress;
        for(const [key,value] of limits)if(value.until<now)limits.delete(key);
        if(limits.size>=10000&&!limits.has(ip))throw fail(503,'Server busy');
        const limit=limits.get(ip)||{count:0,until:now+60000};limit.count++;limits.set(ip,limit);
        if(limit.count>rateLimit){res.setHeader('Retry-After','60');throw fail(429,'Too many requests');}
        const localOrigins=[`http://127.0.0.1:${server.address().port}`,`http://localhost:${server.address().port}`];
        const origins=publicOrigin?[publicOrigin]:localOrigins;
        // Validate Host too: do not permit DNS rebinding against a local save service.
        if(!origins.some(o=>new URL(o).host===req.headers.host))throw fail(403,'Host rejected');
        if(!['GET','HEAD'].includes(req.method)&&!origins.includes(req.headers.origin))throw fail(403,'Origin rejected');
        if(req.headers.origin&&!origins.includes(req.headers.origin))throw fail(403,'Origin rejected');
        if(path==='/api/health'&&req.method==='GET')return json(res,200,{service:'galevein-save',version:1});
        let owner=session(req);
        if(path==='/api/session'&&req.method==='POST'){
          if(!owner){
            db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
            const token=randomBytes(32).toString('hex');owner=hash(token);
            db.prepare('INSERT INTO sessions VALUES(?,?)').run(owner,now+30*86400000);
            res.setHeader('Set-Cookie',`gv_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=2592000${secureCookies?'; Secure':''}`);
          }
          return json(res,200,saved(owner));
        }
        if(!owner)throw fail(401,'Connect server backup first');
        if(path==='/api/save'&&req.method==='GET')return json(res,200,saved(owner));
        if(path==='/api/save/history'&&req.method==='GET'){
          return json(res,200,{versions:db.prepare('SELECT revision,updated FROM history WHERE owner=? ORDER BY revision DESC LIMIT 10').all(owner)});
        }
        const match=path.match(/^\/api\/save\/history\/(\d+)$/);
        if(match&&req.method==='GET'){
          const row=db.prepare('SELECT revision,payload,updated FROM history WHERE owner=? AND revision=?').get(owner,Number(match[1]));
          if(!row)throw fail(404,'Backup not found');
          return json(res,200,{revision:row.revision,save:JSON.parse(row.payload),updatedAt:row.updated});
        }
        if(path==='/api/save'&&req.method==='PUT'){
          const b=await body(req);let valid;
          try{valid=validateSave(b.save);}catch{throw fail(422,'Save validation failed');}
          if(!Number.isSafeInteger(b.revision)||b.revision<0)throw fail(422,'Invalid revision');
          // Transaction includes compare-and-swap and retention: simultaneous clients cannot lose progress silently.
          db.exec('BEGIN IMMEDIATE');
          try{
            const current=saved(owner);
            if(current.revision!==b.revision){db.exec('ROLLBACK');return json(res,409,{error:'Save changed on the server',...current});}
            const revision=current.revision+1,payload=JSON.stringify(valid);
            db.prepare('INSERT INTO saves VALUES(?,?,?,?) ON CONFLICT(owner) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated=excluded.updated').run(owner,revision,payload,now);
            db.prepare('INSERT INTO history VALUES(?,?,?,?)').run(owner,revision,payload,now);
            db.prepare('DELETE FROM history WHERE owner=? AND revision<=?').run(owner,revision-10);
            db.exec('COMMIT');return json(res,200,{revision,updatedAt:now});
          }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}
        }
        throw fail(404,'Unknown endpoint');
      }
      if(!['GET','HEAD'].includes(req.method))throw fail(405,'Method not allowed');
      let decoded;try{decoded=decodeURIComponent(path);}catch{throw fail(400,'Invalid path');}
      const relative=decoded==='/'?'index.html':decoded.replace(/^\//,'');
      const parts=relative.split('/');
      if(parts.some(p=>p.startsWith('.')||p.includes('\\'))||(!publicDirs.has(parts[0])&&!(parts.length===1&&(relative==='index.html'||/^dragon_[\w-]+\.glb$/.test(relative)))))throw fail(404,'Not found');
      const file=await realpath(resolve(root,relative));const base=await realpath(root);
      if(!file.startsWith(base+sep))throw fail(404,'Not found');
      const info=await stat(file);if(!info.isFile())throw fail(404,'Not found');
      res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':/\.(html|m?js|json)$/.test(file)?'no-cache':'public, max-age=3600'});
      if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    }catch(e){if(!res.headersSent)json(res,e.status||(['ENOENT','EISDIR'].includes(e.code)?404:500),{error:e.status?e.message:'Request failed'});else res.destroy();}
  });
  server.on('close',()=>db.close());
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const origin=process.env.PUBLIC_ORIGIN||null;
  if(process.env.NODE_ENV==='production'&&(!origin||!origin.startsWith('https://')))throw Error('Production requires PUBLIC_ORIGIN=https://your-game-host');
  const server=createGameServer({dbPath:process.env.SAVE_DB||resolve(ROOT,'.runtime/saves.sqlite'),publicOrigin:origin,secureCookies:origin?.startsWith('https://')});
  server.listen(Number(process.env.PORT||8000),process.env.HOST||'127.0.0.1',()=>console.log(`Stormflight listening on port ${server.address().port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close();server.closeIdleConnections();});
}
