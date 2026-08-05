# Human-playable smoke — Galevein ambition audit

Date: 2026-08-05T06:15:51.039Z
URL: http://127.0.0.1:8000/index.html?rig=stormcrest
Verdict: **beacon3** (PASS)

## Method
- `SIM.jumpChapter(0)` — tutorial start at REST (no jumpBeacon score skip)
- `SIM.steerObjective()` each frame (SIM.controls accel + bank + climb toward next ring)
- Camera shake locked to **0.35** via `SIM.setCameraShake(0.35)`

## Outcome
- Tutorial rings: 3/3
- Beacon score: 3/12
- Steps: 2044
- HP: 56.7
- Camera shake intensity: 0.35
- Frame stats: p50 8.3 ms · p95 9.1 ms · p99 50 ms (156 samples)
- Final objective HUD: `II · home waters — beacons 2/4 · echo at 1`

## Objective HUD trail
- step 0 (t=1.3s): `I · learn to fly — rings 0/3`
- step 720 (t=13.3s): `I · learn to fly — rings 1/3`
- step 840 (t=15.3s): `I · learn to fly — rings 2/3`
- step 1080 (t=19.3s): `II · home waters — beacons 0/4 · echo at 1`
- step 1200 (t=21.3s): `II · home waters — beacons 1/4 · echo at 1`
- step 1680 (t=29.3s): `II · home waters — beacons 2/4 · echo at 1`

## Samples (last 3)
```json
[
  {
    "step": 1800,
    "t": 31.3,
    "flightT": 30,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 39.8,
    "pos": [
      46.8,
      71.8,
      -89.1
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 50.6,
    "hpMax": 100,
    "day": 0.35,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "objective": "II · home waters — beacons 2/4 · echo at 1",
    "motion": {
      "accel": -1.23,
      "yawRate": 0,
      "pitchRate": 0,
      "gLoad": 1,
      "camera": {
        "pull": 2.85,
        "drop": 0.29,
        "fov": 3.56,
        "jerk": 0.162,
        "shakeIntensity": 0.35
      }
    }
  },
  {
    "step": 1920,
    "t": 33.3,
    "flightT": 32,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 40.1,
    "pos": [
      -24.8,
      71.8,
      -118.9
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 53.6,
    "hpMax": 100,
    "day": 0.36,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "objective": "II · home waters — beacons 2/4 · echo at 1",
    "motion": {
      "accel": 1.99,
      "yawRate": 0,
      "pitchRate": 0,
      "gLoad": 1,
      "camera": {
        "pull": 2.82,
        "drop": 0.28,
        "fov": 3.53,
        "jerk": 0.161,
        "shakeIntensity": 0.35
      }
    }
  },
  {
    "step": 2040,
    "t": 35.3,
    "flightT": 34,
    "started": true,
    "done": false,
    "det": 0,
    "score": 2,
    "spd": 26.2,
    "pos": [
      -79.2,
      72,
      -139.9
    ],
    "fpv": false,
    "chapter": 1,
    "tutorial": 3,
    "routeVisible": 12,
    "cause": "",
    "scales": 9,
    "hp": 56.6,
    "hpMax": 100,
    "day": 0.37,
    "finishing": false,
    "charges": 3,
    "chargeT": -1,
    "bolts": 0,
    "disabled": 0,
    "objective": "II · home waters — beacons 2/4 · echo at 1",
    "motion": {
      "accel": 0.78,
      "yawRate": -0.366,
      "pitchRate": 0,
      "gLoad": 1.25,
      "camera": {
        "pull": 0.56,
        "drop": -0.03,
        "fov": 1.09,
        "jerk": 0.111,
        "shakeIntensity": 0.35
      }
    }
  }
]
```
