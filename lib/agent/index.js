var request = require('superagent');
var _ = require('lodash');
var debug = require('debug')('epg:lib:agent:index');
var path = require('path');

/**
 * Calling the module directly returns a new Wrapper instance
 * 
 * @param  {Function} fn
 * @return {Wrapper}
 */
exports = module.exports = function(fn) {
	return new Agent(fn);
};

/**
 * Wrapper Class
 * 
 * @param {Function} fn
 * @param {Object} context
 */
var Agent = exports.Agent = function Agent(context) {
	
	// Ensure a new instance has been created.
	// Calling Wrapper as a function will return a new instance instead.
	if (!(this instanceof Agent)) {
		return new Agent(context);
	}
	
	this.epg = context;
	this.agent = 'nodejs-react-epg';
	
}

_.extend(Agent.prototype, {
	
	talk: function (emits, data) {
		var epg = this.epg;
		epg.talk(emits, data)
	},
	
	_resetToken: function(callback) {
		var epg = this.epg;
		var auth = epg.get('auth');
		
		debug('reset auth token');
		auth.token = false;
		epg.set('auth', auth);
		
		epg.talk('token', 'Reset token in progress');
		this.token(auth, callback);
		
		return
	},
	
	token: function(auth, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(!_.isObject(auth)) {
			auth = epg.get('auth');
		}
		
		if(!_.isEmpty(auth.token)) {
			debug('emit ready', auth.token);
			setTimeout(function(){epg.emit('ready');},500)
			return;
		}
		request
			.post('https://json.schedulesdirect.org/20141201/token')
			.send({ username: auth.username, password:  auth.password})
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				if(err) {
					debug('Token error',  res.error.message)
					epg.emit('tokenError',{action: 'token', error: res.error.message, server: err}); 
					callback(res.error.message)
				} else if(res.status === 200) {
					debug(res.body);
					if(res.body.token) {
						auth.token = res.body.token;
						epg.set('auth',auth);
						debug('token ready', epg.get('auth'));
						epg.emit('ready');
						callback(null, true)
					}
				} else {
					debug(res.status,res.body)
					callback(res.body);
				}
				
			});
	},
	/**
	 * status
	 * 
	 * gets the currently stored headends (4 max)
	 * */
	status: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		auth = epg.get('auth') || {};
		if(!data) {
			data = {};
		}
		if(_.isEmpty(auth.token)) {
			debug('status no auth token');
			epg.talk(['statusError', data.iden],{action: 'status', error: { message: 'No auth token present'}});
			
		} else {
			debug(auth.token);
			request
				.get('https://json.schedulesdirect.org/20141201/status')
				.set('token', auth.token)
				.set('User-Agent', this.agent)
				.set('Accept', 'application/json')
				.end((err, res) => {
					// Calling the end function will send the request
					if(err) {
						if(err.response.status === 403) {
							this._resetToken();
						}
						epg.talk(['statusError', data.iden],{action: 'status', error:  err.response.body, server: err}); 
					} else if(res.status === 200) {
						//debug(res.body);
						epg.talk(['status', data.iden], res.body);
					} else if(res.status === 403) {
						epg.talk(['statusError', data.iden],{action: 'status', error:  err.response.body, server: err}); 
						this._resetToken(data.iden);
					} else {
						debug(res.status,res.body)
					}
					
				});
		}
	},
	/**
	 * headends
	 * accepts a postal code and returns a list of providers
	 * */
	headends: function(data, callback ) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isString(data)) {
			data = {
				postal: data
			}
		}
		
		if(_.isEmpty(data.co)) {
			data.co = 'USA';
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Auth token required'}});
			return;
		} 
		
		debug('request headends start request', data);
		
		request
			.get('https://json.schedulesdirect.org/20141201/headends?country=' + data.co + '&postalcode=' + data.postal)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				if(err) {
					epg.talk(['headendsError', data.iden], {action: 'headends', error:  err.response.body, server: err});
					return;
				} else if(res.status === 200) {
					//debug(res.body);
					// create the return 
					if(_.isArray(res.body)) {
						var ret = [];
						res.body.forEach((head) => {
							var headend = {
								headend: head.headend,
								location: head.location,
								transport: head.transport,
							}
							if(_.isArray(head.lineups)) {
								head.lineups.forEach(line => ret.push(Object.assign({ lineup: line.lineup, name: line.name, uri: line.uri, }, headend)));	
							} else {
								ret.push(headend)
							}
						});
						epg.talk(['headends',  data.iden], ret);
					} else {
						epg.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Error talking to agent'}, server: err});
					}
					
					
				} else if(res.status === 403) {
					this._resetToken();
					epg.talk(['headendsError', data.iden], {action: 'headends', error: 'Bad token.  Try again.'});
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
	/**
	 * add lineup
	 * use the linuep value from the headends returned
	 * adds the lineup to the user account (4 max)
	 * */
	lineupAdd: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isEmpty(data.uri)) {
			epg.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: { message: 'No lineup uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: { message: 'No auth token present'}});
			return
		} 
		request
			.put('https://json.schedulesdirect.org' + data.uri)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				debug(err, res);
				if(err) {
					epg.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: err}); 
				} else if(res.status === 200) {
					//debug(res.body);
					epg.talk(['lineupAdd', data.iden], res.status);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
	/**
	 * Send the results of a hdhomerun lineup.json request
	 * we get back a list of headends with percent match
	 * */
	lineupAutoAdd: function( data, callback ) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isEmpty(data.hdhomerun)) {
			epg.talk(['lineupAutoAddError', data.iden], {action: 'lineupAutoAdd', error: { message: 'No hdhomerun lineup uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if (_.isEmpty(auth.token)) {
			epg.talk(['lineupAddError', data.iden], {action: 'lineupAutoAdd', error: { message: 'No auth token present'}});
			return
		}
		// get the lineup from hdhomerun
		debug('get hdhomerun lineup', data.hdhomerun + '/lineup.json');
		request
			.get(data.hdhomerun + '/lineup.json')
			.end((err, channels) => {   
				if(err) {
					epg.talk(['lineupAddError', data.iden], {action: 'lineupAutoAdd', error: err}); 
					debug('Error with lineup');
					return;
				} 
				debug('channels', channels.body.length)
				request
					.post('https://json.schedulesdirect.org/20141201/map/lineup/')
					.send(channels.body)
					.set('token', auth.token)
					.set('User-Agent', this.agent)
					.set('Accept', 'application/json')
					.end((err, res) => {
						// Calling the end function will send the request
						debug(err);
						if(err) {
							epg.talk(['lineupAutoAddError', data.iden], {action: 'lineupAutoAdd', error: err}); 
						} else if(res.status === 200) {
							debug('body', res.body);
							epg.talk(['lineupAutoAdd', data.iden], res.body);
						} else if(res.status === 403) {
							this._resetToken();
						} else {
							debug(res.status,res.body)
						}
						
					});
			});
		return;
	},
	/**
	 * remove lineup
	 * 
	 * */
	lineupRemove: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isEmpty(data.uri)) {
			epg.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error: { message: 'No lineup uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error: { message: 'No auth token present'}});
			return
		} 
		request
			.delete('https://json.schedulesdirect.org' + data.uri)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				if ( err ) {
					debug('got error', err.message);
					epg.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error:  err.message, server: err.message}); 
					return;
				}
				if(res.status === 200) {
					//debug(res.body);
					epg.talk(['lineupRemove', data.iden], res.status);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body,res.status)
					epg.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error:  err, server: err}); 
				}
				
			});
		
		return;
	},
	/**
	 * map lineup
	 * 
	 * */
	lineupMap: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isEmpty(data.uri)) {
			debug('No lineup lineupMap');
			epg.talk(['lineupMapError', data.iden], {action: 'lineupMap', error: { message: 'No lineup map uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			debug('No auth lineupMap')
			epg.talk(['lineupMapError', data.iden], {action: 'lineupMap', error: { message: 'No auth token present'}});
			return;
		} 
		request
			.get('https://json.schedulesdirect.org' + data.uri)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.set('verboseMap', true)
			.end((err, res) => {
				// Calling the end function will send the request
				if(err) {
					epg.talk(['lineupMapError', data.iden],{action: 'lineupMap', error:  err, server: err}); 
				} else if(res.status === 200) {
					//debug(res.body);
					// normalize the data
					
					
					/**
					 * We expect to send back a channels map and a stations map and maybe some metadata
					 * 
					 * ret = { 
					 * 		channels: [],
					 * 		stations: [],
					 * 		metadata: {},
					 * }
					 * */
					
					var lineupMap = {
						channels: [],
						stations: [],
						metadata: {}
					}
					
					if(_.isArray(res.body.map)) {
						lineupMap.channels = res.body.map;
					}
					if(_.isArray(res.body.stations)) {
						lineupMap.stations = res.body.stations;
					}
					if(_.isObject(res.body.metadata)) {
						lineupMap.metadata = res.body.metadata;
					}
										
					epg.talk(['lineupMap', data.iden], lineupMap);
					
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
	/**
	 * user headends
	 * 
	 * 
	 * */
	lineups: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['lineupsError', data.iden],{action: 'lineups', error: { message: 'Not authorized. Asking for permission from agent now...'}});
			return debug('status no auth token');
		} 
		request
			.get('https://json.schedulesdirect.org/20141201/lineups')
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				if(err && err.response.body.code !== 4102) {
					epg.talk(['lineupsError', data.iden],{action: 'lineups', error:  err, server: err.body }); 
				} else if(err && err.response.body.code === 4102) {
					
					epg.talk(['lineups', data.iden], { lineups: [] });
				} else if(res.status === 200) {
					//debug(res.body);
					epg.talk(['lineups', data.iden], res.body);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
	/**
	 * headend schedule
	 * 
	 * 
	 * */
	schedules: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['schedulesError', data.iden],{action: 'schedules', error: { message: 'No auth token present'}});
			return
		} 
		
		debug('agent schedules');
		
		request
			.post('https://json.schedulesdirect.org/20141201/schedules')
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.send(data.stations)
			.end((err, res) => {
				// Calling the end function will send the request
				if(err && err.response.body.code !== 4102) {
					epg.talk(['schedulesError', data.iden],{action: 'schedules', error:  err, server: err }); 
				} else if(err && err.response.body.code === 4102) {
					
					epg.talk(['schedules', data.iden], { lineups: [] });
				} else if(res.status === 200) {
					//debug(res.body);
					epg.talk(['schedules', data.iden], res.body);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
	
	/**
	 * headend schedule
	 * 
	 * 
	 * */
	programs: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			epg.talk(['programsError', data.iden],{action: 'programs', error: { message: 'No auth token present'}});
			return
		} 
		
		debug('agent programs');
		
		request
			.post('https://json.schedulesdirect.org/20141201/programs')
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.send(data.programs)
			.end((err, res) => {
				// Calling the end function will send the request
				if(err && err.response.body.code !== 4102) {
					epg.talk(['programsError', data.iden],{action: 'programs', error:  err, server: err }); 
				} else if(err && err.response.body.code === 4102) {
					
					epg.talk(['programs', data.iden], []);
				} else if(res.status === 200) {
					//debug(res.body);
					epg.talk(['programs', data.iden], res.body);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
			});
		
		return;
	},
});

exports = module.exports = Agent;

function checkCallback(cb) {
	if(_.isFunction(cb)) {
		return cb;
	} else {
		return ()=>{};
	}
}

