#!/usr/bin/env python3
"""
printer-bridge.py — bridge WebSocket → TCP/USB per stampanti ESC/POS

Il browser non può aprire socket TCP raw né accedere a dispositivi USB,
quindi printer.js invia i dati via WebSocket a questo bridge, che li
inoltra alla stampante di rete (TCP) o USB.

Uso:
    python ws-printer-bridge.py <ip-stampante>          # stampante di rete
    python ws-printer-bridge.py --usb /dev/usb/lp0     # stampante USB Linux
    python ws-printer-bridge.py --usb USB001            # stampante USB Windows

Valori di default:
    porta-stampante = 9100
    porta-ws        = 9101

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


def forward_to_network_printer(data: bytes, host: str, port: int):
    """Apre una connessione TCP verso la stampante, invia i byte ESC/POS e chiude.

    Le stampanti di rete ESC/POS accettano connessioni stateless su porta 9100:
    ogni job di stampa è una connessione indipendente, esattamente come in printer.py.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        s.sendall(data)   # sendall garantisce che tutti i byte vengano inviati
        # La chiusura del contesto (with) chiude il socket; la stampante riceve EOF e processa il job.


def forward_to_usb_printer(data: bytes, device: str):
    """Invia i byte ESC/POS alla stampante USB scrivendo sul device file.

    Su Linux il kernel espone la stampante USB come /dev/usb/lp0 (o lp1, lp2…).
    Su Windows il device può essere 'USB001', 'LPT1', ecc.
    """
    with open(device, 'wb') as f:
        f.write(data)


async def handler(websocket, args):
    """Gestisce una connessione WebSocket dal browser.

    Ogni messaggio ricevuto corrisponde a un ticket ESC/POS completo.
    La stampa viene eseguita in un executor (thread separato) perché
    le operazioni I/O sono bloccanti e non possono essere chiamate
    direttamente nell'event loop asyncio senza congelare le altre connessioni.
    """

    debug_mode=args.debug

    async for message in websocket:
        # Il browser invia i dati come frame binario (Uint8Array); websockets
        # li consegna come bytes. Se per errore arrivasse come stringa, la codifica.
        data = message if isinstance(message, bytes) else message.encode('utf-8')
        try:
            # run_in_executor esegue la funzione di stampa in un thread del pool
            # predefinito di asyncio, senza bloccare l'event loop

            if debug_mode:
                print(data)
                return

            if args.usb:
                await asyncio.get_event_loop().run_in_executor(
                    None, forward_to_usb_printer, data, args.usb
                )
            else:
                await asyncio.get_event_loop().run_in_executor(
                    None, forward_to_network_printer, data, args.printer_host, args.printer_port
                )

        except OSError as e:
            # Stampa l'errore ma non chiude il bridge: la prossima stampa può andare a buon fine.
            print(f'Errore stampante: {e}')


async def main(args):

    ws_port=args.ws_port

    print('Bridge WebSocket avviato')
    print(f'  Ascolto WebSocket: ws://127.0.0.1:{ws_port}')
    if args.usb:
        print(f'  Stampante USB: {args.usb}')
    else:
        print(f'  Stampante rete: {args.printer_host}:{args.printer_port}')

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
        description='Bridge WebSocket → TCP/USB per stampanti ESC/POS',
        epilog=(
            'Esempi:\n'
            '  rete: python printer-bridge.py --printer_host 192.168.1.50\n'
            '  USB:  python printer-bridge.py --usb /dev/usb/lp0'
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument('--printer_host', default=None,
                        help='IP della stampante di rete (non necessario con --usb)')
    parser.add_argument('--printer_port', type=int, default=9100,
                        help='Porta TCP della stampante (default: 9100)')
    parser.add_argument('--usb', default=None,
                        help='Device file della stampante USB (es. /dev/usb/lp0 su Linux, USB001 su Windows)')
    parser.add_argument('--ws_port', type=int, default=9101,
                        help='Porta WebSocket locale (default: 9101) dove ascolta il bridge')
    parser.add_argument('--debug', action='store_true',
                        help='Stampa a schermo per debug invece di mandare alla stampante')
    args = parser.parse_args()

    if not args.usb and not args.printer_host:
        parser.error('specificare o --printer_host IP_STAMPANTE per la rete oppure --usb DEVICE per USB')
        
    if args.usb and args.printer_host:
    parser.error('specificare o --printer_host IP_STAMPANTE per la rete oppure --usb DEVICE per USB')

    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        print('\nBridge fermato.')