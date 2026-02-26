
angular.module('GGVApp-ordine', [])

    .service('ordine', ['menu', function (menu) {
			return new Ordine(menu);
    }])
	
	.service('vistaGestioneOrdine', function () {
		this.viste = [{
				nome: 'Tabella',
				url: 'ordine/gestioneOrdineCorrenteTabella.html'
					//			controller: "GGVApp-gestioneOrdineCorrenteTabellaController"
			},
			{
				nome: 'Icone',
				url: 'ordine/gestioneOrdineCorrenteIcone.html' //,
					//			controller: "GGVApp-gestioneOrdineCorrenteIconeController"
			}];

		var idx = JSON.parse(window.localStorage.getItem("vistaOrdineCorrente"));
		this.vista = idx !== null ? this.viste[idx] : this.viste[1];

		this.vistaLista = function () {
			this.vista = this.viste[0];
			window.localStorage.setItem('vistaOrdineCorrente', 0);
		};
		this.vistaIcone = function () {
			this.vista = this.viste[1];
			window.localStorage.setItem('vistaOrdineCorrente', 1);
		};

		return this;
	})


	.service('finestraCliente', ['ordine','opzioni', function (ordine, opzioni) {
			this.finestraOrdineAttuale = null;
			this.childRootScope = null;
            this.totaleOrdine = 0;
			this.ordineFiltrato = null;

			this.apriFinestraCliente = function () {
				if (this.isAttiva())
					return;
				window.ordine = this.ordineFiltrato;
                window.totale_ordine = this.totaleOrdine;
				this.finestraOrdineAttuale = window.open(
					'cliente/cliente.html',
					'Ordine',
					'fullscreen,dialog'
				);
				
			};

			this.chiudiFinestraCliente = function () {
				if (this.finestraOrdineAttuale === null)
					return;
				this.finestraOrdineAttuale.close();
			}

			this.isAttiva = function () {
				return this.finestraOrdineAttuale !== null && !this.finestraOrdineAttuale.closed;
			};

			this.aggiorna = function () {
				if (!this.isAttiva())
					return;

				window.ordine = this.ordineFiltrato;
                window.totale_ordine = this.totaleOrdine;
				this.finestraOrdineAttuale.location.reload();

				/*
				 if (window.ordine === null)
				 window.ordine = ordine.datiArchivio();
				 else {
				 while (window.ordine.voci.length !== 0) {
				 window.ordine.voci.pop();
				 }
				 var dati = ordine.datiArchivio().dati;
				 for (v in dati) {
				 window.ordine.voci.push(dati[v]);
				 }
				 }
				 */

				//console.log(this.finestraOrdineAttuale.angular);
				//this.finestraOrdineAttuale.aggiorna();
//				this.finestraOrdineAttuale.angular.element('#app-container').scope().$apply();
				//this.finestraOrdineAttuale.location.reload();
				//	console.log(this.finestraOrdineAttuale.aggiorna()); // TODO sistemare aggiornamento
			};

			return this;
		}])


	.controller('GGVApp-vistaGestioneOrdineController', function ($scope, vistaGestioneOrdine) {
		$scope.vistaGestioneOrdine = vistaGestioneOrdine;
	})


	.controller(
		'GGVApp-gestioneOrdineCorrenteController',
		['$scope', 'ordine', 'vistaGestioneOrdine', 'finestraCliente', 'azioniOrdine',
			function ($scope, ordine, vistaGestioneOrdine, finestraCliente, azioniOrdine) {
				$scope.ordine = ordine;
				$scope.totaleOrdine = 0;
				$scope.ultimoTotale = 0;
				$scope.ordineFiltrato = new Object();


                // Aggiunte per resti
				$scope.contanti = 0;
				$scope.contantiUltimoOrdine = 0;

				//    $scope.ordineFiltratoNonVuoto;
				//$scope.finestraCliente = finestraCliente;

				// osservo cambiamenti di quantita
				for (v in ordine.voci) {
					$scope.$watch('ordine.voci[' + v + '].qta', function (n, o) {
						$scope.filtraOrdine();
						finestraCliente.ordineFiltrato = $scope.ordineFiltrato;
                        finestraCliente.totaleOrdine = $scope.totaleOrdine; 
						finestraCliente.aggiorna();
					}, true);
				}

				// TODO assurdo trick, attenzione a ste variabili
				finestraCliente.ordineFiltrato = $scope.ordineFiltrato;


				$scope.filtraOrdine = function () {
					$scope.totaleOrdine = 0;
					$scope.ordineFiltrato = {};

					var voci = ordine.datiArchivio().voci;
					var voce;
					for (v in voci) {
						voce = voci[v];
						$scope.totaleOrdine += voce.prezzototale;
						if (!$scope.ordineFiltrato.hasOwnProperty(voce.gruppo)) {
							$scope.ordineFiltrato[voce.gruppo] = [];
						}
						$scope.ordineFiltrato[voce.gruppo].push(voce);
					}
				};


				$scope.vistaGestioneOrdine = vistaGestioneOrdine;



				// AZIONI SULL'ORDINE
				/*
				 $scope.azioneConSuccesso = function (azione) {
				 return function () {
				 azione(function () {
				 console.log("ut " + $scope.ultimoTotale);
				 console.log($scope.totaleOrdine);
				 $scope.ultimoTotale = $scope.totaleOrdine;
				 $scope.totaleOrdine = 0;
				 
				 //  $scope.cancella();
				 console.log("ut " + $scope.ultimoTotale);
				 console.log("t " + $scope.totaleOrdine);
				 //    $scope.$apply();
				 });
				 
				 };
				 };
				 */

				function terminaOrdine() {
					$scope.ultimoTotale = $scope.totaleOrdine;
					$scope.totaleOrdine = 0;
					$scope.cancella();
				}


				$scope.stampa = function () {
					if(confirm('Tan! Sicuro di stampare senza archiviare?'))
						azioniOrdine.stampa(terminaOrdine);
				};


				$scope.archivia = function () {
					if(confirm('Tan! Sicuro di archiviare senza stampare?'))
						azioniOrdine.archivia(terminaOrdine);
				};

				$scope.stampa_archivia = function () {
					azioniOrdine.stampa(function () {
						azioniOrdine.archivia(terminaOrdine);
					});
				};

				$scope.cancella = function () {
					$scope.ordine.reset();
				};

				$scope.$on('$destroy', function () {
					window.onbeforeunload = undefined;
				});

				$scope.$on('$locationChangeStart', function (event, next, current) {
					finestraCliente.chiudiFinestraCliente();
				});




			}])




	.controller(
		"GGVApp-ParentFinestraClienteController",
		['$scope', '$interval', 'ordine', 'finestraCliente','opzioni'
			, function ($scope, $interval, ordine, finestraCliente, opzioni) {
				$scope.ordine = ordine;

				$scope.attiva = opzioni.getServer("default-doppio-schermo").valore;
				$scope.imgsrc = $scope.attiva 
					? "img/finestra-cliente-attiva.png"
					: "img/finestra-cliente-inattiva.png";
				
				$scope.interval;
				
				$scope.aggiornaIcona = function () {
					$scope.attiva = finestraCliente.isAttiva();
					$scope.imgsrc = $scope.attiva 
						? "img/finestra-cliente-attiva.png"
						: "img/finestra-cliente-inattiva.png";
				};
				
				
				if($scope.attiva){
					finestraCliente.apriFinestraCliente();
					$scope.interval = $interval($scope.aggiornaIcona, 1000);
				}
				
				$scope.aggiornaIcona();
				
				
				$scope.switch = function () {
					$scope.attiva = !$scope.attiva;
					$scope.imgsrc = $scope.attiva 
						? "img/finestra-cliente-attiva.png"
						: "img/finestra-cliente-inattiva.png";
					if ($scope.attiva) {
						finestraCliente.apriFinestraCliente();
						$scope.interval = $interval($scope.aggiornaIcona, 1000);
					}
					else {
						finestraCliente.chiudiFinestraCliente();
						$interval.cancel($scope.interval);
					}
				};
			
			}])





	/*
	 .directive('gestioneOrdineCorrente', ['vistaGestioneOrdine', function (vistaGestioneOrdine) {
	 return {
	 restrict: 'E',
	 controller: "GGVApp-gestioneOrdineCorrenteController",
	 templateUrl: vistaGestioneOrdine.vista.url
	 };
	 }])
	 */

	;



