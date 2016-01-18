import React from 'react';
import path from 'path';
import _ from 'lodash';
import randomNumber from 'hat';
import Gab from '../common/gab'

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
		// lineup should be a string and the access uri
		this.io.emit('lineupRemove',{ 
			lineup,
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
	
	return exports;
	
}

export default options;
