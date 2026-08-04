#!/usr/bin/env python3
import argparse
import asyncio
import base64
import json
import pathlib
import time
import urllib.parse
import urllib.request

import aiohttp


POSES = ("rest", "wingUp", "wingDown", "leap", "dive")


def with_query(base_url, **values):
    parsed = urllib.parse.urlsplit(base_url)
    query = dict(urllib.parse.parse_qsl(parsed.query))
    query.update({key: str(value) for key, value in values.items()})
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query)))


async def run(args):
    targets = json.load(urllib.request.urlopen(f"{args.cdp}/json"))
    target = next(item for item in targets if item.get("type") == "page")
    output = pathlib.Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    report = {"baseUrl": args.base_url, "poses": list(POSES), "rigs": {}}
    events = []
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
                    if payload.get("id") == request_id:
                        if "error" in payload:
                            raise RuntimeError(payload["error"])
                        return payload.get("result", {})
                    events.append(payload)

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

            await call("Page.enable")
            await call("Runtime.enable")
            await call("Log.enable")
            await call("Network.enable")
            await call(
                "Emulation.setDeviceMetricsOverride",
                {
                    "width": args.width,
                    "height": args.height,
                    "deviceScaleFactor": 1,
                    "mobile": False,
                },
            )
            await call(
                "Page.addScriptToEvaluateOnNewDocument",
                {"source": "localStorage.setItem('galevein_gfx','high')"},
            )
            for rig in args.rigs:
                events.clear()
                await call("Network.setCacheDisabled", {"cacheDisabled": True})
                url = with_query(
                    args.base_url,
                    rig=rig,
                    comparison=time.time_ns(),
                )
                await call("Page.navigate", {"url": url})
                await wait_for("!!window.SIM && !!SIM.bones()")
                rig_report = {
                    "url": url,
                    "bones": await evaluate("SIM.bones()"),
                    "screenshots": {},
                }
                for pose in POSES:
                    if pose == "rest":
                        pose_state = await evaluate(
                            """(()=>{document.getElementById('menu').classList.add('hide','live');
                            document.getElementById('hud').classList.add('on');SIM.warp(0,1);
                            return {name:'rest',action:'loaded-idle'};})()"""
                        )
                    else:
                        pose_state = await evaluate(
                            f"SIM.capturePose({json.dumps(pose)})"
                        )
                    await asyncio.sleep(0.2)
                    screenshot = await call(
                        "Page.captureScreenshot",
                        {"format": "png", "captureBeyondViewport": False},
                    )
                    path = output / f"{rig}-{pose}.png"
                    path.write_bytes(base64.b64decode(screenshot["data"]))
                    rig_report["screenshots"][pose] = {
                        "path": str(path),
                        "pose": pose_state,
                        "bytes": path.stat().st_size,
                    }
                rig_report["consoleProblems"] = [
                    event
                    for event in events
                    if event.get("method") in (
                        "Runtime.exceptionThrown",
                        "Log.entryAdded",
                    )
                    and (
                        event.get("method") == "Runtime.exceptionThrown"
                        or event.get("params", {}).get("entry", {}).get("level")
                        in ("warning", "error")
                    )
                ]
                rig_report["externalRequests"] = sorted(
                    {
                        event["params"]["request"]["url"]
                        for event in events
                        if event.get("method") == "Network.requestWillBeSent"
                        and not event["params"]["request"]["url"].startswith(
                            ("http://127.0.0.1:8000/", "data:", "blob:")
                        )
                    }
                )
                rig_report["legacyAudioRequests"] = sorted(
                    {
                        event["params"]["request"]["url"]
                        for event in events
                        if event.get("method") == "Network.requestWillBeSent"
                        and event["params"]["request"]["url"].startswith(
                            "http://127.0.0.1:8000/audio/"
                        )
                    }
                )
                report["rigs"][rig] = rig_report
    report_path = output / "capture-report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cdp", default="http://127.0.0.1:9224")
    parser.add_argument(
        "--base-url", default="http://127.0.0.1:8000/index.html"
    )
    parser.add_argument(
        "--output",
        default="reports/flight-motion-verification/membrane-comparison",
    )
    parser.add_argument(
        "--rigs",
        nargs="+",
        default=("corrected", "membrane"),
    )
    parser.add_argument("--width", type=int, default=1440)
    parser.add_argument("--height", type=int, default=900)
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
