/**
Intranet Station Manager
Express class

*/
const xxpress = require('express');
const Promise = require('bluebird');
const http = require('http');
const path = require('path');
const logger = require('morgan');
const socketio = require('socket.io');
const cfg = require('../conf/epg.json');
var debug = require('debug')('epg:lib:express');

module.exports = function ( ISM ) {
	return class Express {
		constructor ( opts = {} ) {
			this._opts = opts;
			
			this.prefix = opts.prefix || cfg.prefix || 'ism';
			this.port = opts.port || cfg.port || 3888;
			this.host = opts.host || cfg.host || '0.0.0.0';
			
			this.app = xxpress()
			debug('Express constructed');
			
			this.server = http.createServer( this.app );
			this.io = socketio( this.server );	
			this.io.on("connection", ( info ) => {
			});		
			return this;
		}
		
		_path ( ...rest ) {
			//debug(rest, ...rest)
			return path.join('/', this.prefix, ...rest);
		}
		
		start ( ) {
			return this.sockets()
			.then(() => this.route())
			.then(() => this.listen())
			.catch(debug);
		}
		
		listen( ) {
			return new Promise( resolve => {
				this.server.listen(this.port, this.host, () => {
					debug('server started ', this.port)
					resolve();
				});
			});
		}
		
		sockets () {
			return new Promise( resolve => {
				ISM.socketRoutes( this.io );
				resolve();
			});
		}
		
		route( ) {
			return new Promise( resolve => {
				ISM.routes( this.app, false, (err) => {
					debug('Routes Done', err);
					resolve();
				})
			});
		}
	}
		
}
