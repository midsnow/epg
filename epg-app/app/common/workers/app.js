import SocketsIn from '../../lib/sockets.js';
import moment from 'moment';
import Source from './source/index.js';
import Send from './send/index.js'
import Promise from 'bluebird';

self.snowUI = {
	host: 'http://127.0.0.1',
	port: 3888
}

let Sockets = SocketsIn();

let source = Source( Sockets );
let send;

let	debug = console.log;

let port;
onconnect = function(e) {
	port = e.ports[0];
}
	
fetch('/conf/epg.js')
.then( data => {
	let cfg = data.json()
	return cfg;
})
.then( cfg => {
	debug('Start Worker', cfg); 
	Sockets.init({
		port: cfg.socketPort || cfg.port,
		host: cfg.socketHost || cfg.host,
		debug
	}, load );
	
	
});	

function load() {
	send = Send( source, port );
	
	port.onmessage = function(e) {
		debug('Worker Message', e);
		onMessage(e);
	}
	
	source.getChannels()
	.then( chans => {
		debug('got channels');
		port.postMessage({
			action: 'channels',
			data: chans
		});
		return source.getChannelGroups();
	})
	.then( group => {
		
		port.postMessage({
			action: 'groups',
			data: group
		});
		return source.getRecordings();
	})
	.then( record => {
		
		port.postMessage({
			action: 'recordings',
			data: record
		});
		return source.getSeries();
	})
	.then( ser => {
		ser.forEach( ( c, k ) => {
			//series.setItem( c.seriesId, c );
		});
		port.postMessage({
			action: 'series',
			data: ser
		});
		return source.getTimers();
	})
	.then( tims => {
		tims.forEach( ( c, k ) => {
			//timers.setItem( c.timersId, c );
		});
		port.postMessage({
			action: 'timers',
			data: tims
		});
		//return source.getGuideData();
		return {}
	})
	.then( data => {
		debug('Got guide data');
	})
	.catch( e => {
		debug( 'Error', e );
	});
}

function onMessage (event) {
	let data = event.data;
	debug('onMessage', data);
	// the data.action contains our message key value
	let who = data.action
	if ( typeof send[who] === 'function' ) {
		send[who](data.data);
	} else {
		port.postMessage({
			action: data.action,
			data: {
				success: false
			}
		});
	}
}

function guide2(filter) {
	
	let g = { 
		end:  moment(filter.moment).add(filter.hours, 'hours'),
		start: moment(filter.moment).subtract(1, 'hours')
	}
	
	if(filter.stations !== Object(filter.stations)) {
		return postMessage({data:filter,message:'filter.channel is not an object'});
	}
	
	Sockets.guide({ stationID: filter.stations, ...g }, (data) => {
	
	});
	
	Sockets.io.on('guide data', gotGuideData);
}

function gotGuideData(data) {
	postMessage(data);
}





