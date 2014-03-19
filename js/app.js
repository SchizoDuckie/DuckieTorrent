/**
 * Handle global dependencies
 */

angular.module('DuckieTorrent', [
	'ngRoute',
    'ui.bootstrap',
    'DuckieTV.controllers',
    'DuckieTV.utorrent'
 ])

/**
 * Unsafe HTML entities passthrough.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
})
/**
 * Routing configuration. 
 */
.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/home.html', 
      controller: 'MainCtrl'
    })
    .otherwise({redirectTo: '/'});
}).run(function($rootScope) {
    
   
})

