import time
import json
import pprint
from functools import reduce

class PrintError(Exception):
    def __init__(self, stampante, errore):
        self.stampante = stampante
        self.errore = errore
        
    def __str__(self):
        return 'Impossibile stampare sulla stampante ' +  \
            self.stampante + ': ' + self.errore

richiesta_str = '''{
    "nomeRichiesta": "stampa",
    "stampante": {
        "tipo": "file", 
        "nome": "/dev/usb/lp4"
    },
    "ordine": {
        "timestamp" : "''' + str(time.time()) + '''",
        "cassa" : "cassa-1",
        "voci" : [
            {"nome":"birra", "qta":3, "gruppo":"bar"},
            {"nome":"patolle", "qta":2, "gruppo":"cucina", "dividiStampa":1},
            {"nome":"strippi vari", "qta":100, "gruppo":"cucina"}
        ]
    }
}
'''


def printPos(richiesta):
    tipostampante = richiesta['stampante']['tipo']
    nomestampante = richiesta['stampante']['nome']
    if tipostampante == 'file':
        printfunc = lambda pos: printfile(nomestampante, pos)
    elif tipostampante == 'socket':
        printfunc = lambda pos: printsocket(nomestampante, pos)
    else:
        raise PrintError(
            richiesta['stampante'], 
            'Tipo stampante non valido: '+tipostampante)
    
    for pos in toPosCodes(richiesta['ordine']['voci']):
        print('printing...')
        printfunc(pos)

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
    pos += '  '+ qta +'x '+ voce['nome']
    pos += '\n\n\n\n\n\n\n\x1b\x6d'
    return pos


def printfile(filename, pos):
    with open(filename, 'w') as file:
        file.write(pos)

def printsocket(url, pos):
    pass


def parseRichiesta(self):
    post = self.rfile.read(int(self.headers['Content-Length']))
    return json.loads(post.decode('utf8'))
    '''
    form = cgi.FieldStorage(
        fp=self.rfile, 
        headers=self.headers,
        environ={'REQUEST_METHOD':'POST',
                 'CONTENT_TYPE':self.headers.get('Content-Type','json')})
                 
    strreq = form['richiesta'].value  
    richiesta = json.loads(strreq)
    return richiesta
    '''
    

richiesta = json.loads(richiesta_str)
pprint.PrettyPrinter().pprint(richiesta)

for i in range(10):
    printPos(richiesta)