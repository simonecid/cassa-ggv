var _opzioni = {
    "server": [
        {nome:"pythonPrinterHost", valore:"localhost", inMenu:true, type:'text'},
        {nome:"pythonPrinterPort", valore:8000, inMenu:true, type:'number'},
        {nome:"couchDBHost", valore:"localhost", inMenu:true, type:'text'},
        {nome:"couchDBPort", valore:5984, inMenu:true, type:'number'},
        {nome:"default-doppio-schermo", valore:false, type:'checkbox'},
        
    ],
    "stampanti": [
        // USB: il dispositivo viene scelto dal browser al momento della prima stampa (WebUSB).
        // Il campo "nome" è solo un'etichetta; non viene usato per la comunicazione.
        {"nomeMenu" : "USB", "tipo": "usb", "nome": "usb"},
        // Rete: "nome" è l'URL WebSocket del bridge locale (ws-printer-bridge.js / ws-printer-bridge.py).
        // Avviare il bridge con: node ws-printer-bridge.js <ip-stampante>
        {"nomeMenu" : "rete-202", "tipo": "rete", "nome": "ws://localhost:9101"},
        {"nomeMenu" : "rete-203", "tipo": "rete", "nome": "ws://localhost:9101"},
    ]
};

if(localStorage.getItem('opzioni') == null){
    localStorage.setItem('opzioni', JSON.stringify(_opzioni));
}