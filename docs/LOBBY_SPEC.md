# Lobby Hub — Galevein: Stormflight

MVP pre-flight hub between the resting-dragon cinematic and active flight.

## Flow

```
[Boot + dragon load] → [Menu cinematic / spotMoment] → [Lobby hub visible]
        ↓ Story              ↓ Practice              ↓ Chapter Select
   begin() full run      tut rings only          pick chapter → simJumpChapter
        ↓ win/loss
   returnToLobby() — hub re-shown, game over card offers Hub + Fly Again
```

## Nodes (3)

| Node | Action | Gameplay |
|---|---|---|
| **Story** | `S.lobbyMode='story'` → `begin()` | Full 12-beacon route, chapters, nightfall |
| **Practice** | `S.lobbyMode='practice'` → `begin({practice:true})` | Wake Cove tutorial rings; no detection loss |
| **Chapter Select** | Panel → chapter index → `begin({chapterIndex})` | Starts at chapter checkpoint via `simJumpChapter` |

## Return on win/loss

- `showOver()` and `escaped()` call `lobby.returnToHub(cause)` after a short delay.
- `#over` card shows **Return to Hub** (primary) and **Fly Again** (same mode restart).
- Hub persists `{ chaptersCleared }` in `localStorage` key `galevein_lobby` (future cloud save).

## Hub geometry (phase 2)

- 120×120 u platform over void sea; 3 physical pillars with emissive labels.
- MVP uses DOM overlay `#lobbyHub` inside `#menu` — zero extra draw calls.

## SIM hooks

- `SIM.lobby()` — hub snapshot
- `SIM.selectLobby(mode, opts)` — programmatic node pick
- `SIM.returnLobby()` — force hub visible

## Files

| Path | Role |
|---|---|
| `world-expansion/modules/lobbyHub.js` | Hub state + DOM wiring |
| `index.html` `#lobbyHub` | Three node buttons + chapter panel |
