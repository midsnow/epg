var epg = require('./lib/epg.js');
var util = require('util');

epg.init();

epg.on('ready', function() {
	console.log('ready');
	//epg.agent.headends('30082');
	//epg.agent.lineupAdd('USA-GA10428-X');
	//epg.agent.lineupMap('USA-GA10428-X');
});

epg.on('status', function(status) {
	
	console.log('status',status);
	
});

epg.on('headends', function(status) {
	
	console.log('headends', util.inspect(status, {showHidden: false, depth: null}));
	
});

epg.on('lineupAdd', function(status) {
	
	console.log('lineupAdd', util.inspect(status, {showHidden: false, depth: null}));
	
});

epg.on('error', function(err) {
	
	console.log('Error Emitted',err);
	
});

epg.on('token', function(update) {
	
	console.log(update);
	
});
