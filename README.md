# Cassa GGV

Sistema di cassa per il festival. Ogni postazione (cassa) gira interamente nel browser; il server centrale ospita CouchDB e serve i file statici.

---

## Architettura

```
┌─────────────────────────────────────┐     rete locale
│         SERVER CENTRALE             │ ◄──────────────── browser (qualsiasi macchina)
│                                     │
│  CouchDB          porta 5984        │
│  server.py (www)  porta 8000        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         MACCHINA HOST (cassa)       │
│                                     │
│  Chrome / Edge                      │
│  └─ WebUSB  ──────────► stampante USB
│                                     │
│  ws-printer-bridge  porta 9101  (opzionale) │
│  └─ TCP     ──────────► stampante di rete :9100
└─────────────────────────────────────┘
```

---

## 1. Server centrale

### CouchDB

Copia la configurazione fornita:

```bash
cp couchdb/local.txt /etc/couchdb/local.ini   # path tipico su Linux
sudo systemctl restart couchdb
```

Crea il database al primo avvio:

```bash
curl -X PUT http://localhost:5984/ordini
```

CouchDB ascolterà su **porta 5984** con CORS aperto a tutte le origini.

### Server HTTP (file statici)

Serve la cartella `www/` sulla **porta 8000**:

```bash
cd serverpython
python server.py
```

Le postazioni raggiungeranno l'app su `http://<ip-server>:8000`.

---

## 2. Macchina host (postazione cassa)

Apri Chrome o Edge e vai su `http://<ip-server>:8000`.

### Configurazione (primo avvio)

Apri il pannello **Opzioni** nell'app e imposta:

| Campo | Valore |
|---|---|
| IP server Python | `<ip-server>` |
| Porta server Python | `8000` |
| IP CouchDB | `<ip-server>` |
| Porta CouchDB | `5984` |

### Stampante USB

Non serve nessun software aggiuntivo. Il browser usa la **WebUSB API** per comunicare direttamente con la stampante ESC/POS via USB.

Al primo utilizzo, clicca **"Seleziona stampante"** nell'app: il browser mostrerà un dialogo per scegliere il dispositivo USB. La scelta viene ricordata per le sessioni successive.

> **Requisiti:** Chrome o Edge. La pagina deve essere servita da `localhost` oppure via HTTPS — `http://<ip-server>:8000` va bene se si usa Chrome con il flag `--allow-insecure-localhost`, oppure se il server espone HTTPS.

### Stampante di rete (porta 9100)

I browser non possono aprire socket TCP raw, quindi è necessario avviare il bridge WebSocket→TCP sulla macchina host.

```bash
# Installa la dipendenza (una volta sola)
pip install websockets

# Avvia il bridge
python ws-printer-bridge.py <ip-stampante>
# Opzionale: ws-printer-bridge.py [-h] [--printer_port porta_stampante]
#                    [--ws_port websocket_port] [--debug true/false]
#                    printer_ip
# Default: ws_port: 9101 printer_port: 9100, debug: false
```

Il bridge ascolta su `ws://localhost:9101` di default e inoltra i dati alla stampante.

Nel pannello **Opzioni** dell'app, imposta il nome della stampante di rete come:

```
ws://localhost:9101
```

---

## 3. Stampa dal browser (come funziona)

Il modulo `www/js/printer.js` gestisce la stampa lato browser:

- **Tipo `usb`** → WebUSB API, scrittura diretta sull'endpoint bulk OUT della stampante
- **Tipo `rete`** → WebSocket verso il bridge locale (`ws://localhost:9101`), che apre un socket TCP verso la stampante

I ticket vengono generati in formato **ESC/POS**. La funzione `toPosCodes(voci)` separa le voci con `dividiStampa: true` in un ticket per unità.

---

## 4. Struttura del progetto

```
cassa-ggv/
├── couchdb/
│   └── local.txt          configurazione CouchDB (copiare in /etc/couchdb/local.ini)
├── serverpython/
│   ├── server.py          server HTTP statico (porta 8000)
│   ├── printer.py         logica di stampa originale (Python, riferimento)
│   ├── ws-printer-bridge.js       bridge WebSocket→TCP per stampanti di rete (Node.js)
│   └── ws-printer-bridge.py       bridge WebSocket→TCP per stampanti di rete (Python)
└── www/
    ├── index.html         entry point AngularJS
    ├── js/
    │   └── printer.js     modulo di stampa ESC/POS per il browser
    ├── ordine/            modulo ordine (AngularJS)
    ├── opzioni/           configurazione e selezione stampante
    └── ...
```

---

## 5. Dipendenze

| Componente | Dipendenza |
|---|---|
| CouchDB | CouchDB ≥ 1.x |
| server.py | Python 3 (stdlib) |
| ws-printer-bridge.py | Python 3 + `pip install websockets` |
| Browser | Chrome o Edge (per WebUSB) |
