# AlphaFi tBTC Market API

This repo provides:

- A Node.js script (`index.js`) that queries AlphaFi AlphaLend for the tBTC market (marketId 14) on Sui mainnet using the official SDKs.
- A FastAPI service (`main.py`) that exposes a GET `/tbtc` endpoint returning the live TBTC market JSON by invoking the Node script.

## Tech Stack

- Node.js
  - `@alphafi/alphalend-sdk`
  - `@mysten/sui`
- Python
  - `fastapi`
  - `uvicorn`

## Setup

### Node

Install dependencies:

```bash
npm install
```

Run the script to print TBTC market details:

```bash
node index.js
```

JSON-only (for API integration):

```bash
node index.js --json
```

### Python API (FastAPI)

Install Python deps (choose your interpreter):

Using system Python:

```bash
python3 -m pip install -r requirements.txt
```

Start the API server:

```bash
uvicorn main:app --reload --port 8080
```

Query endpoint:

```bash
curl http://127.0.0.1:8080/tbtc
```

> Note: `/tbtc` internally executes `node index.js --json`, so ensure Node is on PATH for the Python process.

## Files

- `index.js` — Fetches AlphaLend markets, filters TBTC, prints data; `--json` prints raw JSON for marketId 14.
- `main.py` — FastAPI app; GET `/tbtc` invokes `node index.js --json` and returns JSON.
- `requirements.txt` — Python deps for the FastAPI server.
- `package.json` — Node project metadata.
- `.gitignore` — Ignores Node, Python, and IDE artifacts.

## License

MIT
