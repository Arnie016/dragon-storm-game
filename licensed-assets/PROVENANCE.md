# Licensed asset provenance ledger

Retrieved: 2026-08-04. This is a factual source and license record, not legal advice. Only the MP3 files under `audio/` and the GLBs under `models/` are proposed runtime replacements. The retained `source-packs/` artifacts are acquisition evidence and must not be included in the browser build.

## License record used by Kenney staged audio replacements

- Author / distributor: Kenney (Kenney.nl).
- License: Creative Commons Zero 1.0 Universal (CC0 1.0), saved as [`licenses/CC0-1.0-Kenney.txt`](licenses/CC0-1.0-Kenney.txt).
- Primary license URL: <https://creativecommons.org/publicdomain/zero/1.0/legalcode>.
- Verbatim commercial-use grant from the acquired pack: “This content is free to use in personal, educational and commercial projects.”
- Attribution required: none. The acquired license text says: “Support us by crediting Kenney or www.kenney.nl (this is not mandatory).”
- Distribution attribution string: `No attribution required (optional: "Audio assets by Kenney.nl, CC0 1.0").`
- Conversion: each selected OGG was decoded and re-encoded to MP3 with `ffmpeg -codec:a libmp3lame -q:a 4`; this is a format conversion only.

The underlying CC0 1.0 legal-code grant is: “Affirmer hereby overtly, fully, permanently, irrevocably and unconditionally waives, abandons, and surrenders all of Affirmer's Copyright and Related Rights ... for any purpose whatsoever, including without limitation commercial, advertising or promotional purposes.” CC0 §3 supplies a fallback “royalty-free, non transferable, non sublicensable, non exclusive, irrevocable and unconditional license ... for any purpose whatsoever, including without limitation commercial, advertising or promotional purposes.”

## Runtime audio replacements

| Replacement file | Original source within acquired pack | Exact source URL | Retrieved | Size | SHA-256 |
|---|---|---|---|---:|---|
| `audio/amb_sea.mp3` | `Audio/spaceTrash3.ogg`, Digital Audio | <https://kenney.nl/assets/digital-audio> | 2026-08-04 | 15,939 B | `e92e0aa63775819395ed72247cf5e8b8d15c544f95bf56a400368296f161c167` |
| `audio/crash.mp3` | `Audio/impactGlass_heavy_000.ogg`, Impact Sounds | <https://kenney.nl/assets/impact-sounds> | 2026-08-04 | 3,537 B | `6b3c56a0101594508263f9a0b96d50181c6c9b5874cf20808133db00220561ff` |
| `audio/detected.mp3` | `Audio/highUp.ogg`, Digital Audio | <https://kenney.nl/assets/digital-audio> | 2026-08-04 | 6,301 B | `874e3ab089c5a4fbbc580d3d5ccc30336d25a6ef1e2f04b21f1f2d94b39e0580` |
| `audio/flap.mp3` | `Audio/cloth1.ogg`, RPG Audio | <https://kenney.nl/assets/rpg-audio> | 2026-08-04 | 13,389 B | `c2a3251d8f732cc0255342f6e3acc83fc6271d9a6c51871d5b5f22754ca336b4` |
| `audio/music_menu.mp3` | `Eye of the Storm.mp3`, staged verbatim at `source-packs/opengameart/eye_of_the_storm.mp3` | <https://opengameart.org/content/eye-of-the-storm>; <https://opengameart.org/sites/default/files/Eye%20of%20the%20Storm.mp3> | 2026-08-04 | 926,741 B | `3f25710090659287e3f184a2968af8c965b1480eb6d7665b0a0c43866eb8af85` |
| `audio/music_tension.mp3` | `Audio/Steel jingles/jingles_STEEL07.ogg`, Music Jingles | <https://kenney.nl/assets/music-jingles> | 2026-08-04 | 16,205 B | `6da64a2fcdd2d2006c42b110e5ec0c04139b2903e94e683a8f3609772b1dea68` |
| `audio/ring.mp3` | `Audio/impactBell_heavy_000.ogg`, Impact Sounds | <https://kenney.nl/assets/impact-sounds> | 2026-08-04 | 7,302 B | `d1ea63b932aa43ee5ab127a8fa5446a4b199ea3417f4f70775c26e957a456cdf` |
| `audio/thunder.mp3` | `Audio/impactBell_heavy_002.ogg`, Impact Sounds | <https://kenney.nl/assets/impact-sounds> | 2026-08-04 | 4,078 B | `2b777b66979195e25aeb5fbdb39c7f0b04f23131f2c48a99cd7281b13957a503` |
| `audio/wind.mp3` | `Audio/spaceTrash4.ogg`, Digital Audio | <https://kenney.nl/assets/digital-audio> | 2026-08-04 | 15,235 B | `06a08b8d9881d0d6e6426ac8f24f7b1f0127bb5de9b6640c01bea4902d4fc9c5` |
| `audio/zap.mp3` | `Audio/zap1.ogg`, Digital Audio | <https://kenney.nl/assets/digital-audio> | 2026-08-04 | 9,998 B | `acd0fc5aa71f33cd21a75a72ca58287f586498c0ac57b6c975b7917f724d6eab` |

`audio/music_menu.mp3` is by **Joth**, licensed CC0 1.0 on its own OpenGameArt page. Its verbatim grant is the shared CC0 legal-code grant above; attribution is not required. Optional distribution credit: `Eye of the Storm by Joth, CC0 1.0`.

## Runtime dragon replacement

| Replacement file | Source | Author | License | Commercial use | Attribution |
|---|---|---|---|---|---|
| `models/dragon_quaternius_cc0.glb` | Quaternius [Animated Monster Pack](https://quaternius.com/packs/animatedmonster.html) | Quaternius | CC0 1.0 | Yes | Not required |

Pack page states assets are free for personal and commercial projects under CC0 1.0 Public Domain Dedication.

## Runtime landmark-model replacements

All model source components are from Quaternius’ official **Ultimate Modular Ruins Pack** page: <https://quaternius.com/packs/ultimatemodularruins.html>. The page identifies the author as Quaternius, labels the pack CC0, and says: “This pack includes a huge set of modular ruins and dungeons, an animated character and a set of props. All in FBX, OBJ and Blend formats, free to use in personal and commercial projects.” The retained exact source is <https://drive.google.com/file/d/1-2R_aGWZz7Tizot41g1kXghYY29x0SG1/view>, downloaded as `source-packs/quaternius-ultimate-modular-ruins/Preview.blend` on 2026-08-04 (SHA-256 `0b6f6112b7ee66e6f5c49800b779205442bbe0d0eaeff47e023447c7dac8a3f0`). Its included `License.txt` states “CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.” The verbatim commercial grant is the shared CC0 legal-code grant above. Attribution is not required.

The staged models are derivative assemblies of named source components, exported as GLB and then run through `@gltf-transform/cli optimize --compress draco --texture-compress webp`.

| Replacement file | Source components | Exact source URL | Author | License | Retrieved | Before / after | SHA-256 | Required attribution |
|---|---|---|---|---|---|---:|---|---|
| `models/portal_arch_draco.glb` | `Arch_Gothic`, `Column_Square`, `Column_Square.001` | Pack and Drive URLs above | Quaternius | CC0 1.0 | 2026-08-04 | 93,024 B / 18,900 B | `ebdf6b4ffc6ff7058ffe06544a4c580276073c5532d0adb8298b05673d21640d` | None (optional: `Tempest Gate model components by Quaternius, CC0 1.0`) |
| `models/scene_landmarks_draco.glb` | `Column_Round`, `Arch_Round` | Pack and Drive URLs above | Quaternius | CC0 1.0 | 2026-08-04 | 85,960 B / 15,856 B | `7f70750bf80e49e05676e53df78d8eaf1d3bc002a26503f40a346f6a72961a41` | None (optional: `Sable Reach Spire model components by Quaternius, CC0 1.0`) |
| `models/airfield_props_draco.glb` | `Cart`, `Column_Square.002`–`.004` | Pack and Drive URLs above | Quaternius | CC0 1.0 | 2026-08-04 | 69,832 B / 12,516 B | `b5b6187cc61e438a79618c16d683c91b047dcc23e567075d65a2992c510c5a76` | None (optional: `Gale Outpost model components by Quaternius, CC0 1.0`) |

## Acquired source packs

These were downloaded directly from the listed Kenney asset pages. They are retained solely to preserve source-file names and the original license text. Do not ship them as standalone downloadable game content.

| Pack ZIP | Asset-page source | License | Retrieved | Size | SHA-256 |
|---|---|---|---|---:|---|
| `source-packs/kenney_impact-sounds.zip` | <https://kenney.nl/assets/impact-sounds> | CC0 1.0 | 2026-08-04 | 800,850 B | `029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8` |
| `source-packs/kenney_digital-audio.zip` | <https://kenney.nl/assets/digital-audio> | CC0 1.0 | 2026-08-04 | 990,367 B | `24e6ce28b76a6d8c89cff4d331e0965ff5c3de8a73c612028e9d363cc64e4f06` |
| `source-packs/kenney_music-jingles.zip` | <https://kenney.nl/assets/music-jingles> | CC0 1.0 | 2026-08-04 | 1,239,525 B | `b729ba57959bd58793d2c5cafa348aaf2655d354f3da35ec4729e03ec77197b8` |
| `source-packs/kenney_rpg-audio.zip` | <https://kenney.nl/assets/rpg-audio> | CC0 1.0 | 2026-08-04 | 964,837 B | `6dbeaf8544da958d8f2adcb4a4a4b76c1ade34a05f8ab9edccd327da7375f38b` |

## Excluded hero-model leads

- **BlendSwap “Low Poly Seagull” by Nodelete** — <https://blendswap.com/blend/7419>, CC0 according to its own asset page. It has a flight-control rig, but the page explicitly says it is for distant shots and its download endpoint returned a 403 to this acquisition environment. It is not staged, is visually a mundane seagull rather than a production-quality Galevein, and has no baked `Flap` / `Glide` clips. Excluded.
- **Sketchfab “European Dragon” by Regina Cachoa** — <https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87>, listed as CC Attribution and states that it includes Idle, Walk, Run, and Fly. It is not acquired because download requires an account and the source page does not expose the exact downloaded-file license record here. Its 42.3k triangles are above the project’s web target before conversion. Excluded pending account-side acquisition and visual review.
- **CGTrader “Pteranodon Rigged Animated”** — <https://www.cgtrader.com/3d-models/animal/dinosaur/pteranodon-rigged-3d-model>, advertised under CGTrader’s Royalty Free License at USD 90 in the retrieved listing. It was not purchased. Treat price and license applicability as checkout-time facts to verify and retain with the receipt.
