#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import pathlib
import subprocess
import time
import urllib.parse
import urllib.request

import aiohttp


def load_snapshot():
    return {
        "loadAverage": [round(value, 2) for value in os.getloadavg()],
        "uptime": subprocess.check_output(["uptime"], text=True).strip(),
    }


def with_query(base_url, **values):
    parsed = urllib.parse.urlsplit(base_url)
    query = dict(urllib.parse.parse_qsl(parsed.query))
    query.update({key: str(value) for key, value in values.items()})
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query)))


async def run(args):
    targets = json.load(urllib.request.urlopen(f"{args.cdp}/json"))
    target = next(item for item in targets if item.get("type") == "page")
    results = {
        "baseUrl": args.base_url,
        "cdp": args.cdp,
        "framesPerRig": args.frames,
        "order": args.order,
        "rigs": {},
    }

    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(target["webSocketDebuggerUrl"]) as websocket:
            sequence = 0

            async def call(method, params=None):
                nonlocal sequence
                sequence += 1
                request_id = sequence
                await websocket.send_json(
                    {"id": request_id, "method": method, "params": params or {}}
                )
                while True:
                    message = await websocket.receive()
                    if message.type != aiohttp.WSMsgType.TEXT:
                        raise RuntimeError(f"CDP connection closed: {message.type}")
                    payload = json.loads(message.data)
                    if payload.get("id") != request_id:
                        continue
                    if "error" in payload:
                        raise RuntimeError(payload["error"])
                    return payload.get("result", {})

            async def evaluate(expression):
                response = await call(
                    "Runtime.evaluate",
                    {
                        "expression": expression,
                        "returnByValue": True,
                        "awaitPromise": True,
                    },
                )
                if response.get("exceptionDetails"):
                    raise RuntimeError(response["exceptionDetails"])
                return response.get("result", {}).get("value")

            async def wait_for(expression, timeout=90):
                deadline = time.monotonic() + timeout
                while time.monotonic() < deadline:
                    try:
                        value = await evaluate(expression)
                        if value:
                            return value
                    except RuntimeError:
                        pass
                    await asyncio.sleep(0.05)
                raise TimeoutError(expression)

            await call(
                "Page.addScriptToEvaluateOnNewDocument",
                {"source": "localStorage.setItem('galevein_gfx','med')"},
            )

            rigs = list(args.rigs)
            preferred = "corrected" if args.order == "corrected-first" else "original"
            if preferred in rigs:
                rigs.remove(preferred)
                rigs.insert(0, preferred)
            for name in rigs:
                url = with_query(
                    args.base_url,
                    rig=name,
                    verification=time.time_ns(),
                )
                await call("Network.enable")
                await call("Network.setCacheDisabled", {"cacheDisabled": True})
                await call("Page.navigate", {"url": url})
                await wait_for("!!window.SIM && !!SIM.bones()")

                weight_stats = await evaluate("SIM.skinWeightStats()")
                before = load_snapshot()
                await evaluate("SIM.benchmarkStart()")
                first = max(1, args.frames // 3)
                second = max(first + 1, args.frames * 2 // 3)
                await wait_for(f"SIM.frameStats().samples >= {first}")
                await evaluate("SIM.benchmarkPhase(1)")
                await wait_for(f"SIM.frameStats().samples >= {second}")
                await evaluate("SIM.benchmarkPhase(2)")
                await wait_for(f"SIM.frameStats().samples >= {args.frames}")
                frame_stats = await evaluate("SIM.benchmarkStop()")
                after = load_snapshot()

                results["rigs"][name] = {
                    "url": url,
                    "weights": weight_stats,
                    "weightChecks": {
                        "zeroWeightPass": weight_stats["zeroWeight"] == 0,
                        "normalizationPass": weight_stats["deviates1e3"] == 0,
                        "negativeWeightPass": weight_stats["negativeWeights"] == 0,
                        "jointRangePass": weight_stats["invalidJoints"] == 0,
                        "influenceCeilingPass": all(
                            int(count) <= 4 for count in weight_stats["influences"]
                        ),
                    },
                    "frames": frame_stats,
                    "loadBefore": before,
                    "loadAfter": after,
                }

    output = pathlib.Path(args.output)
    output.write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cdp", default="http://127.0.0.1:9223")
    parser.add_argument(
        "--base-url", default="http://127.0.0.1:8000/index.html"
    )
    parser.add_argument("--frames", type=int, default=900)
    parser.add_argument(
        "--rigs",
        nargs=2,
        choices=(
            "original", "corrected", "membrane",
            "stormcrest", "stormcrest-membrane",
            "voltspine", "voltspine-membrane",
            "thunderhook", "thunderhook-membrane",
        ),
        default=("original", "corrected"),
    )
    parser.add_argument(
        "--order",
        choices=("original-first", "corrected-first"),
        default="original-first",
    )
    parser.add_argument(
        "--output",
        default="reports/flight-motion-verification/controlled-ab.json",
    )
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
