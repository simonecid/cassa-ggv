from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import printer, json, os #, cgi

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path[1:] in Handler.gets.keys():
            return Handler.gets[self.path[1:]](self)
        
      #  self.path = '../www' + self.path
        self.path = self.path.split('?')[0] # trick malevolo per togliere i parametri
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.startswith('/'):
            self.path = self.path[1:]
        Handler.posts.get(self.path,Handler.richiestasconosciuta)(self)
   
    def do_OPTIONS(self):
        self.exit()
       
    def stampa(self):
        try:
            printer.printPos(self.parseRequest())
            self.exit()
        except printer.PrintError as pe:
            self.exit(500, str(pe)) 
   
    def stampaPrenotazioni(self):
        try:
            printer.printPosPrenotazioni(self.parseRequest())
            self.exit()
        except printer.PrintError as pe:
            self.exit(500, str(pe)) 
   


    def stampanti(self):
        def _help(usb):
            return {'nome':usb, 'tipo':'usb', 'nomeMenu':'usb-'+usb[2]}
        stampanti = [ _help(f) for f in os.listdir('/dev/usb') if f.startswith('lp')]
        self.exit(200, json.dumps(stampanti), 'application/javascript')
    
    def richiestasconosciuta(self):
        self.exit(400,'Richiesta sconosciuta: ' + self.path)
        
        
    def parseRequest(self):
        post = self.rfile.read(int(self.headers['Content-Length']))
        return json.loads(post.decode('utf8'))


    def exit(self, exitno=200, exitmess='Regular', contenttype='text/text'):
        self.send_response(exitno)
        self.send_header('Content-Type', contenttype)
        self.end_headers()
        self.wfile.write(exitmess.encode('utf8'))
    


Handler.gets = { f.__name__:f for f in [Handler.stampanti] }
Handler.posts = { f.__name__:f for f in [Handler.stampa, Handler.stampaPrenotazioni] }
            

if __name__ == '__main__':
    os.chdir('../www')
    httpd = HTTPServer(('', 8000), Handler)
    print('Avvio server...')
    httpd.serve_forever()
