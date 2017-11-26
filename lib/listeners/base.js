var	debug = require('debug')('epg:lib:listeners:base');
var path = require('path');
var fs = require('fs-extra');

module.exports = {
	emit(emit, data, socket) {
		if(!Array.isArray(emit)) {
			emit = [emit];
		}

		emit.forEach((v, k) => {
			//debug('listeners emit', v);
			if ( socket ) {
				socket.emit(v, data);
			}
			this.epg.emit(v, data);
		});
			
	},
	broadcast(emit, data, socket) {
		if(!Array.isArray(emit)) {
			emit = [emit];
		}

		emit.forEach((v, k) => {
			//debug('socket broadcast', v);
			if ( socket ) {
				socket.broadcast.emit(v, data);
			}
		});
			
	},	
	updateConfig( data, socket ) {
		if(typeof data !== 'object') {
			data = {}
		}
		if ( !data.username && !data.password ) {
			debug('no username and no password');
			//this.emit(['updateConfigError', data.iden], {action: 'updateConfig', error: { message: 'user or password required' }}, socket);
			//return;
		}
		debug('Update Configuration', data);
		let config = { ...data };
		delete config.iden;
		this.epg.reinit( config )
		.then(() => {
			debug('UPDATED', 'EMIT');
			this.emit(['updateConfig', data.iden], { action: 'updateConfig', message: 'Configuration Updated', success: true }, socket);
			return {}
		})
		.catch((e) => {
			debug('error reiniting', e);
			this.emit(['updateConfigError', data.iden], {action: 'updateConfig', message: 'error in the init process' + e.message, success: false }, socket);
			return;
		});
	}			
		
}

