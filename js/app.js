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

String.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};


Object.deepMerge = function(obj1,obj2){ // Our merge function
    var result = {}; // return result
    for(i in obj1){      // for every property in obj1 
        if((i in obj2) && (typeof obj1[i] === "object") && (i !== null)){
            result[i] = Object.deepMerge(obj1[i],obj2[i]); // if it's an object, merge   
        }else{
           result[i] = obj1[i]; // add it to result
        }
    }
    for(i in obj2){ // add the remaining properties from object 2
        if(i in result){ //conflict
            continue;
        }
        result[i] = obj2[i];
    }
    return result;
}