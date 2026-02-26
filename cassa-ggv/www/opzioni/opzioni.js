// Modulo GGVApp-opzioni: gestisce la configurazione per-postazione.
// I valori sono persistiti in localStorage; al primo avvio vengono usati
// i default definiti in db/opzioni.js (_opzioni).
angular.module('GGVApp-opzioni',[])

.service('opzioni',function(){
    // TODO attenzione: ora sembra non andare perchè nel modal stampo
    // l'oggetto _opzioni_elenco che è statico e non varia in base a ordine in localstorage!

    // Carica le opzioni salvate; se non ci sono usa i default da db/opzioni.js
    var opzioni = JSON.parse(
        window.localStorage.getItem(
            'opzioni',
            JSON.stringify(_opzioni))
    );

    // Ripristina la stampante selezionata nell'ultima sessione cercandola per nome e tipo
    var stampanteLocal = window.localStorage.getItem('stampante');
    var stampanteTmp = stampanteLocal != null
    ? JSON.parse(stampanteLocal)
    : null; // TODO valutare

    if(stampanteTmp !== null) {
        for(var s_idx in opzioni.stampanti){
            var s = opzioni.stampanti[s_idx];
            if(s.nome === stampanteTmp.nome && s.tipo === stampanteTmp.tipo){
                opzioni.stampante = opzioni.stampanti[s_idx];
            }
        }
    }

    // Ogni volta che viene selezionata una stampante, la persiste in localStorage
    opzioni.watch('stampante',function(id,vecchio,nuovo){
        window.localStorage.setItem('stampante',JSON.stringify(nuovo));
        return nuovo;
    });


    // Restituisce l'URL base del server CouchDB (es. "http://192.168.1.1:5984")
	opzioni.getCouchDbSyncString = function(){
		return 'http://' + opzioni.server[2].valore + ':' + opzioni.server[3].valore;
 	};

    // Restituisce l'URL base del server di stampa Python (es. "http://192.168.1.1:8000")
	opzioni.getPythonPrinterString = function(){
		return 'http://' + opzioni.server[0].valore + ':' + opzioni.server[1].valore;
 	};

    // Cerca un'opzione server per nome (es. "default-doppio-schermo")
	opzioni.getServer = function(nome){
		for(voce in opzioni.server){
			if(opzioni.server[voce].nome === nome)
				return opzioni.server[voce];
		}
		return null;
	};

    return opzioni;
})


// Controller per la visualizzazione semplice delle opzioni (sola lettura)
.controller( 'GGVApp-OpzioniController',
            ['$scope','opzioni',function ($scope,opzioni){
                $scope.opzioni = opzioni;
        }])

// Controller del modale di configurazione opzioni.
// Lavora su una copia (opzioni_modal) per permettere di annullare le modifiche.
.controller('GGVApp-OpzioniModalController',
            ['$http','$scope','opzioni',function ($http, $scope, opzioni) {

                $scope.opzioni = opzioni;
                $scope.opzioni_modal = angular.copy($scope.opzioni);

                $scope.ok = function () {
                    // Copia i valori server dalla copia modale all'oggetto opzioni reale
                    $scope.opzioni.server = angular.copy($scope.opzioni_modal.server);

                    // Aggiorna l'array stampanti mantenendo il riferimento originale
                    // (svuota e riempi invece di riassegnare, per preservare i watch)
                    while($scope.opzioni.stampanti.length > 0){
                        $scope.opzioni.stampanti.pop();
                    }
                    for(s in $scope.opzioni_modal.stampanti){
                        $scope.opzioni.stampanti.push($scope.opzioni_modal.stampanti[s]);
                    }

                    // Persiste le opzioni aggiornate
                    console.log($scope.opzioni);
                    window.localStorage.setItem('opzioni',JSON.stringify($scope.opzioni));
                };

                // Annulla: ripristina la copia modale dai valori correnti
                $scope.cancel = function () {
                    $scope.opzioni_modal = angular.copy($scope.opzioni);
                    console.log($scope.opzioni);
                };

                // Interroga il server Python per ottenere le stampanti USB collegate,
                // mantiene quelle di rete già configurate
                $scope.aggiornaStampanti = function(){
                    $http.get('./stampanti')
                    .success(function(data, status, headers, config){
                        for(s in $scope.opzioni_modal.stampanti){
                            var stampante = $scope.opzioni_modal.stampanti[s];
                            if(stampante.tipo == 'rete'){
                                data.push(stampante);
                            }
                        }
                        $scope.opzioni_modal.stampanti = data;
                    })
                    .error(function(data, status, headers, config){
                        console.log('err! '+[data, status, headers, config]);
                    });
                }

                $scope.nuovaStampante = {'nomeMenu':'', 'nome':'', 'tipo':''}
                $scope.inserisciNuovaStampante = function(){
                    $scope.opzioni_modal.stampanti.push($scope.nuovaStampante);
                    $scope.nuovaStampante = {'nomeMenu':'', 'nome':'', 'tipo':''}
                }

                $scope.rimuoviStampante = function(index)  {
                    $scope.opzioni_modal.stampanti.splice(index , 1);
                }

                // Ripristina i valori di fabbrica definiti in db/opzioni.js
				$scope.resetOpzioni = function(){
					$scope.opzioni_modal = angular.copy(_opzioni);
				}

            }])


.directive('modalOpzioni',function(){
    return {
        restrict : 'E',
        controller : 'GGVApp-OpzioniModalController',
        templateUrl : 'opzioni/opzioni.html'
    };
})

;
