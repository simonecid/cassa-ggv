var _opzioni = {
    "server": [
        {nome:"pythonPrinterHost", valore:"127.0.0.1", inMenu:true, type:'text'},
        {nome:"pythonPrinterPort", valore:9101, inMenu:true, type:'number'},
        {nome:"couchDBHost", valore:"127.0.0.1", inMenu:true, type:'text'},
        {nome:"couchDBPort", valore:5984, inMenu:true, type:'number'},
        {nome:"default-doppio-schermo", valore:false, type:'checkbox'},
        
    ],
    "stampanti": [
        // "nome" è l'indirizzo WebSocket del bridge locale (printer-bridge.py).
        // Avviare il bridge con: python printer-bridge.py --printer_host <ip-stampante>
        //                    o:  python printer-bridge.py --usb /dev/usb/lp0
        {"nomeMenu" : "rete-202", "tipo": "rete", "nome": "127.0.0.1:9101"},
        {"nomeMenu" : "rete-203", "tipo": "rete", "nome": "127.0.0.1:9101"},
    ]
};

if(localStorage.getItem('opzioni') == null){
    localStorage.setItem('opzioni', JSON.stringify(_opzioni));
}