// Valori predefiniti delle opzioni di configurazione.
// Scritto in localStorage solo al primo avvio (se non esiste già una configurazione).
// Per resettare alle impostazioni di fabbrica usare il pulsante "Reset" nel modale opzioni.
var _opzioni = {
    // Parametri di connessione ai server; l'ordine è significativo:
    // indice 0-1 = server di stampa Python, 2-3 = CouchDB (usati in opzioni.js)
    "server": [
        {nome:"pythonPrinterHost", valore:"localhost", inMenu:true, type:'text'},
        {nome:"pythonPrinterPort", valore:8000,        inMenu:true, type:'number'},
        {nome:"couchDBHost",       valore:"localhost", inMenu:true, type:'text'},
        {nome:"couchDBPort",       valore:5984,        inMenu:true, type:'number'},
        // Se true apre automaticamente la finestra cliente al caricamento della pagina
        {nome:"default-doppio-schermo", valore:false, type:'checkbox'},

    ],
    // Stampanti pre-configurate mostrate nel selettore; modificabili dal modale opzioni
    "stampanti": [
        {"nomeMenu" : "usb-2", "tipo": "usb",  "nome":"/dev/usb/lp2"},
        {"nomeMenu" : "usb-3", "tipo": "usb",  "nome":"/dev/usb/lp3"},
        {"nomeMenu" : "usb-4", "tipo": "usb",  "nome":"/dev/usb/lp4"},
        {"nomeMenu" : "rete-202", "tipo": "rete", "nome":"192.168.1.202"},
        {"nomeMenu" : "rete-203", "tipo": "rete", "nome":"192.168.1.203"},
    ]
};

// Persiste i default solo se non c'è già una configurazione salvata
if(localStorage.getItem('opzioni') == null){
    localStorage.setItem('opzioni', JSON.stringify(_opzioni));
}
