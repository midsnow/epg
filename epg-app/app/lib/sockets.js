import _ from 'lodash';
import debugging from 'debug';
import SF from  './socketFunctions';
import Gab from '../common/gab';
let	debug = debugging('epg:app:lib:sockets');
import io from 'socket.io-client';
import listenTo from '../listenTo';

let Sockets = function( epg ) {
	
	if ( !( this instanceof Sockets ) ) return new Sockets( epg ); 
	// connected
	this.connected = {
		io: false,
		open: false
	}
	this.epg = epg;
	
}

Sockets.prototype.connect = function( callback ) {
	
	this.io = false;
	
	this.io = io(this.host + ':' + this.port + '/epg', { 'force new connection': true, reconnection: true });
	
	debug('reconnect', this.host + ':' + this.port + '/epg'); 
	
	this.io.on('connect',(data) => {
		debug('connected', 'epg');
		this.connected.io = true; 
		this.status();
		this._count = 0;
		Gab.emit('connect', true);
		Gab.emit('__socket-connect', true);
		Gab.emit('__reload', true);
	});
	this.io.on('connect-error',(err) => {
		debug('auth connect-error',err);
		this.connected.io =  false;
		if ( this._count < 30 ) {
			//setTimeout(this.connect, 10000);
			this._count++;
		}
		Gab.emit('connect-error', err)
	});
	
	this.io.on('error',(err) => {
		debug('io error... ',err);
		this.connected.io =  false;
	});
	
	this.io.on('disconnect',(err) => {
		//debug('io disconnect... wait for 10 secs',err);
		this.connected.io =  false;
		if ( this._count < 30 ) {
			//setTimeout(this.connect, 10000);
			this._count++;
		}
	});
	
	if(_.isFunction(callback)) {
		callback(null,true);
	}
}

Sockets.prototype.init = function(opts, callback) {
	
	let _opts = {
		host:  snowUI.host,
		port:  snowUI.port
	};
	if(_.isFunction(opts)) {
		callback = opts; 
		opts = _opts;
	}
	
	if(!_.isObject(opts)) {
		opts = _opts;
	}
	
	if ( opts.debug ) {
		debug = opts.debug;
	} 
	
	this.port = opts.port || _opts.port;
	this.host = opts.host || _opts.host;
	
	this.port = Number(this.port);
		
	let _this = this;
	
	// connection
	debug('io connect', '' + this.host + ':' + this.port + '/epg');
	this.io = io(this.host + ':' + this.port + '/epg', { reconnection: true });	
	
	this.io.on('connect',(data) => { 
		debug('io connected', 'epg');
		this._count=0; 
		this.connected.io =  true;
		Gab.emit('connect', true);
		Gab.emit('__socket-connect', true);
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
	
	this.io.on('error',(err) => {
		debug('io error... ',err);
		this.connected.io =  false;
	});
	
	function updateConsole(...a) {
		debug(...a); 
	}
}

_.extend(Sockets.prototype, SF());

let CreateSocket = function( context ) {
	let s = Sockets.bind( context );
	return new s();
}

export { CreateSocket };
export default Sockets;

