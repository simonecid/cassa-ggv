var _opzioni = {
    "server": [
        {nome:"pythonPrinterHost", valore:"localhost", inMenu:true, type:'text'},
        {nome:"pythonPrinterPort", valore:8000, inMenu:true, type:'number'},
        {nome:"couchDBHost", valore:"localhost", inMenu:true, type:'text'},
        {nome:"couchDBPort", valore:5984, inMenu:true, type:'number'},
        {nome:"default-doppio-schermo", valore:false, type:'checkbox'},
        
    ],
    "stampanti": [
        {"nomeMenu" : "usb-2", "tipo": "usb", "nome":"/dev/usb/lp2"},
        {"nomeMenu" : "usb-3", "tipo": "usb", "nome":"/dev/usb/lp3"},
        {"nomeMenu" : "usb-4", "tipo": "usb", "nome":"/dev/usb/lp4"},
        {"nomeMenu" : "rete-202", "tipo": "rete", "nome":"192.168.1.202"},
        {"nomeMenu" : "rete-203", "tipo": "rete", "nome":"192.168.1.203"},
    ]
};

if(localStorage.getItem('opzioni') == null){
    localStorage.setItem('opzioni', JSON.stringify(_opzioni));
}