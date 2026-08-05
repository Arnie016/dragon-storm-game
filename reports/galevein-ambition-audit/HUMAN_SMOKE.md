# Human-playable smoke — Galevein ambition audit

Date: 2026-08-05T03:26:59.241Z
URL: http://127.0.0.1:8000/index.html?rig=stormcrest
Verdict: **beacon3** (PASS)

## Method
- `SIM.jumpChapter(0)` — tutorial start at REST (no jumpBeacon score skip)
- `SIM.controls` steering toward next ring each frame (accel + bank + climb)
- Camera shake locked to **0.35** via `SIM.setCameraShake(0.35)`

## Outcome
- Tutorial rings: 3/3
- Beacon score: 3/12
- Steps: 2049
- HP: 56.5
- Camera shake intensity: 0.35
- Frame p95 (last sample): 10.3 ms

## Samples (last 3)
```json
[
  {
    "step": 1800,
    "t": 31.4,
    "flightT": 30,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 40.2,
    "pos": [
      49.9,
      71.5,
      -88.4
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 50.3,
    "hpMax": 100,
    "day": 0.351,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "motion": {
      "accel": 2.18,
      "yawRate": 0,
      "pitchRate": 0,
      "gLoad": 1,
      "camera": {
        "pull": 2.82,
        "drop": 0.28,
        "fov": 3.54,
        "jerk": 0.182,
        "shakeIntensity": 0.35
      }
    }
  },
  {
    "step": 1920,
    "t": 33.4,
    "flightT": 32,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 39.8,
    "pos": [
      -21.5,
      71.5,
      -119.2
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 53.3,
    "hpMax": 100,
    "day": 0.36,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "motion": {
      "accel": -0.51,
      "yawRate": 0,
      "pitchRate": 0,
      "gLoad": 1,
      "camera": {
        "pull": 2.83,
        "drop": 0.29,
        "fov": 3.55,
        "jerk": 0.123,
        "shakeIntensity": 0.35
      }
    }
  },
  {
    "step": 2040,
    "t": 35.4,
    "flightT": 34,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 26.1,
    "pos": [
      -77.5,
      71.7,
      -139.3
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 56.3,
    "hpMax": 100,
    "day": 0.37,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "motion": {
      "accel": 0.18,
      "yawRate": -0.33,
      "pitchRate": 0,
      "gLoad": 1.19,
      "camera": {
        "pull": 0.39,
        "drop": -0.09,
        "fov": 1.09,
        "jerk": 0.039,
        "shakeIntensity": 0.35
      }
    }
  }
]
```
