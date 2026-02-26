from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

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
        Handler.posts.get(self.path, Handler.richiestasconosciuta)(self)

    def do_OPTIONS(self):
        self.exit()

    def richiestasconosciuta(self):
        self.exit(400, 'Richiesta sconosciuta: ' + self.path)

    def exit(self, exitno=200, exitmess='Regular', contenttype='text/text'):
        self.send_response(exitno)
        self.send_header('Content-Type', contenttype)
        self.end_headers()
        self.wfile.write(exitmess.encode('utf8'))


Handler.gets = {}
Handler.posts = {}


if __name__ == '__main__':
    os.chdir('../www')
    httpd = HTTPServer(('', 8000), Handler)
    print('Avvio server...')
    httpd.serve_forever()
