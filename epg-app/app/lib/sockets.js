import _ from 'lodash';
import debugging from 'debug';
import SF from  './socketFunctions';
import Gab from '../common/gab';
let	debug = debugging('epg:app:lib:sockets');
import io from 'socket.io-client';


let Sockets = function() {
	
	// connected
	this.connected = {
		io: false,
		open: false
	}
	this.proxy = 'proxy';
}


Sockets.prototype.connect = function( callback ) {
	this.io = io(this.host + ':' + this.port + '/epg', { 'force new connection': true, reconnection: true });
	debug('reconnect'); 
	
	this.io.on('connect',(data) => {
		debug('connected', 'epg');
		this.connected.io = true; 
		this.status();
		this._count = 0;
	});
	this.io.on('connect-error',(err) => {
		debug('auth connect-error',err);
		this.connected.io =  false;
		if ( this._count < 30 ) {
			setTimeout(this.connect, 10000);
			this._count++;
		}
		//Gab.emit('error', err)
		// location.href = '/client/signin';
		// router.transitionTo('signin');
	});
	
	this.io.on('disconnect',(err) => {
		debug('io disconnect... wait for 15 secs',err);
		this.connected.io =  false;
		if ( this._count < 30 ) {
			setTimeout(this.connect, 10000);
			this._count++;
		}
	});
	
	if(_.isFunction(callback)) {
		callback(null,true);
	}
}

Sockets.prototype.init = function(opts, callback) {
	let _opts = {
		host: '@',
		port: '3888'
	};
	if(_.isFunction(opts)) {
		callback = opts;
		opts = _opts;
	}
	
	if(!_.isObject(opts)) {
		opts = _opts;
	}
	debug(snowUI)
	if(typeof window !== 'undefined') {
		this.port = snowUI.port || opts.port;
		this.host = snowUI.host || opts.host;
	} else {
		this.port = opts.port;
		this.host = opts.host;
	}
	
	let _this = this;
	
	// connection
	debug('io connect', '' + this.host + ':' + this.port + '/epg');
	this.io = io(this.host + ':' + this.port + '/epg', { reconnection: true });
	
	this.io.on('connect',(data) => {
		debug('io connected', 'epg');
		this._count=0;
		this.connected.io =  true;
		
		if(_.isFunction(callback)) {
			callback(null,true);
		}
	});
	this.io.on('connect-error',(err) => {
		debug('io connect-error',err);
		// Gab.emit('error', err);
		//location.href = '/client/signin';
		this.connected.io =  false;
		if ( this._count < 30 ) {
			//setTimeout(this.connect, 10000);
			this._count++;
		}
	});
	
	this.io.on('disconnect',(err) => {
		debug('io disconnect... wait for 1 minute',err);
		this.connected.io =  false;
		if ( this._count < 30 ) {
			//setTimeout(this.connect, 10000);
			this._count++;
		}
	});
	
	function updateConsole(...a) {
		debug(...a); 
	}
	
	
}

_.extend(Sockets.prototype, SF());


export default new Sockets();
