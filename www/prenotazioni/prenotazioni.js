angular.module('GGVApp-prenotazioni', [])

	// TODO remote server via opzioni
	.service('prenotazioni', ['opzioni', function (opzioni) {

		var db = new PouchDB('prenotazioni');
		db.replicate.to(opzioni.getCouchDbSyncString()+'prenotazioni', {live: true});

		this.prenotazioni = function () {
			return db.allDocs({include_docs: true});
		};

		this.aggiungi = function (prenotazione) {
			db.post(prenotazione);
		};

		this.elimina = function (prenotazione) {
			db.remove(prenotazione);
		};

		return this;

	}])

	.controller('GGVApp-PrenotazioniModalController',
		['$scope', '$http', 'prenotazioni', 'opzioni', 
			function ($scope, $http, prenotazioni, opzioni) {

				$scope.pasti = ['pranzo domenica', 'cena domenica', 'cena sabato'];
				$scope.nuova = {nome: '', qta: '', pasto: 'pranzo domenica', note: ''};

				$scope.prenotazioni;
				
				function aggiornaPrenotazioni() {
					prenotazioni.prenotazioni().then(function (p) {
						$scope.$apply(function(){
							$scope.prenotazioni = p.rows;
						});
					});
				};
				
				aggiornaPrenotazioni();

				$scope.aggiungi = function () {
					if ($scope.nuova.nome === '' || $scope.nuova.qta === '') {
						alert('Tan metti almeno il nome e il numero di persone!');
						return;
					}
					prenotazioni.aggiungi($scope.nuova);
					$scope.nuova = {nome: '', qta: '', pasto: 'pranzo domenica', note: ''};
					aggiornaPrenotazioni();
				};

				$scope.elimina = function (prenotazione) {
					prenotazioni.elimina(prenotazione);
					aggiornaPrenotazioni();
				};
				
				
				$scope.stampa = function(){
					dati = $scope.prenotazioni.map(function(p){
						return {
							qta: p.doc.qta,
							nome: p.doc.nome,
							note: p.doc.note
						};
					});
					var r = {
						stampante: opzioni.stampante,
						prenotazioni: dati
					};
					// TODO sistemare indirizzi
					$http.post(opzioni.getPythonPrinterString()+'/stampaPrenotazioni',r).then(
						function(risp){
							console.log(risp);
						},
						function(err){
							console.log(err);;
						}
					);
					
				}

			}])


	.directive('modalPrenotazioni', function () {
		return {
			restrict: 'E',
			controller: 'GGVApp-PrenotazioniModalController',
			templateUrl: 'prenotazioni/prenotazioni.html'
		};
	})
	;
