// Modulo GGVApp-messaggi: pannello di messaggi condivisi tra le casse.
// A differenza degli ordini, questo DB punta direttamente a CouchDB remoto
// (non ha un DB locale PouchDB separato) e usa il feed changes per il live update.
angular.module('GGVApp-messaggi', [])

	.service('messaggi', function (opzioni) {

		// Connessione diretta al DB CouchDB remoto (nessuna copia locale)
		var db = new PouchDB(opzioni.getCouchDbSyncString()+'messaggi');

		// Feed di cambiamenti in ascolto continuo, usato per aggiornare la vista in tempo reale
		this.changes = db.changes({live: true});

		// Restituisce una Promise con tutti i messaggi
		this.messaggi = function () {
			return db.allDocs({include_docs: true});
		};

		// Aggiunge un messaggio al DB remoto
		this.aggiungi = function (mes) {
			return db.post(mes);
		};

		// Elimina un messaggio dal DB remoto
		this.elimina = function (mes) {
			return db.remove(mes);
		};

		return this;

	})

	.controller('GGVApp-MessaggiController',
		['$scope', 'messaggi', function ($scope, messaggi) {
				$scope.messaggi;

				$scope.nuovoMessaggio = {mes: '', mittente: '', timestamp: ''};

				// Aggiorna la lista messaggi nello scope fuori dal ciclo digest
				function aggiornaMessaggi() {
					messaggi.messaggi().then(function (p) {
						$scope.$apply(function(){
							$scope.messaggi = p.rows;
						});
					});
				};

				aggiornaMessaggi();

				$scope.aggiungiMessaggio = function () {
					if ($scope.nuovoMessaggio.mes === '') {
						alert('Tan scrivi qualcosa!');
						return;
					}

					$scope.nuovoMessaggio.timestamp = Date.now();
					messaggi.aggiungi($scope.nuovoMessaggio).then(aggiornaMessaggi);
					// Azzera il form dopo l'invio
					$scope.nuovoMessaggio = {mes: '', mittente: '', timestamp: ''};
				};

				$scope.elimina = function (mes) {
					messaggi.elimina(mes).then(aggiornaMessaggi);
				};


				// Aggiorna la vista in tempo reale al ricevimento di qualsiasi evento dal feed
				messaggi.changes.on('change', aggiornaMessaggi );
				messaggi.changes.on('create', aggiornaMessaggi );
				messaggi.changes.on('delete', aggiornaMessaggi );

			}])

/*
	.directive('modalMessaggi', function () {
		return {
			restrict: 'E',
			controller: 'GGVApp-MessaggiController',
			templateUrl: 'messaggi/modal_messaggi.html'
		};
	})
*/

	.directive('pannelloMessaggi', function () {
		return {
			restrict: 'E',
			controller: 'GGVApp-MessaggiController',
			templateUrl: 'messaggi/pannello_messaggi.html'
		};
	})
	;
