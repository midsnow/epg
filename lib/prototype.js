var path = require('path');
var _ = require('lodash');
var debug = require('debug')('epg:lib:prototype');
var util = require('util');
var express= require('express');
var less = require('express-less');
var path = require('path');
var fs = require('fs-extra');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');

function options() {
	
	var exports = {};

	/**
	 * This function produces all EPG protoype functions.
	 * All exports are added to the EPG.prototype
	 */

	// Deprecated options that have been mapped to new keys
	var remappedOptions = {
	};
	
	/**
	 * init EPG
	 * 
	 * must be run before using library 
	 *
	 * ####Example:
	 *
	 *     EPG.init({auth: { username: 'sduser', password: hexedpass}});
	 *
	 * @method init
	 * @api public
	 */ 
	exports.init = function(config) {
		return new Promise( ( resolve, reject ) => {
			var epg = this;
			
			if(_.isString(config))config = { use:config };
			
			if(!_.isObject(config))config = {};
			
			var defaults = {
				route: '/epg'
			}
			
			_.defaults(config, defaults);
			
			// load the config file
			fs.readJson(path.join(this._options.moduleRoot, 'conf', 'epg.json'))
			.then( cfg => {
				
				run.call(this, cfg);
			})
			.catch( e => {
				debug('error loading config', e);
				run.call(this, config);
			});
			
			function run(cfg) {
				if ( config.auth && config.auth.password ) {
					shasum.update( config.auth.password )
					cfg.auth.password = shasum.digest('hex');
				}
				
				_.defaults(cfg, config);
				
				if(config.io) {
					this.io = config.io;
				}
				
				delete config.io;
				delete cfg.io;
				
				//debug(cfg);
				
				this.options(cfg);
				
				fs.outputJson(path.join(this._options.moduleRoot, 'conf', 'epg.json'), this._options, {spaces: 2, EOL: '\r\n'})
				.then(() => finish.call(this))
				.catch((e) => finish.call(this, e));
			}
			
			function finish( err ) {
				if (err) {
					debug(err);
				}
							
				this.models();
				
				this.emit('init');
				
				// set the token
				// emits ready when done
				this.agent._resetToken()
				
				// emit events
				this.talking('ready', function() {
					// epg.agent.status();
					
				});
				
				resolve(this)
			}
		});
		
		return this;
	}
	/**
	 * Emitter to all listeners
	 * 
	 * */
	exports.notify = function(emit, data) {
		//debug('event emit', emit, data);
		this.talk(v, data);
		this.squawk(v, data);	
	}
	/**
	 * Emitter events for server
	 * 
	 * */
	exports.talk = function(emit, data) {
		if(!_.isArray(emit)) {
			emit = [emit];
		}
		emit.forEach((v, k) => {
			//debug('event emit', emit, data);
			this.emit(v, data);
		});		
	}
	exports.talking = function(listenFor, run) {
		this.on(listenFor, run);
	}
	exports.onTalks = exports.talking;
	
	exports.onTalk = function(listenFor, run) {
		this.once(listenFor, run);
	}
	exports.removeTalk = function(event, remove) {
		this.removeListener(event, remove);
	}
	exports.listenerRemove = function(event, remove) {
		if(this.io) {
			this.io.removeListener(event, remove);
		}
		this.removeListener(event, remove);
	}
	
	/**
	 * Emitter events for  socket
	 * 
	 * */
	exports.squawk = function(emit, data) {
		if(!_.isArray(emit)) {
			emit = [emit];
		}

		emit.forEach((v, k) => {
			if(this.io) {
				debug('socket emit', v);
				this.io.emit(v, data);
			}
			
		});
		return this;
	}
	exports.onSquawking = function(listenFor, run) {
		if(this.io) {
			this.io.on(listenFor, run);
		}
		return this;
	}
	exports.onSquawk = function(listenFor, run) {
		if(this.io) {
			this.io.once(listenFor, run);
		}
		return this;
	}
	exports.RemoveSquawk = function(event, remove) {
		if(this.io) {
			this.io.removeListener(event, remove);
		}
		return this;
	}
	
	/**
	 * import models
	 * 
	 * */
	exports.models = require('./models');
	
	/**
	 * Express route
	 * 
	 * */
	exports.routes = function( app, opts, finished = ()=>{}, Parent ) {
				
		var _this = this;
		
		app.use( ( req, res, next ) => {
			debug('REQUEST', req.path );
			next();
		})
		
		debug( 'set static /epg-app', path.join(__dirname, '../', 'epg-app'));
		app.use('/epg-app', express.static(path.join(__dirname, '../', 'epg-app')));
		debug('set less /epg-css')
		app.use(
			'/epg-css',
			less(
				path.join(__dirname, '../', 'epg-app/styles'),
				{ 
					compress: app.get('env') == 'production',
					debug: app.get('env') == 'development'
				}
			)
		);

		debug('set route', this.get('route') + '*')
		app.get(this.get('route') + '*', function( req, res ) {
			debug('get epg route', _this.get('route'));
			var options = {
				root: path.join(__dirname, '../', 'epg-app'),
				dotfiles: 'deny',
				headers: {
					'x-timestamp': Date.now(),
					'x-sent': true
				}
			};

			var fileName = 'index2.html';
			res.sendFile(fileName, options, function (err) {
				if (err) {
					debug(err);
					res.status(err.status).end();
				}
				else {
					debug('Sent:', fileName);
				}
			});

		});
		
		
		
		finished()
		
	}
	
	/**
	 * Sets epg option
	 *
	 * ####Example:
	 *
	 *     epg.set('user model', 'User') // sets the 'user model' option to `User`
	 *
	 * @param {String} key
	 * @param {String} value
	 * @api public
	 */
	exports.set = function(key, value) {
	 	
		if (arguments.length === 1) {
			return this._options[key];
		}
		
		if (remappedOptions[key]) {
			if (this.get('logger')) {
				console.log('\nWarning: the `' + key + '` option has been deprecated. Please use `' + remappedOptions[key] + '` instead.\n\n' +
					'Support for `' + key + '` will be removed in a future version.');
			}
			key = remappedOptions[key];
		}
		
		// handle special settings
		switch (key) {
			default:
				break;
		}
		
		this._options[key] = value;
		return this;
	};


	/**
	 * Sets multiple epg options.
	 *
	 * ####Example:
	 *
	 *     epg.options({test: value}) // sets the 'test' option to `value`
	 *
	 * @param {Object} options
	 * @api public
	 */

	exports.options = function(options) {
		if (!arguments.length) {
			return this._options;
		}
		if (_.isObject(options)) {
			debug('settings options');
			var keys = Object.keys(options),
				i = keys.length,
				k;
			while (i--) {
				k = keys[i];
				this.set(k, options[k]);
			}
		}
		return this._options;
	};


	/**
	 * Gets epg options
	 *
	 * ####Example:
	 *
	 *     epg.get('test') // returns the 'test' value
	 *
	 * @param {String} key
	 * @api public
	 */

	exports.get = exports.set;
	
	/**
	 * include the agent funtions
	 */
	//_.extend(exports, require('./agent/prototype.js'));
	
	return exports;
	
}

module.exports = options;

