angular.module('GGVApp-messaggi', [])

	.service('messaggi', function (opzioni) {

		var db = new PouchDB(opzioni.getCouchDbSyncString()+'messaggi');
	
		this.changes = db.changes({live: true});
		
		this.messaggi = function () {
			return db.allDocs({include_docs: true});
		};

		this.aggiungi = function (mes) {
			return db.post(mes);
		};

		this.elimina = function (mes) {
			return db.remove(mes);
		};

		return this;

	})
	
	.controller('GGVApp-MessaggiController',
		['$scope', 'messaggi', function ($scope, messaggi) {
				$scope.messaggi;
				
				$scope.nuovoMessaggio = {mes: '', mittente: '', timestamp: ''};

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
					$scope.nuovoMessaggio = {mes: '', mittente: '', timestamp: ''};
				};

				$scope.elimina = function (mes) {
					messaggi.elimina(mes).then(aggiornaMessaggi);
				};
				
				
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
