angular.module('GGVApp-scorte', [])

// TODO query: http://localhost:5984/ordini/_design/scorte/_view/nome_timestamp?startkey=[%22patatine%22,0]&endkey=[%22patatine%22,9999999999999999999999999999999]&group_level=1

	// TODO remote server via opzioni
	.service('scorte', function (opzioni) {

		var db = new PouchDB(opzioni.getCouchDbSyncString() + 'scorte');
		//db.replicate.to('http://localhost:5984/scorte', {live: true});

		this.changes = db.changes({live: true});

		this.scorte = function () {
			return db.allDocs({include_docs: true});
		};

		this.aggiungi = function (scorta) {
			return db.post(scorta);
		};

		this.elimina = function (scorta) {
			return db.remove(scorta);
		};

		return this;

	})

	.service('scorteEffettive', function (opzioni, scorte) {
		var db = new PouchDB(opzioni.getCouchDbSyncString() + 'ordini/_design/scorte/_view/nome_timestamp');
		
		this.get = function (scorta) {
			console.log(scorta);
			
			return db.allDocs({
				key:scorta.prodotto,
				include_docs: true,
				startkey: [scorta.prodotto, scorta.timestap],
				endkey: [scorta.nome, 9999999999999999999999999999999],
				group_level: 1});
		};
		
		return this;
	})

	.controller('GGVApp-ScorteModalController',
		['$scope', 'scorte', 'scorteEffettive', 'menu',
			function ($scope, scorte, scorteEffettive, menu) {
				$scope.prodotti = [''];
				for (g in menu) {
					for (p in menu[g]) {
						console.log(menu[g][p].nome);
						$scope.prodotti.push(menu[g][p].nome);
					}
				}

				$scope.nuovaScorta = {prodotto: '', qta: '', timestamp: ''};

				$scope.scorte;
				$scope.scorteEffettive;

				function aggiornaScorte() {
					scorte.scorte().then(function (p) {
						$scope.$apply(function () {
							$scope.scorte = p.rows;
						});
					});
				}
				;

				aggiornaScorte();

				$scope.aggiungiScorta = function () {
					if ($scope.nuovaScorta.prodotto === '' || $scope.nuovaScorta.qta === '') {
						alert('Tan metti almeno il nome e il numero!!');
						return;
					}
					for (s in $scope.scorte) {
						if ($scope.scorte[s].doc.prodotto === $scope.nuovaScorta.prodotto) {
							alert('Tan c\'è già una scorta per questo prodotto! (Toglila...)');
							return;
						}
					}
					$scope.nuovaScorta.timestamp = Date.now();
					scorte.aggiungi($scope.nuovaScorta).then(aggiornaScorte);
					$scope.nuovaScorta = {prodotto: '', qta: '', timestamp: ''};
				};

				$scope.elimina = function (scorta) {
					scorte.elimina(scorta).then(aggiornaScorte);
				};


				function aggiornaScorteTutto(){
					aggiornaScorte();
					aggiornaScorteEffetive();
				}

				function aggiornaScortaEffetiva(scorta){
					scorteEffettive.get(scorta).then(function(scortaEffettiva){
						console.log(scortaEffettiva);
						return;
						$scope.scorteEffettive[s] = {
							'nome':$scope.scorte[s].prodotto,
							'effettive':scortaEffettiva.value
						};
						$scope.$apply(function () {
							$scope.scorte = p.rows;
						});
					});
				}

				function aggiornaScorteEffetive() {
					$scope.scorteEffettive = [];
					for (var s in $scope.scorte) {
						aggiornaScortaEffetiva($scope.scorte[s].doc);
					}
				}
				
				function aggiungiScorta(scorta){
					console.log("aggiungo");
					console.log(scorta);
					$scope.scorte.push(scorta);
				};
				
				//scorte.changes.on('change', aggiornaScorte);
				scorte.changes.on('create', aggiungiScorta);
				scorte.changes.on('delete', aggiornaScorte);

				
			}])


	.directive('modalScorte', function () {
		return {
			restrict: 'E',
			controller: 'GGVApp-ScorteModalController',
			templateUrl: 'scorte/modal_scorte.html'
		};
	})

	.directive('pannelloScorte', function () {
		return {
			restrict: 'E',
			controller: 'GGVApp-ScorteModalController',
			templateUrl: 'scorte/pannello_scorte.html'
		};
	})
	;
