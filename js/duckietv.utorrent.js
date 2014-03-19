angular.module('DuckieTV.utorrent', [])
.provider('uTorrent', function() {
	 this.http = null;
	 this.promise = null;

	 this.endpoints = {
	 	pair: 'http://localhost:%s/gui/pair?callback=JSON_CALLBACK',
	 	version: 'http://localhost:%s/version/?callback=JSON_CALLBACK',
	 	ping: 'http://localhost:%s/gui/pingimg'
	 };

	 this.parsers = {
	 	 pair: function(data) {
		   return data.data;
		 },

		 version: function(data) {
		 	console.log("Found the port!!", data.data);
		    return data.data;
		 },
		    
		 ping: function(data) {
		 		
		 }
	 };
	 
	 this.getUrl = function(type, param, param2) {
	 	var out = this.endpoints[type];
	 	if(this.port != null) {
	 		out = out.replace('%s', this.port);
	 	}
	 	out = out.replace('%s', encodeURIComponent(param));
	 	return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
	 };

	 this.getParser = function(type) {
	 	return this.parsers[type];
	 }

	this.promiseRequest = function(type, param, param2) {
	 	var d = this.promise.defer();
	 	var url = this.getUrl(type, param, param2);
	 	var parser = this.getParser(type);
	    this.http.jsonp(url, {
	    	method: 'GET',	        
	        timeout: 3000,
	      }).then(function(response) {
	       d.resolve(parser(response));
		}, function(err) {
			console.log('error fetching', type);
		  	d.reject(err);
		});
		return d.promise;
	}

	this.pairRequest = function(type, param, param2) {
	 	var d = this.promise.defer();
	 	var url = this.getUrl(type, param, param2);
	 	var parser = this.getParser(type);
	    this.http.jsonp(url, {
	    	method: 'GET',	        
	        timeout: 30000,
	      }).then(function(response) {
	       d.resolve(parser(response));
		}, function(err) {
			console.log('error fetching', type);
		  	d.reject(err);
		});
		return d.promise;
	}

 this.currentPort = 0;
 this.port = null;

 this.$get = function($q, $http) {
    var self = this;
    self.http = $http;
    self.promise = $q;
    return {
    	portScan: function(ports) {
    		var d = self.promise.defer();

    		var nextPort = function() {
    			console.log("Next port!", ports, self.currentPort);
    			self.promiseRequest('version', ports[self.currentPort]).then(function(result) {
	    			console.log("Portscan finished!", ports[self.currentPort], result);
	    			d.resolve({ port: ports[self.currentPort], version: result});
	    		}, function(err) {
	    			console.log("Reject: ", ports[self.currentPort]);
	    			if(self.currentPort < 20) {
	    				self.currentPort++;
	    				nextPort();
	    			} else {
	    				d.reject("No active client found!");
	    			}
	    			
	    		});
    		}
    		nextPort();
    		return d.promise;
    	},
    	setPort: function(port) {
    		self.port = port;
    	},
    	pair: function() {
    		return self.pairRequest('pair');
    	}
    }
  }
});
