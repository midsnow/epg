var epg = require('../lib/epg.js')();
var util = require('util');

epg.init();

epg.on('ready', function() {
	console.log('ready');
	//epg.agent.headends('30082');
	//epg.agent.lineupAdd('USA-GA10428-X');
	var listen = new epg.listeners(epg, { emit: ()=>{}, broadcast: { emit: ()=>{} } });
	//listen.status();
	
	//listen.lineupMap( { refresh: true,
	listen.lineupRemove( { 
		lineup: 'USA-OTA-30082',
		uri: '/20141201/lineups/USA-OTA-30082',
	} );
	/*
	  
	 listen.updateHeadend( { 
		headend: {
			lineup: 'USA-GA10428-X',
		},
		update: {
			lineup: 'USA-GA10428-X',
			name: 'Charter Communications - Digital',
			uri: '/20141201/lineups/USA-GA10428-X',
			headend: 'GA10428',
			location: 'Smyrna',
			transport: 'Cable'
		} 
	} );*/
});

epg.on('status', function(status) {
	
	console.log('status',status);
	
});

epg.on('updateHeadend', function(status) {
	console.log('updated');
	console.log('updateHeadend', util.inspect(status, {showHidden: false, depth: null}));
	
});
epg.on('headends', function(status) {
	
	console.log('headends', util.inspect(status, {showHidden: false, depth: null}));
	
});

epg.on('lineupAdd', function(status) {
	
	console.log('lineupAdd', util.inspect(status, {showHidden: false, depth: null}));
	
});
epg.on('lineupRemove', function(status) {
	
	console.log('lineupRemove', util.inspect(status, {showHidden: false, depth: null}));
	
});
epg.on('lineupMapError', function(status) {
	
	console.log('lineupMapError', util.inspect(status, {showHidden: false, depth: null}));
	
});
epg.on('lineupMap', function(status) {
	console.log('lineupMap done');
	//console.log('lineupMap', util.inspect(status, {showHidden: false, depth: null}));
	
});

epg.on('error', function(err) {
	
	console.log('Error Emitted',err);
	
});

epg.on('token', function(update) {
	
	console.log(update);
	
});
