# Cassa-GGV Project Memory

## Architecture Overview

**Desired target architecture** (being implemented):
1. **Central server**: runs CouchDB + HTTP/www server (no printing)
2. **Host machines**: only a web browser + ability to print via USB

**Original architecture**:
1. Central server: CouchDB only
2. Host machines: Python server (port 8000) + web browser + USB printing

## Repository Structure

```
cassa-ggv/                  (original/reference version)
cassa-ggv-backend/          (central server — no printing)
cassa-ggv-frontend/         (host client — browser + printing)
```

Each directory contains:
- `serverpython/` — Python HTTP server
- `www/` — AngularJS frontend (served on port 8000)
- `couchdb/` — CouchDB design docs and config

## Key Files

| File | Purpose |
|------|---------|
| `*/serverpython/server.py` | Python HTTP server (BaseHTTPRequestHandler) on port 8000 |
| `*/serverpython/printer.py` | ESC/POS thermal printer logic (USB + network) |
| `*/www/index.html` | AngularJS app entry point |
| `*/www/ordine/ordine.js` | Main order module |
| `*/www/ordine/azioni_ordine.js` | Print/archive/sync actions |
| `*/www/db/menu.js` | Product catalog |
| `*/couchdb/local.txt` | CouchDB config (port 5984, CORS open) |

## Server Routes (original server.py)

- **GET** `stampanti` → lists USB printers from `/dev/usb/`
- **POST** `stampa` → prints order via ESC/POS
- **POST** `stampaPrenotazioni` → prints reservations
- Static files served from `../www` via `SimpleHTTPRequestHandler`

## Changes Made

### `cassa-ggv-backend/serverpython/server.py`
- Removed `import printer`
- Removed `stampa`, `stampaPrenotazioni`, `stampanti` methods
- Removed `parseRequest` method
- `Handler.gets = {}` and `Handler.posts = {}` (no custom routes)
- Result: pure static file server for `../www` on port 8000

## Tech Stack

- **Backend**: Python 3 stdlib (`http.server`, `socket`)
- **Frontend**: AngularJS 1.x, PouchDB 3.3.0 (offline sync), Bootstrap, jQuery
- **Database**: CouchDB (persistent) + PouchDB (client-side, syncs to CouchDB)
- **Printing**: ESC/POS thermal printers via USB (`/dev/usb/lp*`) or TCP socket (port 9100)

## Known Issues / Notes

- `cassa-ggv-backend/serverpython/printer.py` line 14 has `import pdb ; pdb.set_trace()` — debug breakpoint left in (not imported in backend server anymore)
- CouchDB CORS is open to all origins (`origins = *`)
- Festival name in receipts: "ValmoFestival Tridi"
- Language: Italian throughout

## Data Model

```
Ordine { timestamp, cassa, note, voci: voceOrdine[], asporto }
voceOrdine { nome, gruppo, prezzo, qta, note, dividiStampa, stampa }
```
