var	_ = require('lodash');
var	debug = require('debug')('epg:lib:socket');
var async = require("async");
var Listeners = require('./listeners');

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
			
			socket.on('ready', function() {
				debug('ready');
				//epg.agent.headends('30082');
				//epg.agent.lineupAdd('USA-GA10428-X');
				//epg.agent.lineupMap('USA-GA10428-X');
			});

			socket.on('headends', function(data) {
				debug('socket headends');
				epg.Listen.headends(data);
				
			});
			
			socket.on('lineupMap', function(data) {
				debug('socket lineupMap');
				epg.Listen.lineupMap(data);
				
			});
			
			socket.on('updateHeadend', function(data) {
				debug('socket updateHeadend');
				epg.Listen.updateHeadend(data);
				
			});
			
			socket.on('updateChannel', function(data) {
				debug('socket updateChannel');
				epg.Listen.updateChannel(data);
				
			});
			
			socket.on('schedules', function(data) {
				debug('socket schedules');
				epg.Listen.schedules(data);
				
			});
			
			socket.on('status', function(data) {
				debug('socket status');
				epg.Listen.status(data);
				
			});
			
			socket.on('lineups', function(data) {
				debug('socket lineups');
				epg.Listen.lineups(data);
				
			});
			
			socket.on('lineupAdd', function(data) {
				debug('socket lineupAdd');
				epg.Listen.lineupAdd(data);
				
			});
			
			socket.on('lineupRemove', function(data) {
				debug('socket lineupRemove');
				epg.Listen.lineupRemove(data);
			});
			
			socket.on('token', function(update) {
				
				debug(update);
				epg.Listen.token(update);
				
			});
			
		});
		
		
		
	}
	
	return exports;
}

module.exports = sockets;


