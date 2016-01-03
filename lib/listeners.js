var	_ = require('lodash');
var	debug = require('debug')('epg:lib:core:listeners');
var async = require("async");
var request = require('superagent');
var hat = require('hat');

module.exports = function() {
	var epg = this;
	
	return {	
			
		headends( data ) {
			debug('Agent grab headends', data)
			
			if(_.isString(data)) {
				data = {
					postal: data
				}
			}
			
			if(_.isEmpty(data.postal)) {
				debug('Agent no postal code present')
				epg.talk(['headendsError', data.iden], {action: 'headends', error: { message: 'Postal code required' }});
				return;
			}
			
			return epg.agent.headends(data);
				
		},
		lineups( data ) {
			debug('Agent grab lineups', data)
			
			// is cache false
			if(isFalse(data.cache)) {
				return epg.agent.lineups(data);
			}
			
			var Headends = epg.Models.Headends;
			
			// search for the headend,  the headend is referencd in the client as lineup
			var filter = { order: 'name' };
						
			// see if we have any cache results
			Headends.all(filter, (err, docs) => {
				if(err) {
					debug('error grabbing channels', err);
					return epg.talk([data.iden, 'error'],{ error: { message: 'Error finding cached channels for ' + remember.lineup + ' from database.. grabbing from agent instead' }});
				}
				
				var results = {
					lineups: docs
				}
				
				epg.talk(['lineups', data.iden], results);
				
			});
		},
		lineupMap( headend ) {
			debug('Agent grab lineupMap', headend)
			
			if(!headend.uri) {
				debug('no lineup uri');
				epg.talk(['lineupMapError', headend.iden], {action: 'lineupMap', error: { message: 'lineup uri required' }});
				return;
			}
			
			// is cache false
			if(isFalse(headend.cache)) {
				debug('get fresh results and do not cache');
				return epg.agent.lineupMap(headend);
			}
			
			if(!headend.lineup) {
				debug('no lineup');
				epg.talk(['lineupMapError', headend.iden], {action: 'lineupMap', error: { message: 'Lineup required' }});
				return;
			}
			
			// copy the original data for use later
			var remember = Object.assign({}, headend);
			
			// our models
			var Channels = epg.Models.Channels;
			var Stations = epg.Models.Stations;
			var Headends = epg.Models.Headends;
			
			// is refresh true, then grab data
			debug('refresh?', headend.refresh, !!headend.refresh);
			if(!!headend.refresh === true) {
				debug('refresh yes')
				return grab();
			}
			
			// our template for sending data back
			var results = {
				channels:[],
				stations:[]
			};
			
			// search for the headend,  the headend is referencd in the client as lineup
			var where = { where: { headend: remember.lineup }};
						
			// see if we have any cache results
			Channels.find(where, (err, docs) => {
				if(err) {
					debug('error grabbing channels', err);
					epg.talk('error',{ error: { message: 'Error finding cached channels for ' + remember.lineup + ' from database.. grabbing from agent instead' }});
					return grap();
				}
				if(Array.isArray(docs) && docs.length === 0) {
					debug('no channels... grabbing results from agent');
					return grab();
				}
				
				// add docs to template
				results.channels = _.sortBy(docs, function(n) {
					//debug(n.channel.replace('-','.').replace(' ','.'),parseFloat(n.channel.replace(['-',' '],'.')));
					return parseFloat(n.channel.replace('-','.').replace(' ','.'))
				});
				
				// check for cache results
				Stations.all({order:'name'}, (err, docs) => {
					if(err) {
						debug('error grabbing stations', err);
						epg.talk('error',{ error: { message: 'Error finding cached stations from database.. grabbing from agent instead' }});
						return grap();
					}
					if(Array.isArray(docs) && docs.length === 0) {
						debug('no stations... grabbing new data from agent');
						return grab();
					}
					
					// add stations to result
					results.stations = docs;	
					
					debug('return docs...');
					
					epg.talk(['lineupMap', remember.iden], results);
					
				});				
				
			});
			
			function grab() {
				// change the iden so we catch the results instead of sending over the socket
				headend.iden = hat();
				epg.once(headend.iden, store);
				epg.agent.lineupMap(headend, store);
			}
			// cache
			function addChannels(data, next) {
				async.forEachOfSeries(data.channels, (c, key, done) => {
					c.headend = remember.lineup;
					c.channel = setChannel(c);
					var chan = new Channels(c, false);
					chan.save((err, newdoc) => {
						if(err) {
							debug('error adding channel', err);
							epg.talk('error',{ error: { message: 'Error adding channel with ' + data.stationID + ' to database' }});
						}	
						done();				
					});
				}, (err) => {
					debug('done ading channels');
					next();
				});
				
			}
			function store(data) {
				// run through the results
				debug('start channel add');
				async.series([
					(next) => {
						if(Array.isArray(data.channels)) {
							// add each channel
							debug('delete all channels');
							Channels.count({headend: remember.lineup }, function(err, count){
								debug(err, remember.lineup,  count, ' channels');
								if(count > 0) {
									Channels.remove({ where: { headend: remember.lineup }}, function(err) {
										if(err) {
											debug('Channels not added, could not remove previous lot');
											epg.talk('error',{ error: { message: 'Channels not added, could not remove previous entries!' }});
										}
										debug('add new channels after remove');
										addChannels(data, next);								
									});
								} else {
									debug('add new channels');
									addChannels(data, next);
								}
							});
											
						} else {
							debug('channels not an array');
							next();
						}
					},
					(next) => {
						if(Array.isArray(data.stations)) {
							// add each station
							debug('add all stations');
							async.forEachOfSeries(data.stations, (s, key, done) => {
								// s.channel = setChannel(s);
								Stations.updateOrCreate({ stationID: s.stationID }, s, function(err, newdoc) {
									if(err) {
										debug('error adding station', err);
										epg.talk('error',{ error: { message: 'Error adding station ' + data.stationID + ' to database' }});
									}
									done();				
								});
							}, (err) => {
								debug('done adding stations');
								next();
							});
						} else {
							debug('stations not an array');
							next();
						}	
					},
					(next) => {
						if(typeof data.metadata === 'object' && data.metadata.modified) {
							debug('add metadata modified');
							Headends.find({lineup: data.lineup}, function(err, doc) {
								if(err) debug(er);
								if(doc) {
									Headends.update({lineup: data.lineup}, { modified: data.metadata.modified }, (err)=>{debug(err)});
								}
								next();
							});
						} else {
							debug('no metadata');
							next();
						}	
					}
				], (err) => {
					debug('done with model add', err);
					epg.talk(['lineupMap', remember.iden], data);
				});	
			}
				
		},
		lineupAdd( data ) {
			debug('Agent grab lineupAdd', data)
			
			// is cache false
			if(isFalse(data.cache)) {
				return epg.agent.lineupAdd(data);
			}
			
			var Headends = epg.Models.Headends;
			
			var add = {
				headend: data.headend,
				location: data.location,
				transport: data.transport,
				lineup: data.lineup,
				name: data.name,
				uri: data.uri,
			}
			//debug('save headend', d);
			// cache
			var store = () => {
				Headends.updateOrCreate({ uri: add.uri }, add, (err, newdoc) => {
					if(err) {
						debug('error adding headend', err);
						epg.talk('error',{ error: { message: 'Error adding headend ' + data.lineup + ' from database' }});
					}					
				});
			}
			
			epg.once(data.iden, store);
			epg.agent.lineupAdd(data);
	
		},
		lineupRemove( data ) {
			debug('Agent lineupRemove', data)
			
			// is cache false
			if(isFalse(data.cache)) {
				return epg.agent.lineupRemove(data);
			}
			
			var Headends = epg.Models.Headends;
			
			// cache
			var store = () => {
				debug('remove doc', data.lineup)
				Headends.remove({ where: { uri: data.lineup } },(err) => {
					if(err) {
						debug('error removing headends', err);
						epg.talk('error',{ error: { message: 'Error removing headend ' + data.lineup + ' from database' }});
					}
				});
			}
			
			epg.once(data.iden, store);
			epg.agent.lineupRemove(data);
				
		},
		
		updateChannel( data ) {
			debug('Agent updateChannel')
					
			var Channels = epg.Models.Channels;
			
			// cache
			// update attribute
			debug('update attribute', data.channel.id)
			Channels.updateOrCreate({ _id: data.channel.id }, data.update ,(err, doc) => {
				if(err) {
					debug('error update attribute', err);
					epg.talk('error',{ error: { message: 'Error update attribute for ' + data.name + ' from database' }});
				} else {
					debug(err);
					epg.talk('updateChannel', {
						source: 'channels',
						data: data,
						index: data.channel.index
					});
				}
			});	
		},
		
		updateHeadend( data ) {
			debug('Agent updateHeadend')
					
			var Headends = epg.Models.Headends;
			
			// cache
			// update attribute
			debug('update attribute', data.headend.lineup)
			Headends.updateOrCreate({ lineup: data.headend.lineup }, data.update ,(err, doc) => {
				if(err) {
					debug('error update attribute', err);
					epg.talk('error',{ error: { message: 'Error update attribute for ' + data.name + ' from database' }});
				} else {
					debug(err);
					epg.talk('updateHeadend', data);
					epg.Listen.lineups({});
				}
			});	
		},
		
		schedules( data ) {
			debug('listener schedules')
			
			// is cache false
			if(isFalse(data.cache)) {
				return epg.agent.schedules(data);
			}
			
			if(!data.lineup) {
				debug('no lineup');
				epg.talk(['schedulesError', data.iden], {action: 'schedules', error: { message: 'headend required' }});
				return;
			}
			
			var remember = Object.assign({}, data);
			
			var Channels = epg.Models.Channels;
			var Schedules = epg.Models.Schedules;
			
			Channels.find({where: { headend: data.lineup, active: true}}, (err, docs) => {
				if(docs) {
					data.stations = docs.map((v) => { return { stationID: v.stationID } });
					return grab();
				}
				
				debug('err grabbing schedules');
				
			});
			
			// cache
			function store(result) {
				debug('add schedules ' );
				
				epg.talk(['schedules', remember.iden], {});
				
				result.forEach((pro, key) => {
					// s.channel = setChannel(s);
					
					pro.programs.forEach((p, k) => {
						p.headend = remember.lineup;
						p.stationID = pro.stationID; 	
						Schedules.updateOrCreate({ headend: remember.lineup, programID: p.programID }, pro, function(err, newdoc) {
							if(err) {
								debug('error adding schedule', err);
								epg.talk('error',{ error: { message: 'Error adding program ' + p.programID + ' to database' }});
							}
							// debug('added '+ p.programID);
									
						});
					});
					
				});
				
				return debug('adding schedules in background');
				
				
			}
			
			function grab() {
				// change the iden so we catch the results instead of sending over the socket
				data.iden = hat();
				epg.once(data.iden, store);
				epg.agent.schedules(data, store);
			}
			
				
		},
		token( data ) {
			debug('Agent grab token', data)
			epg.agent.token(data);
				
		},
		status( data ) {
			debug('Agent grab status', data)
			epg.agent.status(data);
				
		},
	}
}

function isFalse( val ) {
	if(val == 'false') val = false;
	debug('',typeof val === 'boolean' , !val, typeof val === 'boolean' && !val);
	return (typeof val === 'boolean' && !val)
}

function setChannel(v) {
	if(!v || typeof v !== 'object') {
		return 'undefined';
	}
	if(v.atscMajor) {
		return v.atscMajor + '-' + v.atscMinor;
	} 
	if(v.channel) {
		return v.channel;
	}
	if(v.frequencyHz && v.serviceID) {
		return v.serviceID;
	}
	if(v.uhfVhf) {
		return v.uhfVhf;
	}
	// debug('no channel', v)
	
}
			
