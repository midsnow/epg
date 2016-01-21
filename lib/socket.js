var	_ = require('lodash');
var	debug = require('debug')('epg:lib:socket');
var async = require("async");
var Listeners = require('./listeners');
var spawn = require('child_process').spawn;

function sockets() { 
	
	var exports = {};
	/**
	 * All exports are added to the snowstreams.prototype
	 */
	
	exports.listeners = Listeners;
	
	exports.socketRoutes = function(io) {
		var epg = this;

		// create a new connection for open requests
		epg.io =  io.of('/epg');
		epg.io.on("disconnect", function(s) {
			debug('epg socket disconnected');
		});
		epg.io.on("connection", function(socket) {
			
			var listen = new epg.listeners(epg, socket);
			
			socket.on('ready', function() {
				debug('socket ready');
			});

			socket.on('relay', function(data) {
				//debug('relay', data);
				epg.squawk(data.relay, data);				
			});
			
			socket.on('headends', function(data) {
				debug('socket headends');
				listen.headends(data);
				
			});
			
			socket.on('guide', function(data) {
				debug('socket guide');
				listen.guide(data);
				
			});
			
			socket.on('lineupMap', function(data) {
				debug('socket lineupMap');
				listen.lineupMap( data);
				
			});
			
			socket.on('grabLineupMap', function(data) {
				debug('socket grabLineupMap');
				listen.grabLineupMap( data );
				
			});
			
			socket.on('updateHeadend', function(data) {
				debug('socket updateHeadend');
				listen.updateHeadend(data);
				
			});
			
			socket.on('updateChannel', function(data) {
				debug('socket updateChannel');
				listen.updateChannel( data);
				
			});
			
			socket.on('schedules', function(data) {
				debug('socket schedules');
				listen.schedules(data);
				
			});
			
			socket.on('refreshGuide', function(data) {
				debug('socket refresh guide data');
				
				if(!data.lineup) {
					socket.emit([data.iden, 'refreshGuide'],{ duration:"0", style: 'warning', html: 'Lineup required to grab guide data' });
				}
				
				var env = Object.create( process.env );
				env.DEBUG = 'epg:cli';
				debug(__dirname, __dirname + '/cli.js');
				var runProgram = spawn(__dirname + '/cli.js', ['--grab', data.lineup], { env: env });
				
				// stderr
				runProgram.stderr.on('data', function (d) {
					//debug('stderr: ' + d);
					//var d = Array.isArray(d) ? d.join(', ') : d.message ? d.message : 'data added';
					//socket.emit(['refreshGuide'],'success');
				});
				runProgram.stderr.on('end', function (d) {
					debug('stderr: end ' + d);
					//var d = Array.isArray(data) ? data.join(', ') : data.message ? data.message : 'data added';
					socket.emit(['refreshGuide'],{ duration:"0", style: 'warning', html: 'Grab for ' + data.lineup + ' has finished, but may have error!' });
					epg.squawk('guideRefreshDownload',{ downloading: false, lineup: data.lineup });
				});
				
				// stdout
				var n = 0;
				runProgram.stdout.on('data', function (d) {
					debug('stdout: ' + d);
					var d = Array.isArray(d) ? d.join(', ') : d.message ? d.message : 'data added';
					if(n===0) {
						epg.squawk('guideRefreshDownload', { downloading: true, lineup: data.lineup });
						socket.emit(['refreshGuide'],'success');
					}
					n++;
				});
				runProgram.stdout.on('end', function () {
					socket.emit(['refreshGuide'],{ duration:"0", style: 'success', html: 'Grab for ' + data.lineup + ' has finished!' });
					epg.squawk('guideRefreshDownload',{ downloading: false, lineup: data.lineup });
				});
				
			});
			
				
			socket.on('status', function(data) {
				debug('socket status');
				listen.status(data);
				
			});
			
			socket.on('lineups', function(data) {
				debug('socket lineups');
				listen.lineups(data);
				
			});
			
			socket.on('lineupAdd', function(data) {
				debug('socket lineupAdd');
				listen.lineupAdd(data);
				
			});
			
			socket.on('lineupRemove', function(data) {
				debug('socket lineupRemove');
				listen.lineupRemove(data);
			});
			
			socket.on('token', function(update) {
				
				debug(update);
				listen.token(update);
				
			});
			
		});
		
		
		
	}
	
	return exports;
}

module.exports = sockets;


