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
var debug = require('debug')('epg:lib:express');

module.exports = function ( ISM ) {
	return class Express {
		constructor ( opts = {} ) {
			this._opts = opts;
			
			//this.prefix = opts.prefix || this._options.prefix || 'epg/api/v1';
			this.port = opts.port || ISM._options.port || 3889;
			this.host = opts.host || ISM._options.host || '127.0.0.1';
			
			this.app = xxpress()
			debug('Express constructed', this.host, this.port);
			
			this.app.use(logger('dev'));
			
			this.server = http.createServer( this.app );
			this.io = socketio( this.server );	
			this.io.on("connection", ( info ) => {
			});	
			
			return this;
		}
		
		end(cb) {
			debug('close server', this.server.close);
			this.server.close();
			if (cb ) cb()
		}
		
		_path ( ...rest ) {
			//debug(rest, ...rest)
			return path.join('/', this.prefix, ...rest);
		}
		
		start ( ) {
			return this.sockets()
			.then(() => this.route())
			.then(() => this.listen())
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
				if(ISM._options.env == 'development') {
					debug('Hot Reload watching: ', ISM.watchAppFiles);
					var Watcher = require('chokidar-socket-emitter')({ 
						path: ISM.watchAppFiles, 
						io: this.io 
					});
				}
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
