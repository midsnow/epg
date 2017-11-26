var	_ = require('lodash');
var	debug = require('debug')('epg:lib:socket');
var async = require("async");
var spawn = require('child_process').spawn;

function sockets() { 
	
	var exports = {};
	/**
	 * All exports are added to the snowstreams.prototype
	 */
	
	//exports.listeners = new Listeners( this )
	
	exports.socketRoutes = function( io ) {
		var epg = this;
		// add the listeners
		//

		// create a new connection for open requests
		epg.epgio =  io.of('/epg');
		debug('Attach socketRoutes to /epg');
		epg.epgio.on("disconnect", function(s) {
			debug('epg socket disconnected');
		});
		epg.epgio.on("error", function(s) {
			debug('epg socket err', s);
		});
		epg.epgio.on("connection", ( socket ) => {
						
			var listen = this.Listeners;
						
			socket.on('ready', function() {
				debug('socket ready');
			});

			socket.on('relay', function(data) {
				//debug('relay', data);
				epg.squawk(data.relay, data);				
			});
			
			socket.on('headends', function(data) {
				debug('socket headends');
				listen.headends(data, socket);
				
			});
			
			socket.on('guide', function(data) {
				debug('socket guide');
				listen.guide(data, socket);
				
			});
			
			socket.on('lineupMap', function(data) {
				debug('socket lineupMap');
				listen.lineupMap( data, socket );
				
			});
			
			socket.on('grabLineupMap', function(data) {
				debug('socket grabLineupMap');
				listen.grabLineupMap( data, socket );
				
			});
			
			socket.on('updateHeadend', function(data) {
				debug('socket updateHeadend');
				listen.updateHeadend(data, socket);
				
			});
			
			socket.on('updateChannel', function(data) {
				debug('socket updateChannel');
				listen.updateChannel( data, socket);
				
			});
			
			socket.on('schedules', function(data) {
				debug('socket schedules');
				listen.schedules(data, socket);
				
			});
			
			socket.on('refreshGuide', function(data) {
				debug('socket refresh guide data');
				
				if(!data.lineup) {
					socket.emit([data.iden, 'refreshGuide'],{ duration:"0", style: 'warning', html: 'Lineup required to grab guide data' });
				}
				
				var env = Object.create( process.env );
				//env.DEBUG = 'epg:cli';
				debug(__dirname, __dirname + '/cli.js --grab ' + data.lineup + ' --host ' + epg._options.host + ' --port ' + epg._options.port);
				var runProgram = spawn(__dirname + '/cli.js', ['--grab', data.lineup, '--host', epg._options.host, '--port', epg._options.port], { env: env });
				
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
				
			socket.on('updateConfig', function(data) {
				debug('socket updateConfig');
				listen.updateConfig(data, socket);
			});
			
			socket.on('status', function(data) {
				debug('socket status', data);
				listen.status(data, socket);
			});
			
			socket.on('lineups', function(data) {
				debug('socket lineups');
				listen.lineups(data, socket);
			});
			
			socket.on('lineupAdd', function(data) {
				debug('socket lineupAdd');
				listen.lineupAdd(data, socket);
			});
			
			socket.on('lineupRemove', function(data) {
				debug('socket lineupRemove');
				listen.lineupRemove(data, socket);
			});
			
			socket.on('token', function(update) {
				debug(update);
				listen.token(update, socket);
			});
			
			/* Guide and DVR */
			socket.on('getTVChannels', function ( data ) {
				listen.getTVChannels( data )
				.then( tv => {
					socket.emit( 'getTVChannels', tv );
					if ( data.iden ) {
						socket.emit( data.iden, tv );
					}
				}).catch(debug);
			});
			
			socket.on('getGuideData', function ( data ) {
				listen.getGuideData( data )
				.then( epg => {
					socket.emit( 'getGuideData', epg );
					if ( data.iden ) {
						socket.emit( data.iden, epg );
					}
				}).catch(debug);
			});
			
			socket.on('getGuideProgram', function ( data ) {
				listen.getGuideProgram( data.search, data.key, data.single )
				.then( epg => {
					socket.emit( 'getGuideProgram', epg );
					if ( data.iden ) {
						socket.emit( data.iden, epg );
					}
				}).catch(debug);
			});
			
			socket.on('getChannelGroups', function ( data ) {
				listen.getChannelGroups( )
				.then( groups => {
					socket.emit( 'getChannelGroups', groups );
					if ( data.iden ) {
						socket.emit( data.iden, groups );
					}
				}).catch(debug);
			});
			
			socket.on('getRecordings', function ( data ) {
				listen.getRecordings( )
				.then( recordings => {
					socket.emit( 'getRecordings', recordings );
					if ( data.iden ) {
						socket.emit( data.iden, recordings );
					}
				}).catch(debug);
			});
			
			socket.on('getSeriesTimers', function ( data ) {
				listen.getSeriesTimers( )
				.then( series => {
					socket.emit( 'getSeriesTimers', series );
					if ( data.iden ) {
						socket.emit( data.iden, series );
					}
				}).catch(debug);
			});
			
			socket.on('getTimers', function ( data ) {
				listen.getTimers( )
				.then( timers => {
					socket.emit( 'getTimers', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				}).catch(debug);
			});
			
			socket.on('setTimer', function ( data ) {
				listen.setTimer( data.timer )
				.then( timers => {
					socket.emit( 'setTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				}).catch(debug);
			});
			
			socket.on('deleteTimer', function ( data ) {
				listen.deleteTimer( data.timer )
				.then( timers => {
					socket.emit( 'deleteTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				}).catch(debug);
			});
			
			socket.on('deleteSeriesTimer', function ( data ) {
				listen.deleteSeriesTimer( data.timer )
				.then( timers => {
					socket.emit( 'deleteSeriesTimer', timers );
					if ( data.iden ) {
						socket.emit( data.iden, timers );
					}
				}).catch(debug);
			});
			
		});
		
		
		
	}
	
	return exports;
}

module.exports = sockets;


