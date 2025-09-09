from fastapi import FastAPI, HTTPException
import subprocess
import json
from typing import Any

app = FastAPI(title="AlphaFi tBTC Market API")


def fetch_tbtc_from_node() -> Any:
    """Invoke the Node script to fetch live TBTC market JSON (marketId 14)."""
    try:
        # Call: node index.js --json
        proc = subprocess.run(
            ["node", "index.js", "--json"],
            check=True,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.CalledProcessError as e:
        # Node process returned non-zero exit; include stderr for debugging
        raise HTTPException(status_code=500, detail=f"Node script failed: {e.stderr}")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout calling node index.js --json")

    stdout = proc.stdout.strip()
    if not stdout:
        raise HTTPException(status_code=502, detail="Empty response from node index.js --json")

    # index.js prints a single JSON object for --json mode
    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        # Return the raw text to help diagnose
        raise HTTPException(status_code=502, detail=f"Invalid JSON from node script: {e}: {stdout[:500]}")
    return data


@app.get("/tbtc")
async def get_tbtc_market():
    return fetch_tbtc_from_node()
