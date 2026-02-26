# Server HTTP statico per Cassa GGV.
# Serve la cartella ../www sulla porta 8000 e gestisce le richieste
# di stampa e di elenco stampanti via HTTP.
from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import printer, json, os #, cgi

class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        # Controlla se il percorso corrisponde a una route GET registrata
        if self.path[1:] in Handler.gets.keys():
            return Handler.gets[self.path[1:]](self)

      #  self.path = '../www' + self.path
        # Rimuove eventuali parametri query string prima di servire il file statico
        self.path = self.path.split('?')[0] # trick malevolo per togliere i parametri
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # Rimuove lo slash iniziale e delega al handler POST registrato
        if self.path.startswith('/'):
            self.path = self.path[1:]
        Handler.posts.get(self.path, Handler.richiestasconosciuta)(self)

    def do_OPTIONS(self):
        # Risponde alle preflight CORS con 200
        self.exit()

    def stampa(self):
        # Legge l'ordine dal body JSON e lo invia alla stampante ESC/POS
        try:
            printer.printPos(self.parseRequest())
            self.exit()
        except printer.PrintError as pe:
            self.exit(500, str(pe))

    def stampaPrenotazioni(self):
        # Legge le prenotazioni dal body JSON e le stampa
        try:
            printer.printPosPrenotazioni(self.parseRequest())
            self.exit()
        except printer.PrintError as pe:
            self.exit(500, str(pe))


    def stampanti(self):
        # Restituisce l'elenco delle stampanti USB disponibili in /dev/usb/lp*
        def _help(usb):
            return {'nome':usb, 'tipo':'usb', 'nomeMenu':'usb-'+usb[2]}
        stampanti = [ _help(f) for f in os.listdir('/dev/usb') if f.startswith('lp')]
        self.exit(200, json.dumps(stampanti), 'application/javascript')

    def richiestasconosciuta(self):
        self.exit(400,'Richiesta sconosciuta: ' + self.path)


    def parseRequest(self):
        # Legge e decodifica il body della richiesta POST come JSON
        post = self.rfile.read(int(self.headers['Content-Length']))
        return json.loads(post.decode('utf8'))


    def exit(self, exitno=200, exitmess='Regular', contenttype='text/text'):
        # Invia la risposta HTTP con status code, Content-Type e corpo
        self.send_response(exitno)
        self.send_header('Content-Type', contenttype)
        self.end_headers()
        self.wfile.write(exitmess.encode('utf8'))



# Registra le route GET e POST usando il nome del metodo come percorso URL
Handler.gets  = { f.__name__:f for f in [Handler.stampanti] }
Handler.posts = { f.__name__:f for f in [Handler.stampa, Handler.stampaPrenotazioni] }


if __name__ == '__main__':
    # Cambia directory in ../www in modo che SimpleHTTPRequestHandler serva i file statici
    os.chdir('../www')
    httpd = HTTPServer(('', 8000), Handler)
    print('Avvio server...')
    httpd.serve_forever()
