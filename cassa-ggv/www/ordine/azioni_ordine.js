// Servizio azioniOrdine: gestisce la sincronizzazione PouchDB→CouchDB,
// la stampa tramite server Python e l'archiviazione degli ordini.
angular.module('GGVApp-ordine')

	.service(
		'azioniOrdine',
		['$rootScope', '$http', 'ordine', 'opzioni', function ($rootScope, $http, ordine, opzioni) {


				// Callback invocati quando la replica cambia stato; vengono sostituiti
				// da onReplicationChanges/onReplicationErrors e usati per aggiornare
				// l'icona di sync nella navbar (in app.js)
				var onC = function(){console.log('old C');};
				var onE = function(){console.log('old E');};
				this.onReplicationChanges = function(f){
					onC = function(){$rootScope.$apply(f);};
				};
				this.onReplicationErrors = function(f){
					onE = function(){$rootScope.$apply(f);};
				};

				var errori = false;

				// Database PouchDB locale (nome 'ordini'); i documenti sono persistiti
				// nel browser e replicati in modo live verso CouchDB
				var db = new PouchDB('ordini');

				// Replica continua (live) dal DB locale verso CouchDB.
				// Non scarica i dati dal server: ogni postazione ha la propria copia locale.
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

				// Invia l'ordine al server Python per la stampa ESC/POS.
				// Chiama onSuccess solo se la stampa va a buon fine.
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

				// Salva l'ordine in PouchDB (che poi lo replica su CouchDB).
				// Chiama onSuccess solo se il salvataggio va a buon fine.
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

					// Inserisce il documento nel DB locale; PouchDB gestirà la replica
					var promise = db.post(dati);

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

	// Direttiva che include il template HTML con i pulsanti stampa/archivia
	.directive('azioniOrdine', function () {
		return {
			restrict: 'E',
			templateUrl: 'ordine/azioniOrdine.html'
		};
	})


	;
