'use strict';

// ---------------------------------------------------------------------------
// printer.js — stampa ESC/POS dal browser
//
// Tipo 'usb':
//   Usa la WebUSB API (Chrome/Edge su HTTPS o localhost).
//   Prima di stampare, chiama selezionaStampanteUsb() su un gesto utente
//   (click) e salva il dispositivo restituito in richiesta.stampante.device.
//
// Tipo 'rete':
//   I browser non possono aprire socket TCP raw, quindi NON è possibile
//   connettersi direttamente alla stampante su porta 9100.
//   È necessario avviare ws-printer-bridge.js (o ws-printer-bridge.py) sulla macchina host:
//     node ws-printer-bridge.js <ip-stampante>      →  ascolta su ws://localhost:9101
//     python ws-printer-bridge.py <ip-stampante>    →  ascolta su ws://localhost:9101
//   In questo caso passa come nome: "ws://localhost:9101"
// ---------------------------------------------------------------------------

// Errore di stampa con informazioni sul dispositivo che ha fallito.
class PrintError extends Error {
    constructor(nomestampante, errore) {
        super(
            'Impossibile stampare su ' + nomestampante +
            '\n(dovresti provare a cambiare stampante tan):\n' + errore
        );
        this.nomestampante = nomestampante;
        this.errore = errore;
    }
}

// ---------------------------------------------------------------------------
// Generazione codici ESC/POS
// ---------------------------------------------------------------------------

// Genera il ticket ESC/POS per una singola voce dell'ordine.
// Restituisce un Uint8Array con i byte pronti per la stampante.
function generateSinglePos(voce) {
    var parts = [];

    // GS ! n  (0x1d 0x21 n) — imposta la dimensione del carattere.
    // 0x13 = bit4 (doppia altezza) + bit0+bit1 (doppia larghezza) → carattere 4x grande.
    parts.push('\x1d\x21\x13');
    parts.push('  ValmoFestival Tridi');    // intestazione del ticket

    // 0x12 = bit4 (doppia altezza) + bit1 (larghezza x2) → leggermente più piccolo.
    parts.push('\n\n\x1d\x21\x12');

    // Centra il nome del gruppo su 23 colonne (larghezza della carta con font 12pt).
    // Il padding viene applicato sia a sinistra che a destra.
    var gruppo = voce.gruppo;
    var pad = Math.max(0, Math.floor((23 - gruppo.length) / 2));
    parts.push(' '.repeat(pad) + gruppo + ' '.repeat(pad));

    // 0x11 = bit4 (doppia altezza) soltanto → testo più alto ma larghezza normale.
    parts.push('\n\n\x1d\x21\x11');
    // Riga principale: "  2x Birra Media"
    parts.push(' ' + String(voce.qta) + 'x ' + voce.nome);

    // Le note appaiono solo se presenti, racchiuse tra separatori.
    if (voce.note && voce.note !== '') {
        parts.push('\n\n');
        parts.push('------------------------');
        parts.push('\n        ' + voce.note + '\n');
        parts.push('------------------------');
    }

    // 7 righe di avanzamento carta + ESC m (0x1b 0x6d) = taglio parziale.
    parts.push('\n\n\n\n\n\n\n\x1b\x6d');

    // TextEncoder produce UTF-8; i byte di controllo ESC/POS (< 0x20) passano invariati.
    return new TextEncoder().encode(parts.join(''));
}

// Converte l'array di voci dell'ordine in una lista di ticket ESC/POS (uno per voce).
// Se una voce ha dividiStampa=true, viene stampata una copia per ogni unità
// (utile quando le voci vanno a reparti diversi che devono ricevere un ticket ciascuno).
function toPosCodes(voci) {
    var result = [];
    voci.forEach(function (voce) {
        if (!voce.dividiStampa) {
            // Un solo ticket per tutta la quantità ("3x Birra Media").
            result.push(generateSinglePos(voce));
        } else {
            // Un ticket separato per ogni unità ("1x Birra Media" × 3).
            for (var i = 0; i < voce.qta; i++) {
                result.push(generateSinglePos({
                    gruppo: voce.gruppo,
                    nome:   voce.nome,
                    qta:    1
                }));
            }
        }
    });
    return result;
}

// ---------------------------------------------------------------------------
// Stampa USB — WebUSB API
// ---------------------------------------------------------------------------

// Apre il dialogo del browser per scegliere un dispositivo USB.
// DEVE essere chiamata da un gestore di evento utente (es. click),
// altrimenti il browser blocca la richiesta per motivi di sicurezza.
// Restituisce una Promise<USBDevice> da conservare e passare in richiesta.stampante.device.
function selezionaStampanteUsb() {
    if (!navigator.usb)
        return Promise.reject(new Error('WebUSB non è supportato da questo browser'));
    // filters: [] mostra tutti i dispositivi USB; si può filtrare per vendorId se noto.
    return navigator.usb.requestDevice({ filters: [] });
}

// Funzione di test per scrivere il buffer di byte ESC/POS su file
async function _printFile(filename, content) {
    const handle = await window.showSaveFilePicker({                                                                                     
        suggestedName: filename,                                                                                                         
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
}

// Invia un buffer di byte ESC/POS a una stampante USB già selezionata.
// Il flusso WebUSB richiede: open → (selectConfiguration) → claimInterface → transferOut → release → close.
function _printUsb(device, data) {
    var interfaceNum = null;  // numero di interfaccia USB da usare
    var endpointNum  = null;  // numero dell'endpoint bulk OUT su cui scrivere

    return device.open()
        .then(function () {
            // Seleziona la configurazione 1 solo se il dispositivo non ha già una configurazione attiva.
            if (device.configuration === null) return device.selectConfiguration(1);
        })
        .then(function () {
            // Scorre tutte le interfacce e gli endpoint per trovare il bulk OUT.
            // Le stampanti ESC/POS espongono sempre almeno un endpoint bulk OUT per ricevere i dati.
            device.configuration.interfaces.forEach(function (iface) {
                iface.alternates.forEach(function (alt) {
                    alt.endpoints.forEach(function (ep) {
                        if (ep.direction === 'out' && ep.type === 'bulk') {
                            interfaceNum = iface.interfaceNumber;
                            endpointNum  = ep.endpointNumber;
                        }
                    });
                });
            });
            if (interfaceNum === null)
                throw new PrintError(
                    device.productName || 'USB',
                    'Nessun endpoint bulk OUT trovato sulla stampante'
                );
            // "Claim" dell'interfaccia: necessario prima di poter scrivere.
            return device.claimInterface(interfaceNum);
        })
        .then(function () {
            // Trasferisce i byte ESC/POS verso la stampante.
            return device.transferOut(endpointNum, data);
        })
        .then(function () { return device.releaseInterface(interfaceNum); })
        .then(function () { return device.close(); })
        .catch(function (e) {
            // Assicura che il dispositivo venga chiuso anche in caso di errore.
            device.close().catch(function () {});
            if (e instanceof PrintError) throw e;
            throw new PrintError(device.productName || 'USB', e.message);
        });
}

// ---------------------------------------------------------------------------
// Stampa di rete — WebSocket bridge
// ---------------------------------------------------------------------------

// Invia i byte ESC/POS al bridge WebSocket→TCP locale (ws-printer-bridge.js / ws-printer-bridge.py).
// Il bridge apre una connessione TCP verso la stampante su porta 9100 e vi inoltra i dati.
// La connessione WebSocket viene chiusa subito dopo l'invio: ogni ticket è un job indipendente.
function _printSocket(wsUrl, data) {
    return new Promise(function (resolve, reject) {
        var ws;
        try {
            ws = new WebSocket("ws://" + wsUrl);
            // binaryType = 'arraybuffer' assicura che i messaggi binari in ingresso
            // (non usati qui, ma buona pratica) arrivino come ArrayBuffer.
            ws.binaryType = 'arraybuffer';
        } catch (e) {
            reject(new PrintError(wsUrl, e.message));
            return;
        }
        ws.onopen  = function () {
            ws.send(data);   // invia il Uint8Array; WebSocket lo trasmette come frame binario
            ws.close();
            resolve();
        };
        ws.onerror = function () {
            reject(new PrintError(wsUrl, 'Errore WebSocket — il bridge è in esecuzione?'));
        };
    });
}

// ---------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------

// Stampa un ordine. I ticket vengono inviati in sequenza (uno per volta)
// per evitare di sovraccaricare la stampante con trasferimenti sovrapposti.
//
// richiesta = {
//   stampante: { tipo: 'usb', nome: "usb 2", device: <USBDevice> }
//             | { tipo: 'rete', nome: "rete 1", device: 'ws://localhost:9101' }
//             | { tipo: 'file', nome: "un file", device: '/tmp/output' }
//   ordine:   { voci: [...] }
// }
function printPos(richiesta) {
    var tipo  = richiesta.stampante.tipo;
    var nome  = richiesta.stampante.nome || '';
    var codes = toPosCodes(richiesta.ordine.voci);  // genera un Uint8Array per ogni ticket

    if (tipo === 'file') {
        return codes.reduce(function (p, pos) {
            return p.then(function () { return _printFile(nome, pos); });
        }, Promise.resolve());
    }

    if (tipo === 'usb') {
        var device = richiesta.stampante.device;
        if (!device)
            return Promise.reject(new PrintError(
                nome, 'Nessun dispositivo USB. Chiama selezionaStampanteUsb() prima.'
            ));
        // reduce incatena le Promise in serie: aspetta la fine di ogni ticket prima del prossimo.
        return codes.reduce(function (p, pos) {
            return p.then(function () { return _printUsb(device, pos); });
        }, Promise.resolve());
    }

    if (tipo === 'rete') {
        return codes.reduce(function (p, pos) {
            return p.then(function () { return _printSocket(nome, pos); });
        }, Promise.resolve());
    }

    return Promise.reject(new PrintError(nome, 'Tipo stampante non valido: ' + tipo));
}

// Stampa un elenco di prenotazioni su un unico ticket continuo.
// Le righe sono separate da "---" e il tutto viene tagliato alla fine.
//
// richiesta = {
//   stampante: { tipo: 'usb', device: <USBDevice> }
//             | { tipo: 'rete', nome: 'ws://localhost:9101' }
//   prenotazioni: [{ qta, nome, note }, ...]
// }
function printPosPrenotazioni(richiesta) {
    var tipo = richiesta.stampante.tipo;
    var nome = richiesta.stampante.nome || '';

    // Formatta ogni prenotazione come "2 Bistecca (ben cotta)".
    var lines = richiesta.prenotazioni.map(function (r) {
        return r.qta + ' ' + r.nome + ' (' + r.note + ')';
    });

    // Un unico blocco ESC/POS: font medio, righe separate da "---", poi taglio.
    var data = new TextEncoder().encode(
        '\n\n\x1d\x21\x12' + lines.join('\n---\n') + '\n\n\n\n\n\n\n\x1b\x6d'
    );

    if (tipo === 'file') {
        var percorso = richiesta.stampante.device;
        return _printFile(percorso, data);
    }

    if (tipo === 'usb') {
        var device = richiesta.stampante.device;
        if (!device)
            return Promise.reject(new PrintError(nome, 'Nessun dispositivo USB.'));
        return _printUsb(device, data);
    }

    if (tipo === 'rete') return _printSocket(nome, data);

    return Promise.reject(new PrintError(nome, 'Tipo stampante non valido: ' + tipo));
}