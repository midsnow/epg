#!/usr/bin/env node

//require('look').start();

var cli = require('minimist')(process.argv.slice(2));
var epg = require('./epg')();
var util = require('util');
var hat = require('hat');
var debug = require('debug')('epg:cli');

var port = cli.port || 11000;
var host = cli.host || '@';

var moment = require('moment');

var t0 = process.hrtime();
var start = moment();

if ( cli.host && cli.port ) {
	var io = require('socket.io-client')(`http://${host}:${port}/epg`);
	io.on('connect', function () { 
		debug("socket connected");
		
	});
	io.on('connect_error', function (err) { debug("socket connection error", err); });
} else {
	var io = {
		emit: () => {}
	}
}

var _ready = false;

var commands = {
    md5:   ['m', 'get last modified'],
    schedules:   ['s', 'get schedule for headend'],
    dates:   ['d', 'get schedule for date range'],
    get:    ['g', 'GET (default)'],
    remove: ['r', 'DELETE', 'string', ' '],
    add:    ['a', 'PUT', ''],
    hdhomerun:    ['hdhr', 'Try and match a lienup from a hdhomerun channel list', ''],
    programs:    ['p', 'Get program information', ''],
    headend:    ['h', 'Add or Remove a headend', ''],
    lineups:    ['l', 'All current lineups', ''],
    metadata:    ['m', 'Get program metadata and media', ''],
    port:    ['port', 'port for io', ''],
    host:    ['host', 'host for io', ''],
};

var keepOpen = setInterval(()=>{},1000);
var Agent;
epg.init()
.then( () => {
	Agent = epg.Listeners;
	epg.talking('tokenError', (error) => {
	debug(util.inspect(error, true, 10, true))
	});
	epg.talking('error', (error) => {
		debug(util.inspect(error, true, 10, true))
	});
	epg.talking('ready', () => {
		debug('get status');
		debug(cli, cli.hdhr);
		_ready = true;
		run();
		
		Agent.status({});
		epg.onTalk('status',function(data) {
			debug('status', data.systemStatus[0].status);
			debug('server', data.serverID);
		});
	});
});



var headend;

function run() {
	if(cli.hdhr) {	
		hdhomerun(cli.hdhr);
	}
	if(cli.programs) {	
		headend = cli.programs;
		//io.emit('relay', { relay: 'guideRefreshDownload', downloading: true, lineup: headend });
		programs();
	}
	if(cli.schedule) {	
		headend = cli.schedule;
		//io.emit('relay', { relay: 'guideRefreshDownload', downloading: true, lineup: headend });
		schedule();
	}
	if(cli.grab) {	
		debug('grab');
		headend = cli.grab;
		//io.emit('relay', { relay: 'guideRefreshDownload', downloading: true, lineup: headend });
		grab();
	}
}


function grab(grab) {
	debug('get schedules and programs  for ' + headend );
	
	io.emit('relay', { relay: 'globalUpdate',  style: 'info', message: 'Starting a guide refresh for ' + headend });
	io.emit('relay', { relay: 'guideRefreshUpdate',  style: 'info', message: 'Starting a guide refresh for ' + headend });
	
	schedule(() => { programs(end) });
}

function end() {
	debug('end',process.hrtime(t0)[1]);
	var duration = moment.duration(process.hrtime(t0)[1]/1000000);
	var duration2 = moment.duration(start.milliseconds());
	debug('execution time: ', duration.asSeconds(), duration2.asSeconds());
	io.emit('relay', { relay: 'globalUpdate',  style: 'success', message: 'Finished guide refresh for ' + headend });
	io.emit('relay', { relay: 'guideRefreshUpdate',  style: 'success', message: 'Finished guide refresh for ' + headend });
	//io.emit('relay', { relay: 'guideRefreshDownload', downloading: false, lineup: headend   });
	setTimeout(() => {process.exit(0);},10000);
}

function schedule(callback) {
	debug('get schedules for ' + headend );
	epg.talking('schedulesError', (error) => {
		debug(util.inspect(error, true, 10, true))
	});
	var remember = hat();
	
	Agent.schedules({
		lineup: headend,
		iden: remember
	});
	
	epg.talking(remember, (data) => {
		debug('schedule event', data);
		io.emit('relay', { relay: 'guideRefreshUpdate',  style: 'warning', message: data});
	});
	epg.onTalk('schedulesDone', (data) => {
		debug('done with schedules...', data);
		if(typeof callback === 'function') {
			callback();
		} else {
			end();
		}
	});
}

function programs(callback) {
	debug('get programs for ' + headend );
	epg.talking('programsError', (error) => {
		debug(util.inspect(error, true, 10, true))
	});
	var remember = hat();
	
	Agent.programs({
		lineup: headend,
		iden: remember
	});
	
	epg.talking(remember, (data) => {
		debug('programs event', data);
		io.emit('relay', { relay: 'guideRefreshUpdate',  style: 'warning', message: data});
	});
	epg.onTalk('programsDone', (data) => {
		debug('done with programs...', data);
		if(typeof callback === 'function') {
			callback();
		} else {
			end();
		}
	});	
}

function hdhomerun(hdhomerun) {
	debug('get lineup from a hdhomerun device channel list for ' + hdhomerun );
	epg.talking('lineupAutoAddError', (error) => {
		debug(util.inspect(error, true, 10, true))
	});
	var remember = hat();
	
	Agent.lineupAutoAdd({
		hdhomerun: hdhomerun,
		iden: remember
	});
	
	epg.talking(remember, (data) => {
		debug('hdhomerun event', data);
		io.emit('relay', { relay: 'lineupAutoAdd',  style: 'success', message: data});
	});
}
