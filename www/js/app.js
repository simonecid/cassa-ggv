angular.module('GGVApp', [
    'GGVApp-ordine',
    'GGVApp-opzioni',
	'GGVApp-prenotazioni',
	//'GGVApp-scorte',
	'GGVApp-messaggi'
            //  'ngTouch',
//    'ui.bootstrap'
])

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