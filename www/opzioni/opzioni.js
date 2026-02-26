angular.module('GGVApp-opzioni',[])

.service('opzioni',function(){
    // TODO attenzione: ora sembra non andare perchè nel modal stampo 
    // l'oggetto _opzioni_elenco che è statico e non varia in base a ordine in localstorage!
    var opzioni = JSON.parse(
        window.localStorage.getItem(
            'opzioni',
            JSON.stringify(_opzioni))
    );

    var stampanteLocal = window.localStorage.getItem('stampante');
    var stampanteTmp = stampanteLocal != null
    ? JSON.parse(stampanteLocal)
    : null; // TODO valutare

    //console.log(stampanteTmp);
    if(stampanteTmp !== null) { 
        for(var s_idx in opzioni.stampanti){
            var s = opzioni.stampanti[s_idx];
            if(s.nome === stampanteTmp.nome && s.tipo === stampanteTmp.tipo){
                opzioni.stampante = opzioni.stampanti[s_idx];
            }
        } 
    }

    opzioni.watch('stampante',function(id,vecchio,nuovo){ 
        window.localStorage.setItem('stampante',JSON.stringify(nuovo));
        return nuovo;
    });
	
	
	opzioni.getCouchDbSyncString = function(){
		return 'http://' + opzioni.server[2].valore + ':' + opzioni.server[3].valore;
 	};
	
	opzioni.getPythonPrinterString = function(){
		return 'http://' + opzioni.server[0].valore + ':' + opzioni.server[1].valore;
 	};
	
	opzioni.getServer = function(nome){
		for(voce in opzioni.server){
			if(opzioni.server[voce].nome === nome) 
				return opzioni.server[voce];
		}
		return null;
	};
	
    return opzioni;
})


.controller( 'GGVApp-OpzioniController',  
            ['$scope','opzioni',function ($scope,opzioni){
                $scope.opzioni = opzioni;
        }])

.controller('GGVApp-OpzioniModalController', 
            ['$http','$scope','opzioni',function ($http, $scope, opzioni) {

                $scope.opzioni = opzioni;
                $scope.opzioni_modal = angular.copy($scope.opzioni);

                $scope.ok = function () {
                    /*
        for(var opzione_idx in $scope.opzioni_elenco){
            $scope.opzioni[$scope.opzioni_elenco[opzione_idx].nome] = 
                $scope.opzioni_elenco[opzione_idx].valore;
        }
        */
               //     $scope.opzioni = angular.copy($scope.opzioni_modal);
                    // TODO mantenere riferimento come in stampanti 
                    // in questo caso si riassegna a server le coppie chiavi valore aggiornate
                    $scope.opzioni.server = angular.copy($scope.opzioni_modal.server);
                    
                    // trick per copiare array mantenendo riferimenti (svuoto e riempio)
                    while($scope.opzioni.stampanti.length > 0){
                        $scope.opzioni.stampanti.pop();
                    }
                    for(s in $scope.opzioni_modal.stampanti){
                        $scope.opzioni.stampanti.push($scope.opzioni_modal.stampanti[s]);
                    }
                    
             //       opzioni.opzioni = $scope.opzioni;
                    console.log($scope.opzioni);
                    window.localStorage.setItem('opzioni',JSON.stringify($scope.opzioni));
                };

                $scope.cancel = function () {
                    $scope.opzioni_modal = angular.copy($scope.opzioni);
                    console.log($scope.opzioni);
                };

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
