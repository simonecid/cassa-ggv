from functools import reduce
import socket

class PrintError(Exception):
    def __init__(self, nomestampante, errore):
        self.nomestampante = nomestampante
        self.errore = errore
        
    def __str__(self):
        return 'Impossibile stampare su ' + self.nomestampante + \
            '\n(dovresti provare a cambiare stampante tan):\n' + self.errore

def printPos(richiesta):
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

    for pos in toPosCodes(richiesta['ordine']['voci']):
        printfunc(pos)

def printPosPrenotazioni(richiesta):
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
    
    pos = [' '.join((str(r['qta']),r['nome'],'('+r['note']+')')) for r in richiesta['prenotazioni']]
    printfunc('\n\n\x1d\x21\x12' + '\n---\n'.join(pos) + '\n\n\n\n\n\n\n\x1b\x6d')

def toPosCodes(voci):
    def aggregaVoci(pos, voce):
        if not voce.get('dividiStampa', False):
            pos.append(generateSinglePos(voce))
        else:
            nuova = {'gruppo':voce['gruppo'], 'nome':voce['nome'], 'qta':1}
            pos += [generateSinglePos(nuova) for i in range(voce['qta'])]
        return pos
    return reduce(aggregaVoci, voci, [])


def generateSinglePos(voce):
    pos = '\x1d\x21\x13'
    pos += '  ValmoFestival Tridi'
    pos += '\n\n\x1d\x21\x12'
    
    pos += ' ' * ((23-len(voce['gruppo'])) // 2)
    # center (23 è il numero di caratteri stampabili per riga, con dimensione carattere 12)
    pos += voce['gruppo']
    pos += ' ' * ((23-len(voce['gruppo'])) // 2)
    
    pos += '\n\n\x1d\x21\x11'
    qta = voce['qta'] if isinstance(voce['qta'],str) else str(voce['qta'])
    pos += ' '+ qta +'x '+ voce['nome']
    if 'note' in voce.keys() and voce['note'] != '':
        pos += '\n\n'
        pos += '------------------------'
        pos += '\n        '+voce['note']+'\n'
        pos += '------------------------'

    pos += '\n\n\n\n\n\n\n\x1b\x6d'
    return pos


def printfile(filename, pos):
    try:
        with open(filename, 'w') as file:
            file.write(pos)
    except OSError as e:
        raise PrintError(filename, 'errore '+str(e.errno)+': '+e.strerror)
        
def printsocket(url, pos):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((url,9100))
            s.send(bytes(pos,'utf'))
    except OSError as e:
        raise PrintError(url, 'errore '+str(e.errno)+': '+e.strerror)
     
