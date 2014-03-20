
angular.module('DuckieTV.utorrent', [])
/**
 * Angular's private URL Builder method + unpublished dependencies converted to a public service
 */
.provider('URLBuilder', function() {
	
	function encodeUriQuery(val, pctEncodeSpaces) {
	  return encodeURIComponent(val).
	             replace(/%40/gi, '@').
	             replace(/%3A/gi, ':').
	             replace(/%24/g, '$').
	             replace(/%2C/gi, ',').
	             replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
	}

	/**
	 * Angular's private buildUrl function, patched to refer to the public methods on the angular globals
	 */
 	function buildUrl(url, params) {
      if (!params) return url;
      var parts = [];
      angular.forEach(params, function(value, key) {
        if (value === null || angular.isUndefined(value)) return;
        if (!angular.isArray(value)) value = [value];

        angular.forEach(value, function(v) {
          if (angular.isObject(v)) {
            v = angular.toJson(v);
          }
          parts.push(encodeUriQuery(key) + '=' +
                     encodeUriQuery(v));
        });
      });
      return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
    }

    this.$get = function() {
    	return {
    		build: function(url, params) {
    			return buildUrl(url, params);
    		}
    	}

    }

})

.provider('uTorrent', function() {
	 this.http = null;
	 this.promise = null;

	 this.endpoints = {
	 	pair: 'http://localhost:%s/gui/pair',
	 	version: 'http://localhost:%s/version/',
	 	ping: 'http://localhost:%s/gui/pingimg',
	 	api: 'http://127.0.0.1:10000/btapp/',
	 };

	 this.parsers = {
	 	 pair: function(data) {
		   return data.data;
		 },

		 version: function(data) {
		 	console.log("Found the port!!", data.data);
		    return data.data;
		 }

	 };

	 this.getParser = function(type) {
	 	return (type in this.parsers) ? this.parsers[type] : function(data) { return data.data };
	 }
	 
	 this.getUrl = function(type, param, param2) {
	 	var out = this.endpoints[type];
	 	if(this.port != null) {
	 		out = out.replace('%s', this.port);
	 	}
	 	out = out.replace('%s', encodeURIComponent(param));
	 	return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
	 };


 	this.verifyPath = function(path) {
            var collections = [
                ['btapp', 'torrent'],
                ['btapp', 'torrent', 'all', '*', 'file'],
                ['btapp', 'torrent', 'all', '*', 'peer'],
                ['btapp', 'label'],
                ['btapp', 'label', 'all', '*', 'torrent'],
                ['btapp', 'label', 'all', '*', 'torrent', 'all', '*', 'file'],
                ['btapp', 'label', 'all', '*', 'torrent', 'all', '*', 'peer'],
                ['btapp', 'rss'],
                ['btapp', 'rss', 'all', '*', 'item'],
                ['btapp', 'stream'],
                ['btapp', 'stream', 'all', '*', 'diskio']
            ];

            return _.any(collections, function(collection) {
                if(collection.length !== path.length) {
                    return false;
                }
                for(var i = 0; i < collection.length; i++) {
                    if(collection[i] === '*') {
                        continue;
                    }
                    if(collection[i] !== path[i]) {
                        return false;
                    }
                }
                return true;
            });
        },
	

	/**
	 * Build a JSONP request using the URLBuilder service.
	 * Automagically adds the JSON_CALLBACK option and executes the built in parser, or returns the result
	 * @param string type url to fetch from the request types
	 * @param object params GET parameters
	 * @param object options $http optional options
	 */
	this.jsonp = function(type, params, options) {
		var d = this.promise.defer();
		params = angular.extend(params || {}, { callback: 'JSON_CALLBACK' });
	 	var url = this.urlbuilder.build(this.getUrl(type, this.port), params);
	 	var parser = this.getParser(type);
	    this.http.jsonp(url, options || {}).then(function(response) {
	       d.resolve(parser ? parser(response) : response.data);
		}, function(err) {
			console.log('error fetching', type);
		  	d.reject(err);
		});
		return d.promise;
	}

 this.currentPort = 0;
 this.port = null;
 this.urlbuilder = null;
 this.sessionKey = null;
 this.authToken = null;

 this.$get = function($q, $http, URLBuilder, $parse) {
    var self = this;
    self.http = $http;
    self.promise = $q;
    self.urlbuilder = URLBuilder;
    return {
    	portScan: function(ports) {
    		var d = self.promise.defer();

    		var nextPort = function() {
    			console.log("Next port!", ports, self.currentPort);
    			self.port = ports[self.currentPort];
    			self.jsonp('version').then(function(result) {
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
    		return self.jsonp('pair', {}, { timeout: 30000 });
    	},

    	connect: function(authToken) {
    		return self.jsonp('api', {
    			pairing: authToken,
    			type: 'state',
    			queries: '[["btapp"]]',
    			hostname: window.location.host
    		}).then(function(session) {
    			console.log("Retreived session key!", session);
    			self.sessionKey = session.session;
    			self.authToken = authToken;
    			return session;
    		}, function(fail) {
    			console.error("Error starting session with auth token %s!", authToken);
    		});
    	},

    	statusQuery: function() {
    		return self.jsonp('api', {
    			pairing: self.authToken,
    			session: self.sessionKey,
    			type: 'update',
    			hostname: window.location.host
    		}).then(function(data) {
    			console.log("Fetched status result!",data);

			 	var adders = data.map(function(el) { return 'add' in el ? el.add : false }).filter(function(el) { return el != false });
			 	var removers = data.map(function(el) { return 'remove' in el ? el.remove : false }).filter(function(el) { return el != false });
			 	var updaters = data.map(function(el) { return 'update' in el ? el.update : false }).filter(function(el) { return el != false });
			 	
			 	var torrents = adders.map(function(el) { return $parse('btapp.torrent.all')(el); }).filter(function(el){ return el != undefined });
			 	console.log("Found adders");
			 	return { 
			 		data: data,
			 		add: adders,
			 		remove: removers,
			 		update: updaters,
			 		torrents: torrents
			 	}


    			return result;
    		}, function(error) {
    			console.error("Error executing get status query!", error);
    		})
    	},

    	attachEvents: function() {
    		/*{ "add": { "btapp": { "events": { "all": { "
			path:["btapp","events","set"]
			args:["appDownloadProgress","bt_05321785204295053489"]
			path:["btapp","events","set"]
			args:["appMessage","bt_56894816204235029082"]
			path:["btapp","events","set"]
			args:["appStopping","bt_78413389069652724491"]
			path:["btapp","events","set"]
			args:["appUninstall","bt_61359101496962791011"] */
    	}

    }
  }
});



/*
 // copy from btappjs for reverse engineering 

function assert(b, err) { if(!b) { throw err; } }

var TorrentClient = {

	     verifyPath: function(path) {
            var collections = [
                ['btapp', 'torrent'],
                ['btapp', 'torrent', 'all', '*', 'file'],
                ['btapp', 'torrent', 'all', '*', 'peer'],
                ['btapp', 'label'],
                ['btapp', 'label', 'all', '*', 'torrent'],
                ['btapp', 'label', 'all', '*', 'torrent', 'all', '*', 'file'],
                ['btapp', 'label', 'all', '*', 'torrent', 'all', '*', 'peer'],
                ['btapp' ,'rss'],
                ['btapp', 'rss', 'all', '*', 'item'],
                ['btapp', 'stream'],
                ['btapp', 'stream', 'all', '*', 'diskio']
            ];

            return _.any(collections, function(collection) {
                if(collection.length !== path.length) {
                    return false;
                }
                for(var i = 0; i < collection.length; i++) {
                    if(collection[i] === '*') {
                        continue;
                    }
                    if(collection[i] !== path[i]) {
                        return false;
                    }
                }
                return true;
            });
        },

	

    // We can't send function pointers to the torrent client server, so we'll send
    // the name of the callback, and the server can call this by sending an event with
    // the name and args back to us. We're responsible for making the call to the function
    // when we detect this. This is the same way that jquery handles ajax callbacks.
    storeCallbackFunction: function(cb) {
        cb = cb || function() {};
        var str = 'bt_';
        for(var i = 0; i < 20 || (str in this.btappCallbacks); i++) { str += Math.floor(Math.random() * 10); }
        this.btappCallbacks[str] = cb;
        return str;
    },
    // We expect function signatures that come from the client to have a specific syntax
    isRPCFunctionSignature: function(f) {
        assert(typeof f === 'string', 'do not check function signature of non-strings');
        return f.match(/\[native function\](\([^\)]*\))+/) ||
                f.match(/\[nf\](\([^\)]*\))+/);
    },
    isJSFunctionSignature: function(f) {
        assert(typeof f === 'string', 'do not check function signature of non-strings');
        return f.match(/\[nf\]bt_/);
    },
    getStoredFunction: function(f) {
        assert(TorrentClient.prototype.isJSFunctionSignature(f), 'only store functions that match the pattern "[nf]bt_*"');
        var key = f.substring(4);
        assert(key in this.btappCallbacks, 'trying to get a function with a key that is not recognized');
        return this.btappCallbacks[key];
    },
    // Seeing as we're interfacing with a strongly typed language c/c++ we need to
    // ensure that our types are at least close enough to coherse into the desired types
    // takes something along the lines of "[native function](string,unknown)(string)".
    validateArguments: function(functionValue, variables) {
        assert(typeof functionValue === 'string', 'expected functionValue to be a string');
        assert(typeof variables === 'object', 'expected variables to be an object');
        var signatures = functionValue.match(/\(.*?\)/g);
        return _.any(signatures, function(signature) {
            signature = signature.match(/\w+/g) || []; //["string","unknown"]
            return signature.length === variables.length && _.all(signature, function(type,index) {
                if(typeof variables[index] === 'undefined') {
                    throw 'client functions do not support undefined arguments';
                } else if(typeof variables[index] === 'null') {
                    return true;
                }

                switch(type) {
                    //Most of these types that the client sends up match the typeof values of the javascript
                    //types themselves so we can do a direct comparison
                    case 'number':
                    case 'string':
                    case 'boolean':
                        return typeof variables[index] === type;
                    //In the case of unknown, we have no choice but to trust the argument as
                    //the client hasn't specified what type it should be
                    case 'unknown':
                        return true;
                    case 'array':
                        return typeof variables[index] === 'object';
                    case 'dispatch':
                        return typeof variables[index] === 'object' || typeof variables[index] === 'function';
                    default:
                        //has the client provided a type that we weren't expecting?
                        throw 'there is an invalid type in the function signature exposed by the client';
                }
            });
        });
    },
    convertCallbackFunctionArgs: function(args) {
        _.each(args, function(value, key) {
            // We are responsible for converting functions to variable names...
            // this will be called later via a event with a callback and arguments variables
            if(typeof value === 'function') {
               args[key] = this.storeCallbackFunction(value);
            } else if(typeof value === 'object' && value) {
                this.convertCallbackFunctionArgs(value);
            }
        }, this);
    },
    // Functions are simply urls that we make ajax request to. The cb is called with the
    // result of that ajax request.
    createFunction: function(session, path, signatures) {
        assert(session, 'cannot create a function without a session id');
        var func = _.bind(function() {
            var args = [];

            // Lets do a bit of validation of the arguments that we're passing into the client
            // unfortunately arguments isn't a completely authetic javascript array, so we'll have
            // to "splice" by hand. All this just to validate the correct types! sheesh...
            var i;
            for(i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            // This is as close to a static class function as you can get in javascript i guess
            // we should be able to use verifySignaturesArguments to determine if the client will
            // consider the arguments that we're passing to be valid
            if(!TorrentClient.prototype.validateArguments.call(this, signatures, args)) {
                throw 'arguments do not match any of the function signatures exposed by the client';
            }

            this.convertCallbackFunctionArgs(args);
            var ret = new jQuery.Deferred();
            var success = _.bind(function(data) {
                //lets strip down to the relevent path data
                _.each(path, function(segment) {
                    var decoded = decodeURIComponent(segment);
                    if(typeof data !== 'undefined') {
                        data = data[decoded];
                    }
                });
                if(typeof data === 'undefined') {
                    ret.reject('return value parsing error ' + JSON.stringify(data));
                } else if(typeof data === 'string' && this.isJSFunctionSignature(data)) {
                    var func = this.getStoredFunction(data);
                    assert(func, 'the client is returning a function name that does not exist');
                    ret.resolve(func);
                } else {
                    ret.resolve(data);
                }
            }, this);
            var error = function(data) {
                ret.reject(data);
            };
            this.query({
                type: 'function', 
                path: JSON.stringify(path),
                args: JSON.stringify(args),
                session: session
            }).done(success).fail(error);
            this.trigger('queries', path);
            return ret;
        }, this);
        func.valueOf = function() { return signatures; };
        return func;
    },
    query: function(args) {
        var abort = false;
        var ret = new jQuery.Deferred();
        assert(args.type === 'update' || args.type === 'state' || args.type === 'function' || args.type === 'disconnect', 'the query type must be either "update", "state", or "function"');

        args.hostname = window.location.hostname || window.location.pathname;
        var success_callback = _.bind(function(data) {
            if (data === 'invalid request') {
                setTimeout(_.bind(this.reset, this), 1000);
                throw 'pairing occured with a torrent client that does not support the btapp api';
            } else if(typeof data !== 'object' || 'error' in data) {
                ret.reject();
                this.trigger('client:error', data);
            } else {
                ret.resolve(data);
            }
        }, this);
        this.send_query(args)
            .done(function() {
                if(!abort) {
                    success_callback.apply(this, arguments);
                }
            }).fail(function() {
                if(!abort) {
                    ret.reject.apply(this, arguments);
                }
            });
        ret.abort = function() {
            abort = true;
        };
        return ret;
    }
} */