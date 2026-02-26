angular.module('GGVAppCliente', [])

	.factory('ordine',function(){ return window.opener.ordine; })

	.controller(
		"GGVAppClienteController", ['$scope','ordine', function ($scope,ordine) {

				// cambio struttura in: [
				//    nomeGruppo -> [ {ordine di gruppo}, ... ] ]
				
				$scope.ordine = ordine;
                $scope.totale = window.opener.totale_ordine;
/*

				$scope.$watch('parentOrdine', function (n,o){
					console.log([n,o]);
					$scope.aggiorna();
				}, true);
				

				$scope.aggiorna = function() {
					$scope.ordine = {};
					$scope.totale_ordine = 0;
					console.log(window.opener.ordine.voci);
					var voce;
					for (v in window.opener.ordine.voci) {
						voce = window.opener.ordine.voci[v];
						$scope.totale_ordine += voce.prezzototale;
						if (!$scope.ordine.hasOwnProperty(voce.gruppo)) {
							$scope.ordine[voce.gruppo] = [];
						}
						$scope.ordine[voce.gruppo].push(voce);
					}
				};
				$scope.aggiorna();
				
				window.aggiorna = function(){
					console.log('window.aggiorna');
					$scope.$apply( function() {
						console.log('$scope.$apply...')
						$scope.aggiorna();
					});
				};

*/
				


			}])

	;
