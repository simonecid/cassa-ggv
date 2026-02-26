#!/usr/bin/env node
'use strict';

// ws-bridge.js — bridge WebSocket → TCP per stampanti ESC/POS di rete
//
// Il browser non può aprire socket TCP raw, quindi printer.js (tipo 'rete')
// invia i dati via WebSocket a questo bridge, che li inoltra alla stampante
// sulla porta 9100.
//
// Uso:
//   node ws-bridge.js <ip-stampante> [porta-stampante] [porta-ws]
//
// Valori di default:
//   porta-stampante = 9100
//   porta-ws        = 9101
//
// Esempio:
//   node ws-bridge.js 192.168.1.50
//
// In printer.js usare come nome stampante: "ws://localhost:9101"
//
// Dipendenza: npm install ws

const WebSocket = require('ws');
const net       = require('net');

// Legge i parametri dalla riga di comando.
const printerHost = process.argv[2];
const printerPort = parseInt(process.argv[3] || '9100', 10);
const wsPort      = parseInt(process.argv[4] || '9101', 10);

if (!printerHost) {
    console.error('Uso: node ws-bridge.js <ip-stampante> [porta-stampante] [porta-ws]');
    process.exit(1);
}

// Il server WebSocket ascolta solo su localhost: non deve essere raggiungibile
// dall'esterno, serve solo al browser sulla stessa macchina.
const wss = new WebSocket.Server({ host: 'localhost', port: wsPort });

console.log('Bridge WebSocket→TCP avviato');
console.log('  WebSocket: ws://localhost:' + wsPort);
console.log('  Stampante: ' + printerHost + ':' + printerPort);

wss.on('connection', function (ws) {

    // Ogni messaggio WebSocket corrisponde a un ticket ESC/POS completo.
    ws.on('message', function (data) {

        // Apre una nuova connessione TCP per ogni ticket.
        // Le stampanti di rete ESC/POS accettano connessioni stateless su porta 9100:
        // si connette, si inviano i byte, si chiude — esattamente come fa printer.py.
        const socket = new net.Socket();

        socket.connect(printerPort, printerHost, function () {
            socket.write(data);  // invia i byte ESC/POS grezzi
            socket.end();        // chiude il lato di scrittura (half-close); la stampante elabora e chiude
        });

        socket.on('error', function (e) {
            console.error('Errore TCP verso stampante:', e.message);
            ws.close();  // notifica il browser chiudendo la connessione WebSocket
        });
    });

    ws.on('error', function (e) {
        console.error('Errore WebSocket:', e.message);
    });
});

wss.on('error', function (e) {
    console.error('Errore server WebSocket:', e.message);
    process.exit(1);
});