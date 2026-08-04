# Dragon Storm Game Punch List

Playtest environment note: the local server starts at `http://localhost:8000`, but the Cursor browser service did not retain a created tab and rejected navigation. Browser verification and screenshots are blocked by that service failure at the time of this audit.

## Blocking

- [x] **B1 — No mute control.** Added an always-available `M` toggle and button that mute HTML audio and WebAudio wind.
- [x] **B2 — Objective count is contradictory.** Standardized the visible objective and ending copy to the actual twelve-ring route.
- [x] **B3 — Not offline.** Removed Google Font network requests; the local fallback font stack is now used.
- [x] **B4 — A missing dragon asset has no player-facing recovery.** GLTF loading now disables launch and shows a recovery message if the model fails.
- [x] **B5 — Restart does not re-run the safe flight launch sequence.** Restart now returns to the tutorial cove with the shutter sequence, launch grace, and a reminder.

## Polish

- [x] **P1 — The initial controls overview omits Book, Forge, abilities, mute, and restart context.** The HUD contains the full reference, while the menu adds mute and the route count.
- [x] **P2 — Five default skills unlock as overlapping achievement toasts on the first gameplay tick; only the last is readable.** Baseline skills remain in the Book without toasts; earned skills still announce.
- [x] **P3 — The optional feeding-ground mission is disconnected from the beacon route and provides no reward or completion feedback beyond text.** Cut the unreachable objective; whale and feeding-ground scenery remain as exploration.
- [x] **P4 — Plasma arc creation allocates geometry and material every frame; repeated shooting can cause avoidable frame drops on a five-to-ten-minute session.** Plasma now updates its existing line geometry.
- [x] **P5 — No explicit confirmation that audio is enabled or muted after the user gesture.** The persistent sound button reports the current state.
