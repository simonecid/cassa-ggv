# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Point-of-sale system for the GGV festival. Each cashier station runs entirely in the browser; a central server hosts CouchDB and serves the static files.

## Running the system

**Central server** (one machine on the LAN):

```bash
# 1. Install CouchDB config (once)
cp cassa-ggv/couchdb/local.ini /etc/couchdb/local.ini
sudo systemctl restart couchdb

# 2. Create the database (once)
curl -X PUT http://localhost:5984/ordini

# 3. Start the HTTP static file server
cd cassa-ggv/serverpython
python server.py          # serves www/ on port 8000
```

**Cashier stations** (any machine on the LAN):

- Open Chrome or Edge at `http://<ip-server>:8000`
- Go to Opzioni and set the server IPs/ports

There is no build step, no package manager for the frontend, and no test runner. All JS/CSS libraries are vendored in `www/lib/`.

## Architecture

```text
Central server (port 8000 HTTP, port 5984 CouchDB)
    └── serverpython/server.py   ← Python static file server + print handler
    └── www/                     ← served to all browsers

Cashier station (browser)
    └── PouchDB (local)   ─── replicate.to ──→ CouchDB (remote)
    └── HTTP POST /stampa ─── ESC/POS JSON ──→ server.py → USB/TCP printer
```

PouchDB syncs one-way (`replicate.to`) to CouchDB. Offline orders are queued locally and flushed when connectivity is restored. The sync status indicator (✓/✗) is driven by PouchDB's `change` and `error` events in `azioni_ordine.js`.

## Frontend module structure

The AngularJS 1.x app (`GGVApp`) is split into modules loaded via `<script>` tags:

| File | Module / purpose |
| ---- | ---------------- |
| `www/db/menu.js` | Defines `_menu` global, writes to `localStorage` |
| `www/db/opzioni.js` | Defines `_opzioni` defaults, writes to `localStorage` |
| `www/js/app.js` | Root module `GGVApp`, `menu` service, sync status |
| `www/ordine/orders_obj.js` | Plain-JS `Ordine` and `voceOrdine` constructors |
| `www/ordine/ordine.js` | `GGVApp-ordine` module: order state, dual-screen window |
| `www/ordine/azioni_ordine.js` | `azioniOrdine` service: PouchDB sync, print HTTP call, archive |
| `www/opzioni/opzioni.js` | `GGVApp-opzioni` module: settings persisted in `localStorage` |
| `www/prenotazioni/prenotazioni.js` | Reservations module |
| `www/messaggi/messaggi.js` | Messages panel |

## Printing

Printing is handled by the **Python server** (`printer.py`). The browser POSTs to `http://<pythonPrinterHost>:<pythonPrinterPort>/stampa` with a JSON payload `{stampante, ordine}`. The server calls `printer.printPos()`, which encodes the order as ESC/POS and either:

- writes to `/dev/usb/lp*` (USB), or
- opens a TCP socket to port 9100 (network).

The function `toPosCodes(voci)` splits items with `dividiStampa: true` into one ticket per unit. Header text is hardcoded as `"ValmoFestival Tridi"` in `generateSinglePos()` in `printer.py`.

## Menu and options

- **Menu**: edit `www/db/menu.js` — the `_menu` object. Each item has `{nome, gruppo, prezzo}`, optional `stampa: false` suppresses printing. The file writes to `localStorage` on every page load, so the in-browser copy always reflects the file.
- **Default options** (printer IPs, CouchDB host): edit `www/db/opzioni.js`. Per-station overrides are stored in `localStorage` and survive page reloads.
- `voceOrdine.gruppoStampato` overrides the printed group label (set from `menu[item].gruppo`, distinct from the tab group key).

## Target architecture (not yet in this repo)

The README describes a planned split:

- `cassa-ggv-backend/` — central server serving only static files (no printing routes)
- `cassa-ggv-frontend/` — cashier client with browser-side printing via WebUSB API and a `ws-bridge.js`/`ws-bridge.py` for TCP printers

The current `cassa-ggv/` directory is the working reference implementation where all printing is handled server-side by `server.py` + `printer.py`.
