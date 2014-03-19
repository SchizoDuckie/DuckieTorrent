angular.module('DuckieTV.controllers',['DuckieTV.utorrent'])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl', 
  function($scope, $rootScope, uTorrent) {
  	 $scope.ports = [];
     $scope.statusLog = [];
     $scope.authToken = localStorage.getItem('utorrent.token')

     /**
      * A btapp api runs on one of these ports
      */
    function get_port(i) {
        return 7 * Math.pow(i, 3) + 3 * Math.pow(i, 2) + 5 * i + 10000;
    }

    $scope.Scan = function() {
      var ports = [];
      for(var i =0; i<20; i++) {
        ports.push(get_port(i));
      }
      uTorrent.portScan(ports).then(function(result) {
        $scope.statusLog.push('Ping result on port', result.port);
        $scope.statusLog.push(angular.toJson(result.version, true))
        console.log("Ping result on port", result);
        uTorrent.setPort(result.port);
      }, function(err) {
        console.error('Could not connect to one of the ports!');
      })
    }

    $scope.Connect = function() {
      uTorrent.connect($scope.authToken);
    }

    $scope.Pair = function() {
       uTorrent.pair().then(function(result) {
        console.log("Received auth token!", result);
        localStorage.setItem('utorrent.token', result);
        $scope.authToken = result;
       }, function(err) {
        console.error("Eror pairing!", err);
       })
    }


    
  	
  
})
