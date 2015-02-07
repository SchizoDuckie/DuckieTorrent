angular.module('DuckieTorrent.controllers', ['DuckieTorrent.torrent'])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl',
    function($scope, $rootScope, uTorrent) {
        $scope.ports = [];
        $scope.statusLog = [];
        $scope.session = false;
        $scope.authToken = localStorage.getItem('utorrent.token')
        uTorrent.setPort(localStorage.getItem('utorrent.port'));
        $scope.rpc = null;
        $scope.polling = false;
        /**
         * A btapp api runs on one of these ports
         */

        $scope.playInBrowser = function(torrent) {
            window.open(torrent.properties.all.streaming_url);
        }

        /**
         * Execute a pair promise against utorrent
         * It waits 30 seconds for the promise to timeout.
         * When it works, it stores the returned auth token for connecting with the Connect function
         */
        $scope.Pair = function() {
            uTorrent.AutoConnect().then(function() {
                $scope.rpc = uTorrent.getRemote();
            })
        }





    })