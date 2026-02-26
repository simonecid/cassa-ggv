// Oggetti JavaScript puri (senza dipendenze AngularJS) che modellano un ordine.
// Caricati prima dei moduli Angular perché usati anche fuori dal framework.

// Rappresenta un ordine completo con tutte le voci del menu (qta inizialmente 0).
// Costruito a partire dal catalogo menu; contiene metodi per archiviare e stampare.
function Ordine(menu) {

    this.timestamp = Date.now();
    this.cassa = "Test"; // TODO ragionare su id cassa
    this.note = ""; // TODO nota che le note le hanno le voci!!!
    this.progressivo = 0; // TODO valutare se serve
    this.voci = [];
	this.asporto = false;

    // Popola voci con una voceOrdine per ogni prodotto del menu
    for(var gruppo in menu){
        if(!menu.hasOwnProperty(gruppo)) continue;
        for(var i in menu[gruppo]){
            this.voci.push(new voceOrdine(
                menu[gruppo][i].nome,
                gruppo,
                menu[gruppo][i].prezzo,
                menu[gruppo][i].gruppo,   // gruppo stampato (può differire dalla chiave)
                menu[gruppo][i].stampa    // undefined → true (stampato di default)
            ));
        }
    }

    // Cerca una voce per nome; restituisce null se non trovata
    this.vocePerNome = function(nome){
        for(var voce in this.voci){
            if(this.voci[voce].nome === nome)
                return this.voci[voce];
        }
        return null;
    };

    // Restituisce un oggetto ridotto con solo le voci da stampare (qta > 0, stampa=true).
    // Clona le voci per non alterare l'ordine originale.
    // Aggiunge la nota "Asporto" se l'ordine o la singola voce è da asporto.
    this.ordinePerStampa = function(){
        var nuovo = new Object();
        var nuova_voce = new Ordine();
        nuovo.timestamp = Date.now();
        nuovo.voci = [];
        for(v in this.voci){
            if(this.voci[v].qta > 0 && this.voci[v].stampa){
				// Aggiunge la nota "Asporto" per voci asporto (escluso bar se asporto globale)
				if(this.voci[v].asporto || (this.asporto && this.voci[v].gruppo !== 'bar')){
					if(this.voci[v].note === ''){
						this.voci[v].note = 'Asporto';
					}
					else{
						this.voci[v].note = 'Asporto\n' + '  ' + this.voci[v].note;
					}
				}
                nuova_voce = clone(this.voci[v]);
                // Sostituisce il gruppo con gruppoStampato per la stampa ESC/POS
                nuova_voce.gruppo = nuova_voce.gruppoStampato;
                nuovo.voci.push(nuova_voce);
            }
        }
        return nuovo;
    }

    // Restituisce l'oggetto da salvare in CouchDB/PouchDB:
    // solo le voci con qta > 0, con prezzo unitario e totale precalcolato.
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

    // Converte una voceOrdine nel formato minimale per l'archivio
    this.datiArchivioSingolaVoce = function(voce){
        var nuova = new Object();
        nuova.qta = voce.qta;
        nuova.nome = voce.nome;
        nuova.gruppo = voce.gruppo;
        nuova.prezzounitario = voce.prezzo;
        nuova.prezzototale = voce.prezzo * voce.qta;
        return nuova;
    }


    // Azzera tutte le quantità, note e flag; aggiorna il timestamp per il prossimo ordine
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

// Rappresenta una singola riga dell'ordine (un prodotto del menu).
// gruppoStampato può differire da gruppo: gruppo è la chiave della sezione del menu,
// gruppoStampato è il testo che appare sul ticket ESC/POS.
function voceOrdine(prodotto, gruppo, prezzo, gruppoStampato, stampa){
    this.qta = 0;
    this.nome = prodotto;
    this.gruppo = gruppo;
    this.gruppoStampato = gruppoStampato;
    this.prezzo = prezzo;
    this.dividiStampa = false; // se true: un ticket per unità invece che uno per voce
    this.stampa = stampa !== undefined ? stampa : true; // false = non stampare (es. contorni inclusi)
    this.note = "";
    this.inc = function() { this.qta++; };
    this.dec = function() { if(this.qta > 0) this.qta--; };

    // Apre un prompt nativo per inserire la nota della voce
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
