import React from 'react';
import path from 'path';
import _ from 'lodash';
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
		
		if(callback) {
			config.iden = this.trap(this.io, callback);
		} else {
			config.iden = randomNumber();
		}
		this.io.emit('updateConfig', config);
		
	};
	
	exports.headends = function(postal, callback) {
		this.io.emit('headends',{ 
			postal,
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.lineupMap = function(headend, callback) {
		headend.iden = this.trap(this.io, callback);
		this.io.emit('lineupMap', headend);
	};
	
	exports.grabLineupMap = function(headend, callback) {
		headend.iden = this.trap(this.io, callback);
		this.io.emit('grabLineupMap', headend);
	};
	
	exports.updateChannel = function(channel, update, callback) {
		if(callback) {
			channel.iden = this.trap(this.io, callback);
		} else {
			channel.iden = randomNumber();
		}
		this.io.emit('updateChannel', { channel, update });
		
	};
	
	exports.updateHeadend = function(headend, update, callback) {
		if(callback) {
			headend.iden = this.trap(this.io, callback);
		} else {
			headend.iden = randomNumber();
		}
		this.io.emit('updateHeadend', { headend, update });
		
	};
	
	exports.schedules = function(headend, callback) {
		headend.iden = this.trap(this.io, callback);
		this.io.emit('schedules', headend);
	};
	
	exports.lineups = function(callback) {
		if(!callback) {
			callback = ()=>{}
		}
		this.io.emit('lineups',{
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.guide = function(guideData, callback) {
		if(!callback) {
			callback = ()=>{}
		}
		this.io.emit('guide',Object.assign(guideData, {
			iden: this.trap(this.io, callback)
		}));
	};
	
	exports.lineupRemove = function(lineup, callback) {
		// lineup should be a object and include uri
		this.io.emit('lineupRemove',{ 
			...lineup,
			iden: this.trap(this.io, callback)
		});
	};
	
	exports.lineupAdd = function(lineup, callback) {
		lineup.iden = this.trap(this.io, callback);
		this.io.emit('lineupAdd', lineup);
	};
	
	exports.refreshGuide = function(lineup, callback) {
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
		var promise = new Promise((resolve, reject) => {
			
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
		
		return promise;
		
	}
	
	
	return exports;
	
}

export default options;
