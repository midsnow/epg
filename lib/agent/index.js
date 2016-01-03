var request = require('superagent');
var _ = require('lodash');
var debug = require('debug')('epg:lib:agent:index');

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
		
		if(!_.isArray(emits)) {
			emits = [emits];
		}

		emits.forEach((v, k) => {
			epg.talk(v, data)
		});
		
	},
	
	_resetToken: function() {
		var epg = this.epg;
		var auth = epg.get('auth');
		
		debug('reset auth token');
		auth.token = false;
		epg.set('auth', auth);
		
		epg.talk('token', 'Reset token in progress');
		this.token(auth);
		
		return
	},
	
	token: function(auth, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(!_.isObject(auth)) {
			auth = epg.get('auth');
		}
		
		if(!_.isEmpty(auth.token)) {
			debug('emit ready');
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
					epg.emit('tokenError',{action: 'token', error: { message: 'Error getting a token from Agent'}, server: err.response.body}); 
				} else if(res.status === 200) {
					debug(res.body);
					if(res.body.token) {
						auth.token = res.body.token;
						epg.set('auth',auth);
						debug('token ready', epg.get('auth'));
						epg.emit('ready');
					}
				} else {
					debug(res.status,res.body)
				}
				
			});
	},
	/**
	 * status
	 * 
	 * set some options
	 * */
	status: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		auth = epg.get('auth');
		if(!data) {
			data = {};
		}
		if(_.isEmpty(auth.token)) {
			debug('status no auth token');
			epg.emit(['statusError', data.iden],{action: 'status', error: { message: 'No auth token present'}});
			
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
						this.talk(['statusError', data.iden],{action: 'status', error: { message: 'Error talking to agent'}, server: err.response.body}); 
					} else if(res.status === 200) {
						//debug(res.body);
						this.talk(['status', data.iden], res.body);
					} else if(res.status === 403) {
						this._resetToken();
					} else {
						debug(res.status,res.body)
					}
					
				});
		}
	},
	/**
	 * headends
	 * 
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
			this.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Auth token required'}});
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
					this.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Error talking to agent'}, server: err.response.body});
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
						this.talk(['headends',  data.iden], ret);
					} else {
						this.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Error talking to agent'}, server: err.response.body});
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
	 * 
	 * */
	lineupAdd: function(data, callback) {
		var epg = this.epg;
		
		callback = checkCallback(callback);
		
		if(_.isEmpty(data.lineup)) {
			this.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: { message: 'No lineup uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			this.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: { message: 'No auth token present'}});
			return
		} 
		request
			.put('https://json.schedulesdirect.org' + data.uri)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				if(err) {
					this.talk(['lineupAddError', data.iden], {action: 'lineupAdd', error: { message: 'Error talking to agent'}, server: err.response.body}); 
				} else if(res.status === 200) {
					//debug(res.body);
					this.talk(['lineupAdd', data.iden], res.body);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
				}
				
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
		
		if(_.isEmpty(data.lineup)) {
			this.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error: { message: 'No lineup uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			this.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error: { message: 'No auth token present'}});
			return
		} 
		request
			.delete('https://json.schedulesdirect.org' + data.lineup)
			.set('token', auth.token)
			.set('User-Agent', this.agent)
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Calling the end function will send the request
				debug(err);
				if(err) {
					this.talk(['lineupRemoveError', data.iden], {action: 'lineupRemove', error: { message: 'Error talking to agent'}, server: err.response.body}); 
				} else if(res.status === 200) {
					//debug(res.body);
					this.talk(['lineupRemove', data.iden], res.body);
				} else if(res.status === 403) {
					this._resetToken();
				} else {
					debug(res.status,res.body)
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
			this.talk(['lineupMapError', data.iden], {action: 'lineupMap', error: { message: 'No lineup map uri present'}});
			return;
		}
		
		auth = epg.get('auth');
		if(_.isEmpty(auth.token)) {
			debug('No auth lineupMap')
			this.talk(['lineupMapError', data.iden], {action: 'lineupMap', error: { message: 'No auth token present'}});
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
					this.talk(['lineupMapError', data.iden],{action: 'lineupMap', error: { message: 'Error talking to agent'}, server: err.response.body}); 
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
										
					this.talk(['lineupMap', data.iden], lineupMap);
					
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
			this.talk(['lineupsError', data.iden],{action: 'lineups', error: { message: 'Not authorized. Asking for permission from agent now...'}});
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
					this.talk(['lineupsError', data.iden],{action: 'lineups', error: { message: 'Error talking to agent'}, server: err.response.body }); 
				} else if(err && err.response.body.code === 4102) {
					
					this.talk(['lineups', data.iden], { lineups: [] });
				} else if(res.status === 200) {
					//debug(res.body);
					this.talk(['lineups', data.iden], res.body);
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
			this.talk(['schedulesError', data.iden],{action: 'schedules', error: { message: 'No auth token present'}});
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
					this.talk(['schedulesError', data.iden],{action: 'schedules', error: { message: 'Error talking to agent'}, server: err.response.body }); 
				} else if(err && err.response.body.code === 4102) {
					
					this.talk(['schedules', data.iden], { lineups: [] });
				} else if(res.status === 200) {
					//debug(res.body);
					this.talk(['schedules', data.iden], res.body);
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

