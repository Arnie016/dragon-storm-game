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
- **`ring.mp3`** — Slightly inharmonic additive partials with reinforced presence harmonics, staggered attacks, and independent decays.
- **`detected.mp3`** — Compact two-stage rising presence-band alert with restrained upper harmonics and a quiet low supporting partial.
- **`music_tension.mp3`** — Non-melodic beating low drone, unstable tritone color, filtered air, and a repeating pressure pulse.

## Measured output

Loudness and true peak are ffmpeg `loudnorm` measurements of the final decoded MP3s. Ambient beds target lower integrated loudness than one-shots. Spectral rolloff is the decoded frequency below which 99.9% of Welch power falls; the 8–12 kHz column reports that band's power relative to the full signal. Loop checks decode the final MP3, join 2,048-sample tail and head windows, and compare the boundary jump against local sample-step statistics.

| File | Duration | Rate | Ch | Bitrate | Size | 99.9% rolloff | 8–12 kHz | LUFS-I | True peak | Replaced CC0 | Loop verification |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `wind.mp3` | 16.000 s | 44100 Hz | 2 | 128 kb/s | 257,088 B | 13.81 kHz | -6.4 dB | -27.09 | -14.74 dBTP | 15,235 B | PASS; jump 0.037085, 0.64× local p95 |
| `amb_sea.mp3` | 16.000 s | 44100 Hz | 2 | 128 kb/s | 257,088 B | 13.83 kHz | -16.8 dB | -28.31 | -13.59 dBTP | 15,939 B | PASS; jump 0.001573, 0.35× local p95 |
| `thunder.mp3` | 3.800 s | 44100 Hz | 2 | 128 kb/s | 61,902 B | 15.31 kHz | -16.2 dB | -21.29 | -3.54 dBTP | 4,078 B | n/a |
| `flap.mp3` | 0.680 s | 44100 Hz | 1 | 96 kb/s | 9,135 B | 14.43 kHz | -12.8 dB | -20.47 | -9.89 dBTP | 13,389 B | n/a |
| `crash.mp3` | 1.100 s | 44100 Hz | 1 | 96 kb/s | 14,151 B | 18.05 kHz | -11.6 dB | -19.78 | -4.06 dBTP | 3,537 B | n/a |
| `zap.mp3` | 0.780 s | 44100 Hz | 1 | 96 kb/s | 10,076 B | 18.69 kHz | -12.4 dB | -18.29 | -2.58 dBTP | 9,998 B | n/a |
| `ring.mp3` | 1.450 s | 44100 Hz | 1 | 96 kb/s | 18,226 B | 10.35 kHz | -28.5 dB | -19.51 | -2.74 dBTP | 7,302 B | n/a |
| `detected.mp3` | 0.720 s | 44100 Hz | 1 | 96 kb/s | 9,449 B | 5.36 kHz | -41.6 dB | -17.44 | -14.36 dBTP | 6,301 B | n/a |
| `music_tension.mp3` | 20.000 s | 44100 Hz | 1 | 96 kb/s | 240,789 B | 3.93 kHz | -47.3 dB | -24.45 | -9.58 dBTP | 16,205 B | PASS; jump 0.001273, 0.29× local p95 |

Synthesized nine-file payload: **877,904 B**. Staged ten-file CC0 payload: **1,018,725 B**. Release payload with the retained **926,741 B** menu track: **1,804,645 B** (+77.1% versus the staged set), leaving **695,355 B** below the 2.5 MB release ceiling.

## Alert masking audit

Decoded 2–5 kHz power relative to each file's total power:

| Cue | Relative 2–5 kHz power |
|---|---:|
| `wind.mp3` | -8.51 dB |
| `detected.mp3` | -1.10 dB |
| `flap.mp3` | -4.14 dB |

The alert's presence-band concentration is **+7.41 dB versus wind** and **+3.04 dB versus flap**, before its higher overall one-shot loudness is considered.

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

Objective evidence supports the wind, sea, thunder, and tension cues as substantive semantic replacements rather than renamed generic effects: their staged counterparts lack the expected sustained or two-stage spectral structure. The detection alert now concentrates energy in the 2–5 kHz presence band instead of competing with wind below 1 kHz. Ring, flap, zap, crash, and detected remain **adequate pending an in-game listening pass**. No claim of subjective superiority is made without human playback. Thunder has visibly distinct crack and rumble stages; physical weight still requires speaker/headphone judgment.
