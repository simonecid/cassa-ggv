// Modulo radice dell'applicazione AngularJS.
// Dichiara le dipendenze sui sotto-moduli e definisce il servizio menu
// e il controller principale che mostra lo stato della sincronizzazione CouchDB.
angular.module('GGVApp', [
    'GGVApp-ordine',
    'GGVApp-opzioni',
	'GGVApp-prenotazioni',
	//'GGVApp-scorte',
	'GGVApp-messaggi'
            //  'ngTouch',
//    'ui.bootstrap'
])

        // Servizio menu: restituisce il catalogo prodotti da localStorage.
        // Il file db/menu.js scrive sempre il menu aggiornato in localStorage
        // al caricamento della pagina, quindi questo servizio legge sempre
        // la versione più recente.
        .service('menu', function () {
            var m = localStorage.getItem('menu') === null
                    ? _menu
                    : localStorage.getItem('menu');
            return JSON.parse(m);
        })


        .controller(
            "GGVAppController",
			['$scope', 'menu', 'azioniOrdine',
				function ($scope, menu, azioniOrdine) {
                        $scope.menu = menu;

						// Stato di sincronizzazione mostrato nella navbar: true=ok, false=errore, '?'=iniziale
						$scope.syncAttivo = '?';
						azioniOrdine.onReplicationChanges(function(){
							$scope.syncAttivo = true;
							console.log('Sync riuscita');
						});
						azioniOrdine.onReplicationErrors(function(){
							$scope.syncAttivo = false;
							console.log('Errori di sync');
						});

                        // console.log(menu);
//       $scope.ordine = new Ordine($scope.menu);
                    }])

        // Direttiva per la barra di navigazione comune a tutte le viste
        .directive('ggvNav', function () {
            return {
                restrict: 'E',
                templateUrl: 'ggvnav.html'
            };
        })

        ;

// TODO: interrogare il server
function _getMenu() {
    return JSON.parse(localStorage.getItem('menu'));
}
