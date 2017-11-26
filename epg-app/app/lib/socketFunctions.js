import React from 'react';
import path from 'path';
import randomNumber from 'hat';
import Gab from '../common/gab'
import Promise from 'bluebird';
import debugging from 'debug';
let	debug = debugging('epg:app:lib:socketFunctions');

function options() {
	 
	var exports = {};
	
	exports.trapResponse = function(socket, callback) {
		
		var unique = randomNumber();
		
		socket.once(unique, callback);
		
		return unique;
	}
	exports.trap = exports.trapResponse;
	
	exports.updateConfiguration = function(config, callback) {
		
		if ( !this.connected.io ) {
			if ( config.socketHost ) {
				this.host = config.socketHost;
			}
			if ( config.socketPort ) {
				this.port = config.socketPort;
			}
			Gab.once('connect', (e) => {
				debug('Connected');
				this.updateConfiguration( config );
			});
			this.connect();
			if ( typeof callback == 'function' ) {
				callback( config );
			}
			return;
		}
		
		if(callback) {
			config.iden = this.trap(this.io, callback);
		} else {
			config.iden = randomNumber();
		}
		if ( !config.server ) {
			delete config.port;
			delete config.host;
		}
		debug('updateConfig', config);
		this.io.emit('updateConfig', config);
		
	};
	
	exports.headends = function(postal, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		this.io.emit('headends',{ 
			postal,
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.lineupMap = function(headend, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			debug(this.epg.state.status);
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		headend.iden = this.trap(this.io, callback);
		this.io.emit('lineupMap', headend);
	};
	
	exports.grabLineupMap = function(headend, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		headend.iden = this.trap(this.io, callback);
		this.io.emit('grabLineupMap', headend);
	};
	
	exports.updateChannel = function(channel, update, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return; //callback({ error: { message: 'Waiting for connections' } } );
		}
		
		if(callback) {
			channel.iden = this.trap(this.io, callback);
		} else {
			channel.iden = randomNumber();
		}
		this.io.emit('updateChannel', { channel, update });
		
	};
	
	exports.updateHeadend = function(headend, update, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return; // callback({ error: { message: 'Waiting for connections' } } );
		}
		
		if(callback) {
			headend.iden = this.trap(this.io, callback);
		} else {
			headend.iden = randomNumber();
		}
		this.io.emit('updateHeadend', { headend, update });
		
	};
	
	exports.schedules = function(headend, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		headend.iden = this.trap(this.io, callback);
		this.io.emit('schedules', headend);
	};
	
	exports.lineups = function(callback) {
		if(!callback) {
			callback = ()=>{}
		}
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		this.io.emit('lineups',{
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.guide = function(guideData, callback) {
		if(!callback) {
			callback = ()=>{}
		}
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		this.io.emit('guide',Object.assign(guideData, {
			iden: this.trap(this.io, callback)
		}));
	};
	
	exports.lineupRemove = function(lineup, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		// lineup should be a object and include uri
		this.io.emit('lineupRemove',{ 
			...lineup,
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.lineupAdd = function(lineup, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		lineup.iden = this.trap(this.io, callback);
		this.io.emit('lineupAdd', lineup);
	};
	
	exports.refreshGuide = function(lineup, callback) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		Gab.reset();
		lineup.iden = this.trap(this.io, ()=>{});
		this.io.emit('refreshGuide', lineup);
		var readData = (data) => {
			
			debug('guide refresh updates', data);
			callback(data);
			if(data.end) {
				this.io.removeListener('refreshGuide', readData);
			}
		}
		this.io.on('refreshGuide', readData);
	};
	
	exports.status = function(callback) {
		debug('get status');
		if(!callback) {
			callback = ()=>{}
		}
		this.io.emit('status',{ 
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.addEvent = function(event, emitTo) {
		if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			return callback({ error: { message: 'Waiting for connections' } } );
		}
		
		debug('add Event', event);
		this.io.emit('add', Object.assign({ 
			list: 'Event',
			iden: this.trap(this.io, talk)
		}, event));
		function talk(data) {
			debug('addEvent got a result', data);
			Gab.emit(emitTo, data);
		}
	};
	
	exports.grab = function(request, emitTo = 'json') {
		debug('get ' + request.action, request);
		return new Promise((resolve, reject) => {
			//if ( !this.epg.state.status._db || !this.epg.state.status._agent ) {
			//	resolve({ error: { message: 'Waiting for connections' } } );
			//	return;
			//}
			this.io.emit(request.action, Object.assign({ 
				iden: this.trap(this.io, talk)
			}, request));
			
			function talk(data) {
				debug('GRAB route got a result', data);
				Gab.emit(emitTo, data);
				if(data.success) {
					resolve(data);
				} else {
					reject(data)
				}
			}
  
		});		
	}
	
	
	return exports;
	
}

export default options;
