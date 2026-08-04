#!/usr/bin/env python3

import json
import math
import os
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
CC0 = PROJECT / "licensed-assets" / "audio"
FFMPEG = Path("/opt/homebrew/bin/ffmpeg")
FFPROBE = Path("/opt/homebrew/bin/ffprobe")
SR = 44_100
SEED = 0x6A17E
LOOP_FADE_SECONDS = 1.0

SPECS = {
    "wind": {"duration": 16.0, "channels": 2, "rate": SR, "lufs": -27.0, "bitrate": "128k", "loop": True},
    "amb_sea": {"duration": 16.0, "channels": 2, "rate": SR, "lufs": -28.0, "bitrate": "128k", "loop": True},
    "thunder": {"duration": 3.8, "channels": 2, "rate": SR, "lufs": -19.0, "bitrate": "128k", "loop": False},
    "flap": {"duration": 0.68, "channels": 1, "rate": SR, "lufs": -20.0, "bitrate": "96k", "loop": False},
    "crash": {"duration": 1.1, "channels": 1, "rate": SR, "lufs": -18.0, "bitrate": "96k", "loop": False},
    "zap": {"duration": 0.78, "channels": 1, "rate": SR, "lufs": -18.0, "bitrate": "96k", "loop": False},
    "ring": {"duration": 1.45, "channels": 1, "rate": SR, "lufs": -19.0, "bitrate": "96k", "loop": False},
    "detected": {"duration": 0.72, "channels": 1, "rate": SR, "lufs": -17.0, "bitrate": "96k", "loop": False},
    "music_tension": {"duration": 20.0, "channels": 1, "rate": SR, "lufs": -24.0, "bitrate": "96k", "loop": True},
}

APPROACHES = {
    "wind": "Decorrelated stereo noise bands, moving band-pass weights, sub-band pressure, and slow gust envelopes.",
    "amb_sea": "Three filtered-noise layers driven by offset wave swells, with low surf impacts and stereo shoreline motion.",
    "thunder": "Separate high-frequency crack, downward-darkening noise body, delayed early reflections, and decaying sub rumble.",
    "flap": "Short filtered-air displacement with an asymmetric wing envelope and a quiet descending membrane-load thump.",
    "crash": "Broadband impact transient, three damped resonant body modes, and a randomized high-passed debris tail.",
    "zap": "Unstable FM/ring-modulated arc core, descending carrier motion, bright noise, and rapid spark interruptions.",
    "ring": "Slightly inharmonic additive partials with staggered attacks and independent decays, plus a restrained body tone.",
    "detected": "Compact two-stage rising alert with a low supporting partial, shaped to remain present without a piercing top end.",
    "music_tension": "Non-melodic beating low drone, unstable tritone color, filtered air, and a repeating pressure pulse.",
}


def run(command, *, capture=False):
    return subprocess.run(
        [str(part) for part in command],
        check=True,
        text=True,
        capture_output=capture,
    )


def butter_filter(x, low=None, high=None, order=4):
    if low is not None and high is not None:
        sos = signal.butter(order, [low, high], btype="bandpass", fs=SR, output="sos")
    elif low is not None:
        sos = signal.butter(order, low, btype="highpass", fs=SR, output="sos")
    else:
        sos = signal.butter(order, high, btype="lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def peak_safe(x, peak=0.82):
    maximum = float(np.max(np.abs(x)))
    return (x * (peak / maximum if maximum else 1.0)).astype(np.float32)


def equal_power_loop(x, fade_samples):
    if x.ndim == 1:
        x = x[:, None]
    theta = np.linspace(0.0, math.pi / 2.0, fade_samples, endpoint=True)[:, None]
    overlap = x[-fade_samples:] * np.cos(theta) + x[:fade_samples] * np.sin(theta)
    return np.concatenate((overlap, x[fade_samples:-fade_samples]), axis=0)


def loop_source(duration, channels, builder):
    fade = round(LOOP_FADE_SECONDS * SR)
    raw_length = round((duration + LOOP_FADE_SECONDS) * SR)
    raw = builder(raw_length, channels)
    loop = equal_power_loop(raw, fade)
    return peak_safe(loop[: round(duration * SR)])


def synth_wind(rng, duration):
    def build(n, channels):
        t = np.arange(n) / SR
        output = []
        for side in range(channels):
            noise = rng.standard_normal(n)
            bands = [
                butter_filter(noise, 80, 420, 3),
                butter_filter(noise, 300, 1_500, 3),
                butter_filter(noise, 1_100, 5_200, 3),
                butter_filter(noise, 3_400, 10_500, 3),
            ]
            gust = 0.55 + 0.22 * np.sin(2 * np.pi * (0.073 * t + 0.13 * side))
            gust += 0.15 * np.sin(2 * np.pi * (0.131 * t + 0.41 * side))
            gust += 0.08 * np.sin(2 * np.pi * (0.419 * t + 0.27 * side))
            movement = 0.5 + 0.5 * np.sin(2 * np.pi * (0.227 * t + 0.5 * side))
            air = (0.72 - 0.30 * movement) * bands[0]
            air += (0.42 + 0.24 * movement) * bands[1]
            air += (0.18 + 0.17 * (1.0 - movement)) * bands[2]
            air += (0.13 + 0.16 * movement) * bands[3]
            pressure = butter_filter(rng.standard_normal(n), 24, 130, 3)
            output.append(air * np.clip(gust, 0.18, 1.0) + 0.27 * pressure)
        return np.column_stack(output)

    return loop_source(duration, 2, build)


def synth_sea(rng, duration):
    def build(n, channels):
        t = np.arange(n) / SR
        output = []
        for side in range(channels):
            base = rng.standard_normal(n)
            deep = butter_filter(base, 28, 230, 3)
            wash = butter_filter(base, 160, 2_800, 3)
            foam = butter_filter(rng.standard_normal(n), 1_100, 12_500, 3)
            phase = 0.12 + side * 0.36
            swell_a = np.maximum(0.0, np.sin(2 * np.pi * (0.087 * t + phase))) ** 2.8
            swell_b = np.maximum(0.0, np.sin(2 * np.pi * (0.137 * t + phase + 0.31))) ** 4.2
            swell_c = np.maximum(0.0, np.sin(2 * np.pi * (0.223 * t + phase + 0.67))) ** 6.0
            swell = np.clip(0.18 + 0.57 * swell_a + 0.36 * swell_b + 0.18 * swell_c, 0.0, 1.15)
            output.append(0.52 * deep + wash * swell + 0.20 * foam * (0.65 * swell_b + 0.35 * swell_c))
        return np.column_stack(output)

    return loop_source(duration, 2, build)


def synth_thunder(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    channels = []
    for side in range(2):
        noise = rng.standard_normal(n)
        crack = butter_filter(noise, 900, 18_000, 3) * np.exp(-t * 34.0)
        body_hi = butter_filter(noise, 90, 7_500, 3)
        body_mid = butter_filter(noise, 55, 1_400, 3)
        body_low = butter_filter(noise, 28, 430, 4)
        sweep = np.clip(t / 1.25, 0.0, 1.0)
        body = ((1.0 - sweep) ** 2) * body_hi + 2.0 * sweep * (1.0 - sweep) * body_mid + sweep**2 * body_low
        body *= np.exp(-t * 0.82)
        rumble = np.sin(2 * np.pi * (47.0 * t - 4.2 * t**2) + side * 0.17)
        rumble += 0.45 * np.sin(2 * np.pi * (73.0 * t - 7.5 * t**2) + side * 0.23)
        rumble *= (1.0 - np.exp(-t * 12.0)) * np.exp(-t * 0.72)
        source = 0.95 * crack + 0.78 * body + 0.42 * rumble
        reflected = source.copy()
        for delay, gain in ((0.083, 0.34), (0.151, 0.22), (0.277, 0.14)):
            offset = round((delay + side * 0.004) * SR)
            reflected[offset:] += gain * source[:-offset]
        channels.append(reflected)
    return peak_safe(np.column_stack(channels), 0.88)


def synth_flap(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    air = butter_filter(rng.standard_normal(n), 85, 7_000, 3)
    x = np.clip(t / duration, 0.0, 1.0)
    envelope = (np.sin(np.pi * x) ** 1.7) * np.exp(-1.15 * x)
    pitch_motion = butter_filter(air, 120, 950, 3) * (1.0 - x)
    thump_phase = 2 * np.pi * (112.0 * t - 42.0 * t**2)
    thump = np.sin(thump_phase) * np.exp(-t * 9.0)
    feather = butter_filter(rng.standard_normal(n), 4_000, 14_000, 2)
    return peak_safe((0.72 * air + 0.45 * pitch_motion + 0.08 * feather) * envelope + 0.16 * thump)


def synth_crash(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    transient = butter_filter(noise, 140, 18_000, 2) * np.exp(-t * 42.0)
    body = np.zeros(n)
    for frequency, decay, gain in ((132, 8.0, 0.72), (287, 11.0, 0.46), (611, 17.0, 0.25)):
        body += gain * np.sin(2 * np.pi * frequency * t) * np.exp(-t * decay)
    debris = np.zeros(n)
    for location in rng.integers(round(0.08 * SR), round(0.72 * SR), 18):
        length = min(round(0.055 * SR), n - location)
        burst = butter_filter(rng.standard_normal(length), 1_200, 16_000, 2)
        debris[location : location + length] += burst * np.exp(-np.arange(length) / (0.012 * SR))
    impact = 0.88 * transient + body + 0.16 * debris
    return peak_safe(np.tanh(3.6 * impact))


def synth_zap(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    carrier = 1_850.0 * np.exp(-t * 1.8) + 240.0
    modulator = 93.0 + 41.0 * np.sin(2 * np.pi * 17.0 * t)
    phase = 2 * np.pi * np.cumsum(carrier) / SR
    fm = np.sin(phase + 5.2 * np.sin(2 * np.pi * modulator * t))
    ring = fm * np.sin(2 * np.pi * (317.0 * t + 31.0 * t**2))
    sparks = butter_filter(rng.standard_normal(n), 1_700, 18_000, 3)
    gate = 0.52 + 0.48 * (signal.square(2 * np.pi * (43.0 * t + 9.0 * t**2), duty=0.38) > 0)
    envelope = (1.0 - np.exp(-t * 120.0)) * np.exp(-t * 5.2)
    return peak_safe((0.72 * ring + 0.29 * sparks * gate) * envelope)


def synth_ring(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    output = np.zeros(n)
    base = 612.0
    partials = (
        (1.000, 0.58, 2.6, 0.000),
        (2.014, 0.31, 3.7, 0.004),
        (2.731, 0.22, 4.8, 0.008),
        (4.087, 0.13, 6.1, 0.012),
        (5.432, 0.075, 7.4, 0.017),
        (7.113, 0.070, 7.6, 0.020),
        (11.731, 0.070, 8.2, 0.023),
        (16.907, 0.050, 9.0, 0.026),
        (21.407, 0.035, 9.8, 0.029),
    )
    for ratio, gain, decay, delay in partials:
        local = np.maximum(0.0, t - delay)
        attack = 1.0 - np.exp(-local * 240.0)
        output += gain * np.sin(2 * np.pi * base * ratio * local + rng.uniform(-0.2, 0.2)) * attack * np.exp(-local * decay) * (t >= delay)
    output += 0.09 * np.sin(2 * np.pi * 184.0 * t) * np.exp(-t * 5.0)
    return peak_safe(output)


def synth_detected(rng, duration):
    n = round(duration * SR)
    t = np.arange(n) / SR
    split = 0.29
    local_a = np.minimum(t, split)
    local_b = np.maximum(0.0, t - split)
    phase_a = 2 * np.pi * (690.0 * local_a + 380.0 * local_a**2)
    phase_b = 2 * np.pi * (860.0 * local_b + 510.0 * local_b**2)
    tone_a = np.sin(phase_a) * (t < split)
    tone_b = np.sin(phase_b + phase_a[round(split * SR) - 1]) * (t >= split)
    support = 0.26 * np.sin(2 * np.pi * 345.0 * t)
    envelope = np.minimum(1.0, t * 90.0) * np.exp(-np.maximum(0.0, t - 0.48) * 12.0)
    texture = 0.025 * butter_filter(rng.standard_normal(n), 1_000, 7_500, 2)
    return peak_safe((0.72 * tone_a + 0.88 * tone_b + support + texture) * envelope)


def synth_tension(rng, duration):
    def build(n, channels):
        t = np.arange(n) / SR
        drone = 0.62 * np.sin(2 * np.pi * 55.0 * t)
        drone += 0.39 * np.sin(2 * np.pi * 58.15 * t + 0.4)
        drone += 0.16 * np.sin(2 * np.pi * 77.78 * t + 1.1)
        unstable = np.sin(2 * np.pi * 155.56 * t + 1.9 * np.sin(2 * np.pi * 0.31 * t))
        air = butter_filter(rng.standard_normal(n), 120, 4_000, 3)
        pulse_phase = np.mod(t * 1.23, 1.0)
        counter_phase = np.mod(t * 0.71 + 0.37, 1.0)
        pulse = np.exp(-pulse_phase * 9.0) + 0.38 * np.exp(-counter_phase * 12.0)
        pulse *= 0.82 + 0.18 * np.sin(2 * np.pi * 0.113 * t)
        movement = 0.52 + 0.25 * np.sin(2 * np.pi * 0.173 * t) + 0.14 * np.sin(2 * np.pi * 0.431 * t)
        output = movement * drone + (0.10 + 0.16 * pulse) * unstable + 0.13 * air * (0.35 + pulse)
        return output[:, None]

    return loop_source(duration, 1, build)


SYNTHS = {
    "wind": synth_wind,
    "amb_sea": synth_sea,
    "thunder": synth_thunder,
    "flap": synth_flap,
    "crash": synth_crash,
    "zap": synth_zap,
    "ring": synth_ring,
    "detected": synth_detected,
    "music_tension": synth_tension,
}


def parse_loudnorm(stderr):
    matches = re.findall(r"\{\s*\"input_i\".*?\}", stderr, flags=re.DOTALL)
    if not matches:
        raise RuntimeError("ffmpeg loudnorm did not emit JSON")
    return json.loads(matches[-1])


def loudnorm_measure(path, target):
    result = run(
        [
            FFMPEG,
            "-hide_banner",
            "-nostats",
            "-i",
            path,
            "-af",
            f"loudnorm=I={target}:TP=-2.0:LRA=7:print_format=json",
            "-f",
            "null",
            "-",
        ],
        capture=True,
    )
    return parse_loudnorm(result.stderr)


def encode_loudnorm(wav_path, mp3_path, spec):
    first = loudnorm_measure(wav_path, spec["lufs"])
    measured = (
        f"measured_I={first['input_i']}:measured_TP={first['input_tp']}:"
        f"measured_LRA={first['input_lra']}:measured_thresh={first['input_thresh']}:"
        f"offset={first['target_offset']}:linear=true"
    )
    run(
        [
            FFMPEG,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            wav_path,
            "-af",
            f"loudnorm=I={spec['lufs']}:TP=-2.0:LRA=7:{measured}",
            "-ar",
            spec["rate"],
            "-ac",
            spec["channels"],
            "-codec:a",
            "libmp3lame",
            "-b:a",
            spec["bitrate"],
            "-write_xing",
            "1",
            mp3_path,
        ]
    )


def probe(path):
    result = run(
        [
            FFPROBE,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=sample_rate,channels,bit_rate:format=duration,size",
            "-of",
            "json",
            path,
        ],
        capture=True,
    )
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    fmt = data["format"]
    return {
        "duration": float(fmt["duration"]),
        "sample_rate": int(stream["sample_rate"]),
        "channels": int(stream["channels"]),
        "bitrate": int(stream.get("bit_rate") or 0),
        "size": int(fmt["size"]),
    }


def decode_f32(path, channels):
    result = subprocess.run(
        [
            str(FFMPEG),
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "f32le",
            "-acodec",
            "pcm_f32le",
            "-",
        ],
        check=True,
        capture_output=True,
    )
    return np.frombuffer(result.stdout, dtype="<f4").reshape(-1, channels)


def loop_metrics(path, channels):
    audio = decode_f32(path, channels)
    window = min(2_048, len(audio) // 4)
    joined = np.concatenate((audio[-window:], audio[:window]), axis=0)
    local_steps = np.abs(np.diff(joined, axis=0))
    boundary = np.abs(audio[0] - audio[-1])
    reference = np.percentile(local_steps, 95, axis=0) + 1e-9
    return {
        "window_samples": window,
        "head_tail_rms": float(np.sqrt(np.mean((audio[:window] - audio[-window:]) ** 2))),
        "boundary_jump": float(np.max(boundary)),
        "boundary_to_p95_step": float(np.max(boundary / reference)),
        "pass": bool(np.max(boundary / reference) <= 1.5),
    }


def spectral_metrics(path, channels, sample_rate):
    audio = decode_f32(path, channels)
    frequencies, density = signal.welch(
        audio,
        fs=sample_rate,
        nperseg=min(8_192, len(audio)),
        axis=0,
        scaling="spectrum",
    )
    power = np.mean(density, axis=1)
    total = float(np.sum(power)) + 1e-20
    cumulative = np.cumsum(power)
    rolloff_index = min(int(np.searchsorted(cumulative, total * 0.999)), len(frequencies) - 1)
    peak_db = 10.0 * np.log10(np.max(power) + 1e-20)
    level_db = 10.0 * np.log10(power + 1e-20)
    active = frequencies[level_db >= peak_db - 60.0]
    band = (frequencies >= 8_000) & (frequencies <= 12_000)
    band_db = 10.0 * math.log10((float(np.sum(power[band])) + 1e-20) / total)
    return {
        "rolloff_99_9_hz": float(frequencies[rolloff_index]),
        "upper_active_60db_hz": float(active[-1]) if len(active) else 0.0,
        "band_8_12khz_db": band_db,
    }


def spectrogram(source, destination):
    run(
        [
            FFMPEG,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            source,
            "-lavfi",
            "showspectrumpic=s=960x360:legend=1:scale=log:color=intensity",
            "-frames:v",
            "1",
            destination,
        ]
    )


def decode_check(path):
    run([FFMPEG, "-v", "error", "-i", path, "-f", "null", "-"])


def write_notes(metrics):
    staged_total = sum(path.stat().st_size for path in CC0.glob("*.mp3"))
    synth_total = sum(item["size"] for item in metrics.values())
    retained_menu = (CC0 / "music_menu.mp3").stat().st_size
    release_total = synth_total + retained_menu
    rows = []
    for name in SPECS:
        item = metrics[name]
        loop_text = "n/a"
        if item.get("loop"):
            loop_text = (
                f"PASS; jump {item['loop']['boundary_jump']:.6f}, "
                f"{item['loop']['boundary_to_p95_step']:.2f}× local p95"
            )
        rows.append(
            f"| `{name}.mp3` | {item['duration']:.3f} s | {item['sample_rate']} Hz | "
            f"{item['channels']} | {item['bitrate'] / 1000:.0f} kb/s | {item['size']:,} B | "
            f"{item['spectral']['rolloff_99_9_hz'] / 1000:.2f} kHz | "
            f"{item['spectral']['band_8_12khz_db']:.1f} dB | "
            f"{item['lufs']:.2f} | {item['true_peak']:.2f} dBTP | {item['cc0_size']:,} B | {loop_text} |"
        )
    approaches = "\n".join(f"- **`{name}.mp3`** — {APPROACHES[name]}" for name in SPECS)
    spectrograms = "\n".join(
        f"- `{name}.mp3`: [`spectrograms/{name}_synth.png`](spectrograms/{name}_synth.png) / "
        f"[`spectrograms/{name}_cc0.png`](spectrograms/{name}_cc0.png)"
        for name in SPECS
    )
    text = f"""# Original audio synthesis

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

{approaches}

## Measured output

Loudness and true peak are ffmpeg `loudnorm` measurements of the final decoded MP3s. Ambient beds target lower integrated loudness than one-shots. Spectral rolloff is the decoded frequency below which 99.9% of Welch power falls; the 8–12 kHz column reports that band's power relative to the full signal. Loop checks decode the final MP3, join 2,048-sample tail and head windows, and compare the boundary jump against local sample-step statistics.

| File | Duration | Rate | Ch | Bitrate | Size | 99.9% rolloff | 8–12 kHz | LUFS-I | True peak | Replaced CC0 | Loop verification |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
{chr(10).join(rows)}

Synthesized nine-file payload: **{synth_total:,} B**. Staged ten-file CC0 payload: **{staged_total:,} B**. Release payload with the retained **{retained_menu:,} B** menu track: **{release_total:,} B** ({(release_total / staged_total - 1) * 100:+.1f}% versus the staged set), leaving **{2_500_000 - release_total:,} B** below the 2.5 MB release ceiling.

## Spectrogram evidence

Each pair uses the same ffmpeg `showspectrumpic` settings. These prove spectral structure and duration differences, not subjective listening quality.

{spectrograms}

## Quality assessment

Objective evidence supports the wind, sea, thunder, and tension cues as substantive semantic replacements rather than renamed generic effects: their staged counterparts lack the expected sustained or two-stage spectral structure. Ring, flap, zap, crash, and detected are technically clean and purpose-built, but remain **adequate pending an in-game listening pass**. No claim of subjective superiority is made without human playback. Thunder has visibly distinct crack and rumble stages; physical weight still requires speaker/headphone judgment.
"""
    (ROOT / "SYNTHESIS_NOTES.md").write_text(text)


def main():
    if not FFMPEG.exists() or not FFPROBE.exists():
        raise SystemExit("ffmpeg 8.1 and ffprobe are required at /opt/homebrew/bin")
    try:
        os.nice(19)
    except OSError:
        pass
    rng = np.random.default_rng(SEED)
    spectrogram_dir = ROOT / "spectrograms"
    spectrogram_dir.mkdir(exist_ok=True)
    metrics = {}
    with tempfile.TemporaryDirectory(prefix="galevein-audio-") as temp:
        temp_dir = Path(temp)
        for name, spec in SPECS.items():
            audio = SYNTHS[name](rng, spec["duration"])
            if audio.ndim == 1 and spec["channels"] == 2:
                audio = np.column_stack((audio, audio))
            if audio.ndim == 2 and audio.shape[1] == 1:
                audio = audio[:, 0]
            wav_path = temp_dir / f"{name}.wav"
            mp3_path = ROOT / f"{name}.mp3"
            wavfile.write(wav_path, SR, audio.astype(np.float32))
            encode_loudnorm(wav_path, mp3_path, spec)
            decode_check(mp3_path)
            final = probe(mp3_path)
            measured = loudnorm_measure(mp3_path, spec["lufs"])
            final.update(
                {
                    "lufs": float(measured["input_i"]),
                    "true_peak": float(measured["input_tp"]),
                    "cc0_size": (CC0 / f"{name}.mp3").stat().st_size,
                }
            )
            final["spectral"] = spectral_metrics(mp3_path, spec["channels"], final["sample_rate"])
            if name == "wind" and (
                final["spectral"]["rolloff_99_9_hz"] < 9_500
                or final["spectral"]["band_8_12khz_db"] < -35.0
            ):
                raise RuntimeError(f"wind.mp3 lacks required high-frequency energy: {final['spectral']}")
            if spec["loop"]:
                final["loop"] = loop_metrics(mp3_path, spec["channels"])
                if not final["loop"]["pass"]:
                    raise RuntimeError(f"{name}.mp3 failed loop continuity: {final['loop']}")
            metrics[name] = final
            spectrogram(mp3_path, spectrogram_dir / f"{name}_synth.png")
            spectrogram(CC0 / f"{name}.mp3", spectrogram_dir / f"{name}_cc0.png")
    (ROOT / "metrics.json").write_text(json.dumps(metrics, indent=2, sort_keys=True) + "\n")
    write_notes(metrics)
    print(json.dumps(metrics, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
