import _ from 'lodash';
import debugging from 'debug';
import SF from  './socketFunctions';
import io from 'socket.io-client';
import Gab from '../common/gab';



let	debug = debugging('epg:app:lib:sockets');
let port = window.socketPort;
let host = window.socketHost;

let Sockets = function() {
	
	// connected
	this.connected = {
		io: false,
		open: false
	}
	this.io = io('//' + host + ':' + port + '/epg');
	debug('new sockets', '//' + host + ':' + port + '/epg');
	
	this.proxy = 'proxy';
	
	
}

Sockets.prototype.connectAuth = function(callback) {
	this.io = io('//' + host + ':' + port + '/epg', { 'force new connection': true });
	this.auth = this.io;
	debug('reconnect auth', this.auth);
	
	this.io.on('connect',(data) => {
		debug('auth connected', 'epg');
		this.connected.auth = true;
		
	});
	this.io.on('connect-error',(err) => {
		debug('auth connect-error',err);
		//Gab.emit('error', err)
		// location.href = '/client/signin';
		// router.transitionTo('signin');
	});
	
	
	if(_.isFunction(callback)) {
		callback(null,true);
	}
}

Sockets.prototype.init = function(callback) {
	
	
	let _this = this;
	
	this.io.on('connect',(data) => {
		debug('io connected', 'epg');
		this.connected.io =  {
			get() {
				this.io.socket.isConnected();
			}
		}
		
		if(_.isFunction(callback)) {
			callback(null,true);
		}
	});
	this.io.on('connect-error',(err) => {
		debug('io connect-error',err);
		// Gab.emit('error', err);
		//location.href = '/client/signin';
		if(_.isFunction(callback)) {
			callback(err);
		}
	});
	
	function updateConsole(...a) {
		debug(...a); 
	}
	
	
}

_.extend(Sockets.prototype, SF());


export default new Sockets();
