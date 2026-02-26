angular.module('GGVApp-ordine')

	.service(
		'azioniOrdine',
		['$rootScope', '$http', 'ordine', 'opzioni', function ($rootScope, $http, ordine, opzioni) {


				var onC = function(){console.log('old C');};
				var onE = function(){console.log('old E');};
				this.onReplicationChanges = function(f){
					onC = function(){$rootScope.$apply(f);};
				};
				this.onReplicationErrors = function(f){
					onE = function(){$rootScope.$apply(f);};
				};
				
				var errori = false;
				
				//var db = new PouchDB('http://localhost:5984/ordini');
				var db = new PouchDB('ordini');
				
				db.replicate.to(opzioni.getCouchDbSyncString() + '/ordini', {live: true})
					.on('change', function (info) {
						onC();
						errori = false;
					}).on('error', function (err) {
						onE();
						errori = true;
					}).on('complete', function (info) {
						console.log('complete ');
						console.log(info);
					});
					



				function verificaStampante() {
					return opzioni.hasOwnProperty('stampante') &&
						opzioni.stampante !== '';
				}

				this.stampa = function (onSuccess) {
					if (!verificaStampante()) {
						alert("Tanni! Scegli una stampante!");
						return;
					}
					var ordinePerStampa = ordine.ordinePerStampa();
					if (ordinePerStampa.voci.length === 0) {
						alert("Tanni! L'ordine è vuoto");
						return;
					}
					var r = {
						'nomeRichiesta': 'stampa',
						'stampante': opzioni.stampante,
						"ordine": ordinePerStampa
					};
					//alert(opzioni.getPythonPrinterString());
					$http.post(opzioni.getPythonPrinterString()+'/stampa', r)
						.success(onSuccess)
						.error(function (data, status, headers, config) {
							if (status === 0) {
								alert('Impossibile comunicare con il server di stampa');
							}
							else {
								alert([data, status, headers, config]);
							}
							console.log([data, status, headers, config]);
						});
				};

				this.archivia = function (onSuccess) {
					var dati = ordine.datiArchivio();
					if (dati.voci.length === 0) {
						alert("Tanni! L'ordine è vuoto");
						return;
					}

					var onError = function (data, status, headers, config) {
						console.log([data, status, headers, config]);
						alert([data, status, headers, config]);
						localStorage.setItem('ggv-log', [data, status, headers, config]);
						alert("C'è stato un problema nell'archiviazione dei dati.\n" +
							"Meglio se chiami il tan (ciups) e intanto cambi pc!");
					};

					var promise = db.post(dati);
					// $http.post('http://localhost:5984/ordini', dati)

					promise.then(function (resp) {
						$rootScope.$apply(onSuccess);
						if(errori){
						//	location.reload();
						}
					//	console.log(resp);
					}, function (err) {
						console.log(err);
						localStorage.setItem('ggv-log', err);
						alert("C'è stato un problema nell'archiviazione dei dati.\n" +
							"Meglio se chiami il tan (ciups) e intanto cambi pc!\n"+err);
					});

					/*$http.post('http://localhost:5984/ordini', dati)
					 .success(onSuccess)
					 .error(function (data, status, headers, config) {
					 console.log([data, status, headers, config]);
					 localStorage.setItem('ggv-log', [data, status, headers, config]);
					 alert("C'è stato un problema nell'archiviazione dei dati.\n" +
					 "Meglio se chiami il tan (ciups) e intanto cambi pc!");
					 });
					 */
				};



				/*
				 this.stampa_archivia = function(onSuccess){
				 this.stampa(function(){this.archivia(onSuccess);});
				 };
				 */
				return this;



			}
		])

	.directive('azioniOrdine', function () {
		return {
			restrict: 'E',
			templateUrl: 'ordine/azioniOrdine.html'
		};
	})


	;