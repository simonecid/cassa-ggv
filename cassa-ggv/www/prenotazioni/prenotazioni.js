// Modulo GGVApp-prenotazioni: gestione delle prenotazioni pasti.
// Le prenotazioni sono salvate in un DB PouchDB locale replicato su CouchDB.
angular.module('GGVApp-prenotazioni', [])

	// TODO remote server via opzioni
	.service('prenotazioni', ['opzioni', function (opzioni) {

		// DB locale PouchDB per le prenotazioni, replicato live su CouchDB
		var db = new PouchDB('prenotazioni');
		db.replicate.to(opzioni.getCouchDbSyncString()+'prenotazioni', {live: true});

		// Restituisce una Promise con tutti i documenti prenotazione
		this.prenotazioni = function () {
			return db.allDocs({include_docs: true});
		};

		// Aggiunge una nuova prenotazione al DB locale
		this.aggiungi = function (prenotazione) {
			db.post(prenotazione);
		};

		// Rimuove una prenotazione dal DB locale (e la propaga via replica)
		this.elimina = function (prenotazione) {
			db.remove(prenotazione);
		};

		return this;

	}])

	.controller('GGVApp-PrenotazioniModalController',
		['$scope', '$http', 'prenotazioni', 'opzioni',
			function ($scope, $http, prenotazioni, opzioni) {

				// Pasti disponibili mostrati nel select del modale
				$scope.pasti = ['pranzo domenica', 'cena domenica', 'cena sabato'];
				$scope.nuova = {nome: '', qta: '', pasto: 'pranzo domenica', note: ''};

				$scope.prenotazioni;

				// Aggiorna la lista prenotazioni dallo scope fuori dal ciclo digest
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
					// Azzera il form dopo l'inserimento
					$scope.nuova = {nome: '', qta: '', pasto: 'pranzo domenica', note: ''};
					aggiornaPrenotazioni();
				};

				$scope.elimina = function (prenotazione) {
					prenotazioni.elimina(prenotazione);
					aggiornaPrenotazioni();
				};


				// Stampa l'elenco prenotazioni tramite il server Python
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
