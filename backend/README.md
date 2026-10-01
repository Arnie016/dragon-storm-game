# Journey persistence and save service

The game remains a static browser game. The optional Node 24 server serves the same files and provides private, device-session save backups. No npm packages or external database are required.

## Run

```sh
npm start
```

Open `http://127.0.0.1:8000`. In the hub, expand **Journey & Backups** and select **Enable server backup**. GitHub Pages continues to support local saves, recovery, and file export/import; it cannot execute this server.

## Player behavior

- **Continue** restores the last living Story flight, paused until the player resumes.
- Beacons, tutorial/canyon gates, health, day/night progress, loadout, tower destruction, and active raid wave/enemies survive reload.
- Autosaves run every five wall-clock seconds and at progression changes; purchases and outcomes save immediately.
- Returning to the hub saves the active journey. A failed run retains its last living checkpoint; the checkpoint's currency and upgrades are restored together, avoiding duplicated rewards when rewinding.
- Starting a new Story asks before replacing an existing flight. Permanent Forge progress is kept. Explore/Chapter modes do not overwrite the Story checkpoint.
- Chapter Select offers unlocked chapter starts; it is distinct from exact flight continuation.
- Active mystery minigames, projectile positions, particles, camera animation, raider dive targets and current storm strikes are not resumed. Continue clears transient effects and grants three seconds of protection. This is a playable checkpoint, not a deterministic replay.
- Settings and older story-completion/village/mystery keys migrate without deleting their original values. The new validated profile becomes authoritative.
- Local recovery keeps the previous valid revision. Export produces a portable JSON file; import explicitly replaces the journey. The checksum detects accidental corruption, not cheating.
- Another tab's write pauses the current flight and requires a reload. Server conflicts require an explicit local/server choice.

## API

All writes require the configured same-origin `Origin` header. JSON writes are capped at 128 KiB and validated with the exact browser save schema. Sessions use random 256-bit tokens in `HttpOnly; SameSite=Strict` cookies, stored only as SHA-256 hashes in SQLite. HTTPS enables `Secure`. Session cookies expire after 30 days; export is the portable recovery method when a cookie is lost. There is no email/account recovery or cross-device login.

| Route | Method | Behavior |
| --- | --- | --- |
| `/api/health` | GET | Service identity/version |
| `/api/session` | POST | Create or reuse device session; return current server save |
| `/api/save` | GET | Read session's save/revision |
| `/api/save` | PUT | `{revision, save}` compare-and-swap; stale writes return 409 |
| `/api/save/history` | GET | List last ten revisions |
| `/api/save/history/:revision` | GET | Read one retained revision belonging to this session |

Authentication is session ownership, not authoritative gameplay verification. Imported and client-generated saves are deliberately supported. Do not use these values for competitive leaderboards or purchases.

## Hosting

Use a long-running Node 24 instance with a persistent disk and HTTPS reverse proxy on the same origin as the game. This SQLite service is for a single instance; horizontally scaled deployments require a shared database and shared rate limiter.

```sh
NODE_ENV=production \
PUBLIC_ORIGIN=https://your-game.example \
HOST=127.0.0.1 PORT=8000 \
SAVE_DB=/var/lib/galevein/saves.sqlite \
node backend/server.mjs
```

`PUBLIC_ORIGIN` must exactly match the browser origin, with no trailing slash. Forward the original Host header. The default is loopback-only development. Set `HOST=0.0.0.0` for a container behind your proxy. The public file allowlist excludes backend code, dotfiles, and the default database directory. Always keep `SAVE_DB` outside public asset folders.

Build a container with `docker build -t galevein .`, provide `PUBLIC_ORIGIN`, and mount a persistent volume at `/app/.runtime`. Docker deployment has not been exercised by this change. The running server has bounded request sizes/timeouts, 120 API requests per IP per minute, transactional writes, a ten-revision history and WAL journaling. Use the SQLite backup API or stop the service before copying its database; a live copy of only the `.sqlite` file can omit WAL data. Back up the persistent volume independently of git.

No external service has been provisioned or deployed by this change. Merging into GitHub Pages enables local persistence only.

## Verification

```sh
npm test
CHROMIUM_EXECUTABLE=/path/to/chromium node reports/state-backend/browser-check.mjs
```

The browser harness uses Playwright from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. It checks real UI launch/save/reload/Continue, imported combat-state restoration, a real Forge purchase, server backup and recovery. Imported raid fixtures are explicitly diagnostic. See `reports/state-backend/REPORT.md` for results and limits.
