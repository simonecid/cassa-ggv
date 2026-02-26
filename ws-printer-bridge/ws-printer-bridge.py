#!/usr/bin/env python3
"""
ws-printer-bridge.py — bridge WebSocket → TCP per stampanti ESC/POS di rete

Il browser non può aprire socket TCP raw, quindi printer.js (tipo 'rete')
invia i dati via WebSocket a questo bridge, che li inoltra alla stampante
sulla porta 9100.

Uso:
    python ws-printer-bridge.py <ip-stampante> [porta-stampante] [porta-ws]

Valori di default:
    porta-stampante = 9100
    porta-ws        = 9101

Esempio:
    python ws-printer-bridge.py 192.168.1.50

In printer.js usare come nome stampante: "ws://localhost:9101"

Dipendenza: pip install websockets
"""

import argparse
import asyncio
import socket
import sys

try:
    import websockets
except ImportError:
    print('Dipendenza mancante. Installa con: pip install websockets')
    sys.exit(1)


def forward_to_printer(data: bytes, host: str, port: int):
    """Apre una connessione TCP verso la stampante, invia i byte ESC/POS e chiude.

    Le stampanti di rete ESC/POS accettano connessioni stateless su porta 9100:
    ogni job di stampa è una connessione indipendente, esattamente come in printer.py.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        s.sendall(data)   # sendall garantisce che tutti i byte vengano inviati
        # La chiusura del contesto (with) chiude il socket; la stampante riceve EOF e processa il job.


async def handler(websocket, args):
    """Gestisce una connessione WebSocket dal browser.

    Ogni messaggio ricevuto corrisponde a un ticket ESC/POS completo.
    La stampa TCP viene eseguita in un executor (thread separato) perché
    socket.connect() è bloccante e non può essere chiamata direttamente
    nell'event loop asyncio senza congelare le altre connessioni.
    """
    
    printer_host=args.printer_host
    printer_port=args.printer_port
    
    debug_mode=args.debug
    
    async for message in websocket:
        # Il browser invia i dati come frame binario (Uint8Array); websockets
        # li consegna come bytes. Se per errore arrivasse come stringa, la codifica.
        data = message if isinstance(message, bytes) else message.encode('utf-8')
        try:
            # run_in_executor esegue forward_to_printer in un thread del pool
            # predefinito di asyncio, senza bloccare l'event loop
            
            if debug_mode: 
                print(data)
                return
            
            await asyncio.get_event_loop().run_in_executor(
                None, forward_to_printer, data, printer_host, printer_port
            )
            
        except OSError as e:
            # Stampa l'errore ma non chiude il bridge: la prossima stampa può andare a buon fine.
            print(f'Errore TCP verso stampante: {e}')


async def main(args):
    
    printer_host=args.printer_host
    printer_port=args.printer_port
    ws_port=args.ws_port
    
    print('Bridge WebSocket→TCP avviato')
    print(f'  WebSocket: ws://127.0.0.1:{ws_port}')
    print(f'  Stampante: {printer_host}:{printer_port}')
    
    if args.debug:
        print(f'### Modalita debug attivata ###')
        

    # Il server ascolta solo su localhost: non deve essere raggiungibile
    # dall'esterno, serve solo al browser sulla stessa macchina.
    async with websockets.serve(
        lambda ws: handler(ws, args),
        host='localhost',
        port=ws_port,
    ):
        # asyncio.Future() senza risultato atteso tiene il server in esecuzione
        # indefinitamente finché il processo non viene interrotto (Ctrl+C).
        await asyncio.Future()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Bridge WebSocket → TCP per stampanti ESC/POS di rete',
        epilog='Esempio: python ws-printer-bridge.py <ip-stampante> ',
    )
    parser.add_argument('printer_host', help='IP della stampante di rete')
    parser.add_argument('--printer_port', type=int, default=9100,
                        help='Porta TCP della stampante (default: 9100)')
    parser.add_argument('--ws_port', type=int, default=9101,
                        help='Porta WebSocket locale (default: 9101)')
    parser.add_argument('--debug', type=bool, default=False,
                        help='Stampa a schermo per debug invece di mandare alla stampante')
    args = parser.parse_args()

    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        print('\nBridge fermato.')