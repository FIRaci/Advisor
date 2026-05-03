"""Simple smoke test for AdVisor AI service endpoints.

Usage:
  python scripts/smoke_test.py
  python scripts/smoke_test.py http://localhost:8000
"""

from __future__ import annotations

import json
import os
import sys
from urllib import request, error


def get_json(url: str) -> dict:
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode("utf-8"))


def post_json(url: str, payload: dict, timeout_sec: int) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with request.urlopen(req, timeout=timeout_sec) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    cli_timeout = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        chat_timeout_sec = int(cli_timeout or os.getenv("SMOKE_CHAT_TIMEOUT_SEC", "45"))
    except ValueError:
        print("Invalid timeout value. Use an integer number of seconds.")
        return 1

    print(f"[1/3] GET {base_url}/health")
    try:
        health = get_json(f"{base_url}/health")
        print("Health:", health)
    except Exception as exc:
        print("Health check failed:", exc)
        return 1

    print(f"[2/3] GET {base_url}/examples")
    try:
        examples = get_json(f"{base_url}/examples")
        print("Examples count:", examples.get("count"))
    except error.HTTPError as exc:
        print("Examples endpoint failed:", exc)
        return 1

    print(f"[3/3] POST {base_url}/chat (timeout={chat_timeout_sec}s)")
    try:
        chat = post_json(
            f"{base_url}/chat",
            {
                "message": "Create a quick marketing plan for a local cafe with limited budget.",
                "context": {
                    "business": "local",
                    "goal": "sales",
                    "budget": "small",
                },
            },
            timeout_sec=chat_timeout_sec,
        )
        response = chat.get("response", "")
        print("Chat response preview:", response[:180].replace("\n", " "))
    except Exception as exc:
        print("Chat test failed:", exc)
        return 1

    print("Smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
