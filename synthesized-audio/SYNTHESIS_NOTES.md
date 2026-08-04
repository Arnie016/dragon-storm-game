# Original audio synthesis

## Reproduce

From the repository root:

```bash
nice -n 19 python3 synthesized-audio/generate_audio.py
```

Requires Python 3 with NumPy and SciPy plus `/opt/homebrew/bin/ffmpeg` and `ffprobe`. The generator uses a fixed seed, writes float32 WAV intermediates in a temporary directory, applies two-pass EBU R128 normalization, encodes the drop-in MP3s, regenerates all spectrograms, verifies loops, and rejects decode failures.

## Rights

All nine MP3 files in this directory are original procedural works created from mathematical oscillators and pseudorandom noise by `generate_audio.py`. They are owned outright by the project, contain no third-party audio, require no license or attribution, and carry no third-party rights.

`music_menu.mp3` is deliberately not synthesized or copied here. The staged Joth `Eye of the Storm` CC0 track remains the menu music because it is genuine composition and is materially stronger than a procedural substitute.

`wind_ribbon_draco.glb` has no runtime reference and is excluded from the release package. It is not an audio concern.

## Synthesis approach

- **`wind.mp3`** — Decorrelated stereo noise bands, moving band-pass weights, sub-band pressure, and slow gust envelopes.
- **`amb_sea.mp3`** — Three filtered-noise layers driven by offset wave swells, with low surf impacts and stereo shoreline motion.
- **`thunder.mp3`** — Separate high-frequency crack, downward-darkening noise body, delayed early reflections, and decaying sub rumble.
- **`flap.mp3`** — Short filtered-air displacement with an asymmetric wing envelope and a quiet descending membrane-load thump.
- **`crash.mp3`** — Broadband impact transient, three damped resonant body modes, and a randomized high-passed debris tail.
- **`zap.mp3`** — Unstable FM/ring-modulated arc core, descending carrier motion, bright noise, and rapid spark interruptions.
- **`ring.mp3`** — Slightly inharmonic additive partials with staggered attacks and independent decays, plus a restrained body tone.
- **`detected.mp3`** — Compact two-stage rising alert with a low supporting partial, shaped to remain present without a piercing top end.
- **`music_tension.mp3`** — Non-melodic beating low drone, unstable tritone color, filtered air, and a repeating pressure pulse.

## Measured output

Loudness and true peak are ffmpeg `loudnorm` measurements of the final decoded MP3s. Ambient beds target lower integrated loudness than one-shots. Loop checks decode the final MP3, join 2,048-sample tail and head windows, and compare the boundary jump against local sample-step statistics.

| File | Duration | Rate | Ch | Bitrate | Size | LUFS-I | True peak | Replaced CC0 | Loop verification |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `wind.mp3` | 4.200 s | 32000 Hz | 2 | 32 kb/s | 17,253 B | -27.35 | -14.07 dBTP | 15,235 B | PASS; jump 0.013072, 1.21× local p95 |
| `amb_sea.mp3` | 5.200 s | 32000 Hz | 2 | 32 kb/s | 21,285 B | -28.33 | -13.66 dBTP | 15,939 B | PASS; jump 0.005234, 1.13× local p95 |
| `thunder.mp3` | 3.800 s | 32000 Hz | 2 | 32 kb/s | 15,669 B | -22.01 | -2.46 dBTP | 4,078 B | n/a |
| `flap.mp3` | 0.680 s | 24000 Hz | 1 | 24 kb/s | 2,469 B | -20.08 | -7.52 dBTP | 13,389 B | n/a |
| `crash.mp3` | 1.100 s | 24000 Hz | 1 | 24 kb/s | 3,693 B | -19.05 | -2.73 dBTP | 3,537 B | n/a |
| `zap.mp3` | 0.780 s | 24000 Hz | 1 | 24 kb/s | 2,757 B | -19.04 | -3.53 dBTP | 9,998 B | n/a |
| `ring.mp3` | 1.450 s | 24000 Hz | 1 | 24 kb/s | 4,773 B | -19.42 | -2.42 dBTP | 7,302 B | n/a |
| `detected.mp3` | 0.720 s | 24000 Hz | 1 | 24 kb/s | 2,541 B | -17.36 | -10.36 dBTP | 6,301 B | n/a |
| `music_tension.mp3` | 6.500 s | 24000 Hz | 1 | 24 kb/s | 19,893 B | -24.44 | -9.50 dBTP | 16,205 B | PASS; jump 0.002071, 0.28× local p95 |

Synthesized nine-file payload: **90,333 B**. Staged ten-file CC0 payload: **1,018,725 B**. Release payload with the retained **926,741 B** menu track: **1,017,074 B** (-0.2% versus the staged set).

## Spectrogram evidence

Each pair uses the same ffmpeg `showspectrumpic` settings. These prove spectral structure and duration differences, not subjective listening quality.

- `wind.mp3`: [`spectrograms/wind_synth.png`](spectrograms/wind_synth.png) / [`spectrograms/wind_cc0.png`](spectrograms/wind_cc0.png)
- `amb_sea.mp3`: [`spectrograms/amb_sea_synth.png`](spectrograms/amb_sea_synth.png) / [`spectrograms/amb_sea_cc0.png`](spectrograms/amb_sea_cc0.png)
- `thunder.mp3`: [`spectrograms/thunder_synth.png`](spectrograms/thunder_synth.png) / [`spectrograms/thunder_cc0.png`](spectrograms/thunder_cc0.png)
- `flap.mp3`: [`spectrograms/flap_synth.png`](spectrograms/flap_synth.png) / [`spectrograms/flap_cc0.png`](spectrograms/flap_cc0.png)
- `crash.mp3`: [`spectrograms/crash_synth.png`](spectrograms/crash_synth.png) / [`spectrograms/crash_cc0.png`](spectrograms/crash_cc0.png)
- `zap.mp3`: [`spectrograms/zap_synth.png`](spectrograms/zap_synth.png) / [`spectrograms/zap_cc0.png`](spectrograms/zap_cc0.png)
- `ring.mp3`: [`spectrograms/ring_synth.png`](spectrograms/ring_synth.png) / [`spectrograms/ring_cc0.png`](spectrograms/ring_cc0.png)
- `detected.mp3`: [`spectrograms/detected_synth.png`](spectrograms/detected_synth.png) / [`spectrograms/detected_cc0.png`](spectrograms/detected_cc0.png)
- `music_tension.mp3`: [`spectrograms/music_tension_synth.png`](spectrograms/music_tension_synth.png) / [`spectrograms/music_tension_cc0.png`](spectrograms/music_tension_cc0.png)

## Quality assessment

Objective evidence supports the wind, sea, thunder, and tension cues as substantive semantic replacements rather than renamed generic effects: their staged counterparts lack the expected sustained or two-stage spectral structure. Ring, flap, zap, crash, and detected are technically clean and purpose-built, but remain **adequate pending an in-game listening pass**. No claim of subjective superiority is made without human playback. Thunder has visibly distinct crack and rumble stages; physical weight still requires speaker/headphone judgment.
