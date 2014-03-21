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
.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field]);
    });
    if(reverse) filtered.reverse();
    return filtered;
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

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
