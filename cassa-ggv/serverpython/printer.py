# Modulo di stampa ESC/POS per Cassa GGV.
# Supporta due tipi di stampante:
#   - usb  : scrive direttamente su /dev/usb/lp*
#   - rete : apre un socket TCP sulla porta 9100
from functools import reduce
import socket

class PrintError(Exception):
    """Errore di stampa con indicazione della stampante e del motivo."""
    def __init__(self, nomestampante, errore):
        self.nomestampante = nomestampante
        self.errore = errore

    def __str__(self):
        return 'Impossibile stampare su ' + self.nomestampante + \
            '\n(dovresti provare a cambiare stampante tan):\n' + self.errore

def printPos(richiesta):
    """Stampa un ordine. Genera un ticket ESC/POS per ogni voce (o per ogni unità
    se dividiStampa è True) e lo invia alla stampante indicata nella richiesta."""
    tipostampante = richiesta['stampante']['tipo']
    nomestampante = richiesta['stampante']['nome']
    if tipostampante == 'usb':
        if not nomestampante.startswith('/dev/usb/lp'):
            raise PrintError(nomestampante, nomestampante + ' deve essere /dev/usb/lp*')
        printfunc = lambda pos: printfile(nomestampante, pos)
    elif tipostampante == 'rete':
        printfunc = lambda pos: printsocket(nomestampante, pos)
    else:
        raise PrintError(
            nomestampante,
            'Tipo stampante non valido: '+tipostampante)

    # Genera e invia un ticket per ogni elemento restituito da toPosCodes
    for pos in toPosCodes(richiesta['ordine']['voci']):
        printfunc(pos)

def printPosPrenotazioni(richiesta):
    """Stampa l'elenco delle prenotazioni su un singolo ticket."""
    tipostampante = richiesta['stampante']['tipo']
    nomestampante = richiesta['stampante']['nome']
    if tipostampante == 'usb':
        if not nomestampante.startswith('/dev/usb/lp'):
            raise PrintError(nomestampante, nomestampante + ' deve essere /dev/usb/lp*')
        printfunc = lambda pos: printfile(nomestampante, pos)
    elif tipostampante == 'rete':
        printfunc = lambda pos: printsocket(nomestampante, pos)
    else:
        raise PrintError(
            nomestampante,
            'Tipo stampante non valido: '+tipostampante)

    # Formatta ogni prenotazione come "qta nome (note)" e le unisce con separatore
    pos = [' '.join((str(r['qta']),r['nome'],'('+r['note']+')')) for r in richiesta['prenotazioni']]
    printfunc('\n\n\x1d\x21\x12' + '\n---\n'.join(pos) + '\n\n\n\n\n\n\n\x1b\x6d')

def toPosCodes(voci):
    """Converte la lista di voci ordine in una lista di stringhe ESC/POS.
    Le voci con dividiStampa=True producono un ticket separato per ogni unità."""
    def aggregaVoci(pos, voce):
        if not voce.get('dividiStampa', False):
            # Un solo ticket per tutta la quantità
            pos.append(generateSinglePos(voce))
        else:
            # Un ticket per ogni unità (es. cucine diverse)
            nuova = {'gruppo':voce['gruppo'], 'nome':voce['nome'], 'qta':1}
            pos += [generateSinglePos(nuova) for i in range(voce['qta'])]
        return pos
    return reduce(aggregaVoci, voci, [])


def generateSinglePos(voce):
    """Genera la stringa ESC/POS per un singolo ticket.
    Struttura: intestazione festival → gruppo centrato → quantità e nome → note (se presenti) → avanzamento carta."""
    # \x1d\x21\x13 = dimensione carattere doppia larghezza e doppia altezza
    pos = '\x1d\x21\x13'
    pos += '  ValmoFestival Tridi'
    # \x1d\x21\x12 = doppia altezza
    pos += '\n\n\x1d\x21\x12'

    # Centra il nome del gruppo su 23 caratteri (larghezza riga con font grande)
    pos += ' ' * ((23-len(voce['gruppo'])) // 2)
    pos += voce['gruppo']
    pos += ' ' * ((23-len(voce['gruppo'])) // 2)

    # \x1d\x21\x11 = doppia larghezza
    pos += '\n\n\x1d\x21\x11'
    qta = voce['qta'] if isinstance(voce['qta'],str) else str(voce['qta'])
    pos += ' '+ qta +'x '+ voce['nome']

    # Aggiunge le note tra separatori se presenti
    if 'note' in voce.keys() and voce['note'] != '':
        pos += '\n\n'
        pos += '------------------------'
        pos += '\n        '+voce['note']+'\n'
        pos += '------------------------'

    # Avanza la carta e taglia (\x1b\x6d = partial cut)
    pos += '\n\n\n\n\n\n\n\x1b\x6d'
    return pos


def printfile(filename, pos):
    """Scrive la stringa ESC/POS direttamente sul device file USB (/dev/usb/lp*)."""
    try:
        with open(filename, 'w') as file:
            file.write(pos)
    except OSError as e:
        raise PrintError(filename, 'errore '+str(e.errno)+': '+e.strerror)

def printsocket(url, pos):
    """Invia la stringa ESC/POS a una stampante di rete tramite socket TCP sulla porta 9100."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((url,9100))
            s.send(bytes(pos,'utf'))
    except OSError as e:
        raise PrintError(url, 'errore '+str(e.errno)+': '+e.strerror)
