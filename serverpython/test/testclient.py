from http.client import HTTPConnection
import time

ordine_str = ''' {
    "timestamp" : "''' + str(time.time()) + '''",
    "cassa" : "cassa-1",
    "voci" : [
        {"nome":"birra", "qta":3, "gruppo":"bar"},
        {"nome":"patolle", "qta":2, "gruppo":"cucina", "dividiStampa":1},
        {"nome":"strippi vari", "qta":100, "gruppo":"cucina"}
    ]
}
'''

richiesta_str = '''{
    "nomeRichiesta": "stampa",
    "stampante": {
        "tipo": "file", 
        "nome": "/dev/usb/lp4"
    },
    "ordine":''' + ordine_str + '''
}
'''
'''
h1 = HTTPConnection('localhost',8000)
h1.request('POST', 'stampa', richiesta_str)
print(h1.getresponse().read().decode('utf8'))

'''



h1 = HTTPConnection('localhost',3000)
h1.request('POST', '/stampa', richiesta_str)
print(h1.getresponse().read().decode('utf8'))




'''
# couchdb archiviazione
h1 = HTTPConnection('localhost',5984)
h1.request('POST', '/ordini', ordine_str, 
           headers = {'Content-Type':'application/json'})
print(h1.getresponse().read().decode('utf8'))
'''