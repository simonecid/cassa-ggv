// order object

function Ordine(menu) {

    this.timestamp = Date.now();
    this.cassa = "Test"; // TODO ragionare su id cassa
    this.note = ""; // TODO nota che le note le hanno le voci!!!
    this.progressivo = 0; // TODO valutare se serve
    this.voci = [];
	this.asporto = false;
    
//    this.voci = {}; // old
    
//    var _menuFlat = oneLevelFlatten(Object.values(menu));
//    for(var i in _menuFlat){
//        this.voci[_menuFlat[i].nome] = new voceOrdine();
//    }
    for(var gruppo in menu){
        if(!menu.hasOwnProperty(gruppo)) continue;
        for(var i in menu[gruppo]){
        //    this.voci[menu[gruppo][i].nome] =  // old
            this.voci.push(new voceOrdine(
                menu[gruppo][i].nome,
                gruppo,
                menu[gruppo][i].prezzo,
                menu[gruppo][i].gruppo,
                menu[gruppo][i].stampa
            ));
        }
    }
    
    this.vocePerNome = function(nome){
        for(var voce in this.voci){
            if(this.voci[voce].nome === nome)
                return this.voci[voce];
        }
        return null;
    };
    
    this.ordinePerStampa = function(){
        var nuovo = new Object();
        var nuova_voce = new Ordine();
        nuovo.timestamp = Date.now();
        nuovo.voci = [];
        for(v in this.voci){
            //console.log(this.voci[v]);
            if(this.voci[v].qta > 0 && this.voci[v].stampa){
				if(this.voci[v].asporto || (this.asporto && this.voci[v].gruppo !== 'bar')){
					if(this.voci[v].note === ''){
						this.voci[v].note = 'Asporto';
					}
					else{
						this.voci[v].note = 'Asporto\n' + '  ' + this.voci[v].note;
					}
				}
                nuova_voce = clone(this.voci[v]);
                nuova_voce.gruppo = nuova_voce.gruppoStampato;
                nuovo.voci.push(nuova_voce);
            }   
        }
        return nuovo;
    }
    
    this.datiArchivio = function(){ 
        var nuovo = new Object();
        nuovo.timestamp = Date.now();
        nuovo.voci = [];
        for(v in this.voci){
            if(this.voci[v].qta > 0){
				nuovo.voci.push(this.datiArchivioSingolaVoce(this.voci[v]));
            }   
        }
        return nuovo;
    }
    
    this.datiArchivioSingolaVoce = function(voce){
        var nuova = new Object();
        nuova.qta = voce.qta;
        nuova.nome = voce.nome;
        nuova.gruppo = voce.gruppo;
        nuova.prezzounitario = voce.prezzo;
        nuova.prezzototale = voce.prezzo * voce.qta;
        return nuova;
    }
    
	
    this.reset = function(){
        this.timestamp = Date.now();
        this.cassa = "Test"; // TODO ragionare su id cassa
        this.note = ""; // TODO nota che le voci le hanno le note!!!
		this.asporto = false;
        this.progressivo = 0; // TODO valutare se serve
        for(v in this.voci){
            this.voci[v].qta = 0;
            this.voci[v].note = "";
			this.voci[v].dividiStampa = false;
            this.voci[v].asporto=false;
        }
    };
    
    
};

function voceOrdine(prodotto, gruppo, prezzo, gruppoStampato, stampa){
    //console.log(prodotto, gruppo);
    this.qta = 0;
    this.nome = prodotto; 
    this.gruppo = gruppo;
    this.gruppoStampato = gruppoStampato;
    this.prezzo = prezzo;
    this.dividiStampa = false;
    this.stampa = stampa !== undefined ? stampa : true;
    this.note = "";
    this.inc = function() { this.qta++; };
    this.dec = function() { if(this.qta > 0) this.qta--; };

    this.readNote = function () {
        this.note = window.prompt("Note per "+this.nome,this.note);
    };

    this.toString = function(){
        return this.qta+'x'+' '+this.nome;
    };
}
  /*
function voceOrdine(){
  var hidden_val = 0;
  this.inc = function() { hidden_val++; }
  this.dec = function() { if(hidden_val > 0) hidden_val--; }
  this.val = function() { return hidden_val; }
}*/
