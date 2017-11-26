import debugging from 'debug';
import Sockets from '../../lib/sockets.js';
import moment from 'moment';
import fs from 'fs-extra';

let	debug = debugging('epg:app:common:workers:guideData');

fs.readJson('../../../../conf/epg.json', (err, cfg) => {
	if ( err ) {
		throw new Error('No Configuration File Found');
	}
	Sockets.init({
		port: cfg.socketPort || cfg.port,
		host: cfg.socketHost || cfg.host
	});
	onmessage = function(e) {
		guide(e.data);
	}
});

function guide(filter) {
	
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


