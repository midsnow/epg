var	_ = require('lodash');
var	debug = require('debug')('epg:lib:core:listeners');
var async = require("async");
var request = require('superagent');
var hat = require('hat');
var moment = require('moment');
var util = require('util');
var epg = require('./listeners/epg.js');
var adapter = require('./agent/adapter.js');
var fs = require('fs-extra');
var crypto = require('crypto');
var path = require('path');

var Listeners = function Listeners( epg1 ) {
	
	if ( !( this instanceof Listeners ) ) return new Listeners( epg1 );
	
	this.epg = epg1;
	this.adapter = new adapter( epg1 )
	debug('done laoding listeners');
	
	return this;
	
}

_.extend( Listeners.prototype , epg );

_.extend( Listeners.prototype , {	
	
	emit(emit, data, socket) {
		if(!_.isArray(emit)) {
			emit = [emit];
		}

		emit.forEach((v, k) => {
			debug('listeners emit', v);
			if ( socket ) {
				socket.emit(v, data);
			}
			this.epg.emit(v, data);
		});
			
	},
	broadcast(emit, data, socket) {
		if(!_.isArray(emit)) {
			emit = [emit];
		}

		emit.forEach((v, k) => {
			debug('socket broadcast', v);
			if ( socket ) {
				socket.broadcast.emit(v, data);
			}
		});
			
	},	
	guide( data, socket ) {
		debug('Agent grab guide data')
		
		var _this = this;
		
		var g = { 
			end:  moment().startOf('day').add(2, 'days'),
			start: moment().startOf('day').subtract(1, 'days')
		}

		if(_.isString(data)) {
			data.stationID = data;
		} 
		
		var userData = Object.assign(g, data);
		
		if(_.isEmpty(userData.stationID)) {
			debug('EPG at least a stationID required to get guide data')
			this.emit(['guideError', userData.iden], {action: 'guide', error: { message: 'EPG at least a stationID required to get guide data' }}, socket);
			return;
		}
		
		var Programs = this.epg.Models.Programs;
		var Schedules = this.epg.Models.Schedules;
		var inStations =  Array.isArray(userData.stationID) ? userData.stationID : [userData.stationID];
		
		async.forEachOfLimit(inStations, 10,  function(station, index, next) {
			runStations(station, next);
		});
		
		function runStations(station, next) {
			//_this.emit([userData.iden], {action: 'guide', data: { message: 'Guide data loading' }});
			var myData = Object.assign({}, userData);
			myData.stationID = station;
			getGuideData(myData, next);
		}
		
		function getGuideData(data, next) {
			var filter = {
				where: {
					airDateTime: {
						between : [data.start, data.end]
					},
					stationID: data.stationID
				},
				order: 'airDateTime'
			};
			debug('get results', filter);
			Schedules.all(filter, (err, docs) => {
				if(err) {
					debug('error grabbing guide', err);
					return this.emit([userData.iden, 'error'],{ error: { message: 'Error finding cached channels for ' + remember.lineup + ' from database.. grabbing from agent instead' }}, socket);
				}
				var stations = {};
				stations[data.stationID] = {}
				async.forEachOfLimit(docs, 20,  function(doc, index, next2) {
					debug('get programs', data.stationID, doc.programID, index);
					
					Programs.findOne({ where: { programID: doc.programID } }, function(err, program) {
						if(err || !program) {
							//debug('program error');
							stations[data.stationID][moment(doc.airDateTime).valueOf()] = _.omit(doc.toObject(), _.isNull);
							return next2();
						} else {
							//debug('merge program data and delete null values');
							stations[data.stationID][moment(doc.airDateTime).valueOf()] = (_.omit(Object.assign( doc.toObject(), program.toObject()), _.isNull));
							return next2();
						}
						
					});
					
				}, function(err) {
					debug(stations)
					if(Object.keys(stations[data.stationID]).length > 0) {
						var results = {
							stations: stations
						};
						//debug(results);
						process.nextTick(() => {
							_this.emit(['guide data'], results, socket);
							_this.broadcast(['guide data'], results, socket);
						});
					}	
					next();
				});
			});
		}
					
	},		
	headends( data, socket ) {
		debug('Agent grab headends', data)
		
		if(_.isString(data)) {
			data = {
				postal: data
			}
		}
		
		if(_.isEmpty(data.postal)) {
			debug('Agent no postal code present')
			this.emit(['headendsError', data.iden], {action: 'headends', error: { message: 'Postal code required' }}, socket);
			return;
		}
		
		this.epg.onTalk('headends', (results) => {
			this.emit(['headends', data.iden], results, socket);
		});
		
		return this.epg.agent.headends(data);
			
	},
	
	lineups( data, socket ) {
		debug('Agent grab lineups', data)
		
		// is cache false
		if(isFalse(data.cache)) {
			this.epg.onTalk('lineups', (results) => {
				this.emit(['lineups', data.iden], results, socket);
				if(data._broadcast) {
					this.broadcast(['lineups', data.iden], results, socket);
				} 
			});
			return this.epg.agent.lineups(data);
		}
		
		var Headends = this.epg.Models.Headends;
		
		// search for the headend,  the headend is referencd in the client as lineup
		var filter = { order: 'name' };
					
		// see if we have any cache results
		Headends.all(filter, (err, docs) => {
			if(err) {
				debug('error grabbing channels', err);
				return this.emit([data.iden, 'error'],{ error: { message: 'Error finding cached channels for ' + remember.lineup + ' from database.. grabbing from agent instead' }}, socket);
			}
			
			var results = {
				lineups: docs
			}
			
			this.emit(['lineups', data.iden], results, socket);
			if(data._broadcast) {
				this.broadcast(['lineups', data.iden], results, socket);
			} 			
			
		});
	},
	lineupMap( headend, socket ) {
		debug('Agent grab lineupMap', headend)
		
		var _this = this;
				
		if(!headend.lineup) {
			debug('no lineup');
			//this.emit(['lineupMapError', headend.iden], {action: 'lineupMap', error: { message: 'Lineup required' }});
			//return;
		}
		
		// is refresh true, then grab data
		debug('refresh?', headend.refresh, !!headend.refresh);
		if ( !!headend.refresh === true ) {
			debug('refresh yes');
			// resfresh enabled so force grab and save
			return this.grabLineupMap( headend );
		}
		
		
		// is cache false
		if ( isFalse( headend.cache ) ) {
			debug('get fresh results and do not cache');
			this.epg.onTalk('lineupMap', (results) => {
				_this.emit(['lineupMap', headend.iden], results, socket);
				if(headend._broadcast) {
					_this.broadcast(['lineupMap', headend.iden], results, socket);
				} 
			});
			return this.epg.agent.lineupMap(headend);
		}
		
		// copy the original data for use later
		var remember = Object.assign({}, headend);
		
		// our models
		var Channels = this.epg.Models.Channels;
		var Stations = this.epg.Models.Stations;
		
		// our template for sending data back
		var results = {
			channels:[],
			stations:[]
		};
		
		// search for the headend,  the headend is referencd in the client as lineup
		var where = { where: {} };
		if( remember.active ) {
			where.where.active = true;
		}	
		if( remember.lineup ) {
			where.where.headend = remember.lineup;
		}			
		// see if we have any cache results
		Channels.find(where, (err, docs) => {
			if(err) {
				debug('error grabbing channels', err);
				_this.emit(['lineupMapError', headend.iden], { error: { message: 'Error finding cached channels for ' + remember.lineup + ' from database' }}, socket);
				return;
			}
			if(Array.isArray(docs) && docs.length === 0) {
				debug('no channels... ');
				_this.emit(['lineupMapError', headend.iden], { error: { message: 'No cached channels for ' + remember.lineup + ' in database' }}, socket);
				return;
			}
			
			// add docs to template
			results.channels = _.sortBy(docs, function(n) {
				//debug(n.channel.replace('-','.').replace(' ','.'),parseFloat(n.channel.replace(['-',' '],'.')));
				//return parseFloat(n.channel.replace('-','.').replace(' ','.'))
				return parseFloat(n.channel.replace('-','.').replace(' ','.'))
			});
			
			// check for cache results
			var filter = { where: {}, order: 'name' };
				
			Stations.find(filter, (err, docs) => {
				if(err) {
					debug('error grabbing stations', err);
					_this.emit(['lineupMapError', headend.iden], { error: { message: 'Error finding cached stations from database' }}, socket);
					return;
				}
				if(Array.isArray(docs) && docs.length === 0) {
					debug('no stations...', filter);
					_this.emit(['lineupMapError', headend.iden], { error: { message: 'No cached stations for ' + remember.lineup + ' in database' }}, socket);
					return;
				}
				
				// add stations to result
				results.stations = docs;	
				
				debug('return docs...');
				
				_this.emit(['lineupMap', headend.iden], results, socket);
				
				if ( headend._broadcast ) {
					_this.broadcast(['lineupMap', headend.iden], results, socket);
				}
			});				
		});	
	},
	grabLineupMap( headend, socket ) {
		
		var _this = this;
		
		if(!headend.uri) {
			debug('no lineup uri');
			this.emit(['lineupMapError', headend.iden], {action: 'grabLineupMaps', error: { message: 'lineup uri required' }}, socket);
			return;
		}
		
		// change the iden so we catch the results instead of sending over the socket
		headend.iden = hat();
		this.epg.onTalk(headend.iden, store);
		this.epg.agent.lineupMap(headend, store);
		
		// copy the original data for use later
		var remember = Object.assign({}, headend);
		
		// our models
		var Channels = this.epg.Models.Channels;
		var Stations = this.epg.Models.Stations;
		var Headends = this.epg.Models.Headends;
				
		// cache
		function addChannels(data, next) {
			debug('Num of Channels', data.channels.length)
			async.forEachOfSeries(data.channels, (c, key, done) => {
				c.headend = remember.lineup;
				c.channel = setChannel(c);
				if ( Number(c.channel) > 499 ) {
					c.active = 1;
				}
				var chan = new Channels(c, false);
				chan.save((err, newdoc) => {
					if(err) {
						debug('error adding channel', err);
						this.emit('error',{ error: { message: 'Error adding channel with ' + data.stationID + ' to database' }}, socket);
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
										_this.emit('error',{ error: { message: 'Channels not added, could not remove previous entries!' }}, socket);
									}
									debug('add new channels after remove');
									addChannels(data, next);								
								});
							} else {
								debug('add new channels now');
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
									_this.emit('error', { error: { message: 'Error adding station ' + data.stationID + ' to database' }}, socket);
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
						debug('add metadata modified', data.metadata.modified, remember.lineup);
						Headends.find({lineup: remember.lineup}, function(err, doc) {
							if(err) debug(er);
							if(doc) {
								Headends.update({lineup: remember.lineup}, { modified: data.metadata.modified }, (err)=>{debug(err)});
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
				headend.refresh = false;
				_this.lineupMap(headend);
			});	
		}
	},
	lineupAutoAdd( data, socket ) {
		debug('Agent grab lineupAutoAdd', data)
		this.epg.onTalk('lineupAutoAdd', (results) => {
			this.emit(['lineupAutoAdd', data.iden], results);
			if(data._broadcast) {
				this.broadcast(['lineupAutoAdd', data.iden], results);
			} 
		});
		this.epg.agent.lineupAutoAdd( data );
			
	},
	lineupAdd( data ) {
		debug('Agent grab lineupAdd', data)
		
		// is cache false
		if(isFalse(data.cache)) {
			this.epg.onTalk('lineupAdd', (results) => {
				this.emit(['lineupAdd', data.iden], results, socket);
				this.broadcast(['lineupAdd', data.iden], results, socket);
			});
			return this.epg.agent.lineupAdd(data);
		}
		
		var Headends = this.epg.Models.Headends;
		
		var remember = Object.assign({}, data);
		
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
		var store = (results) => {
			debug('results lineupAdd',results)
					
				Headends.updateOrCreate({ lineup: add.lineup }, add, (err, newdoc) => {
					if(err) {
						debug('error adding headend', err);
						this.emit('error',{ error: { message: 'Error adding headend ' + data.lineup + ' from database' }}, socket);
					}	
					if(typeof results.error === 'object' && results.error.message) {
						this.emit(['lineupAdd', remember.iden], results, socket)
					} else {
						this.emit(['lineupAdd', remember.iden], newdoc, socket);
						this.lineups({ _broadcast: true });
					}
						
								
				});
			
		}
		
		data.iden = hat();
		
		this.epg.onTalk(data.iden, store);
		this.epg.agent.lineupAdd(data);

	},
	
	lineupRemove( data, socket ) {
		debug('Agent lineupRemove', data)
		
		// is cache false
		if(isFalse(data.cache)) {
			this.epg.onTalk('lineupRemove', (results) => {
				this.emit(['lineupRemove', data.iden], results, socket);
				this.lineups({ _broadcast: true });
			});
			return this.epg.agent.lineupRemove(data);
		}
		
		var Headends = this.epg.Models.Headends;
		
		var remember = Object.assign({}, data);
		
		// cache
		var store = () => {
			debug('remove doc', remember.lineup)
			Headends.remove({ where: { lineup: remember.lineup } },(err) => {
				if(err) {
					debug('error removing headends', err);
					this.emit('error',{ error: { message: 'Error removing headend ' + data.lineup + ' from database' }}, socket);
				}
				this.status(data);
				this.lineups({ _broadcast: true });
			});
		}
		
		data.iden = hat();
		
		this.epg.onTalk(data.iden, store);
		this.epg.onTalk(data.iden, (results) => {
			this.emit(['lineupRemove', remember.iden], results, socket);
		});
		// send the request to remove the headend
		this.epg.agent.lineupRemove(data);
			
	},
	
	updateChannel( data, socket ) {
		debug('Agent updateChannel')
				
		var Channels = this.epg.Models.Channels;
		
		// cache
		// update attribute
		debug('update attribute', data.channel.id)
		Channels.updateOrCreate({ id: data.channel.id }, data.update ,(err, doc) => {
			if(err) {
				debug('error update attribute', err);
				this.emit('error',{ error: { message: 'Error update attribute for ' + data.name + ' from database' }}, socket);
			} else {
				debug(err);
				var results = {
					source: 'channels',
					data: data,
					index: data.channel.index
				}
				this.emit(['updateChannel', data.iden], results, socket);
				this.broadcast(['updateChannel', data.iden], results, socket);
			}
		});	
	},
	
	updateHeadend( data, socket ) {
		debug('Agent updateHeadend')
				
		var Headends = this.epg.Models.Headends;
		
		// cache
		// update attribute
		debug('update attribute', data.headend.lineup)
		Headends.updateOrCreate({ lineup: data.headend.lineup }, data.update ,(err, doc) => {
			if(err) {
				debug('error update attribute', err);
				this.emit('error',{ error: { message: 'Error update attribute for ' + data.name + ' from database' }}, socket);
			} else {
				debug(err);
				this.emit('updateHeadend', doc, socket);
				this.lineups({ _broadcast: true }, socket);
			}
		});	
	},
	
	
	/** 
	 * schedules and programs should be called froma seperate process.  
	 * we communicate with this.epg.talk for the cli program and broadcast for the connected clients
	 * 
	 * */
	schedules( data ) {
		debug('listener schedules')
		
		var _this = this;
		
		// is cache false
		if(isFalse(data.cache)) {
			this.epg.onTalk('schedules', (results) => {
				//this.emit(['schedules', data.iden], results);
				//if(data._broadcast) {
				//	this.broadcast(['schedules', data.iden], results);
				//} 
			});
			return this.epg.agent.schedules(data);
		}
		
		if(!data.lineup) {
			debug('no lineup');
			this.epg.talk(['schedulesError', data.iden], {action: 'schedules', error: { message: 'headend required' }});
			return;
		}
		
		var remember = Object.assign({}, data);
		remember.total = 0;
		remember.limit = 4800;
		remember.skip = 0;
		remember.ratelimit = data.ratelimit || 500;
		
		var Channels = this.epg.Models.Channels;
		var Schedules = this.epg.Models.Schedules;
		
		// run the database items through a queue
		var queue = async.queue(store, remember.ratelimit);
		
		var done = function() {
			_this.epg.talk('schedulesDone', {remember});
		}
		queue.drain = () => {
			getChannels()
		};
		
		getChannels()
		
		function getChannels(skip, limit) {
			// defaults
			if(!skip) var skip = remember.skip;
			if(!limit) var limit = remember.limit;
			
			process.nextTick(() => {
				_this.epg.talk(['refreshGuide', 'schedules', remember.iden],'Get channels from database 4500 at a time... Total schedule records so far ' + remember.total);
			});
			
			Channels.find({where: { headend: data.lineup, active: true}, skip: skip, limit: limit }, (err, docs) => {
				if(err) {
					debug(err)
				}
				if(docs && docs.length > 0) {
					data.stations = docs.map((v) => { return { stationID: v.stationID } });
					remember.limit = limit;
					remember.skip = docs.length + remember.skip;
					_this.epg.talk(['refreshGuide', 'schedules', remember.iden],'Got ' + docs.length + ' active channels... Asking agent for schedules.');
					return grab();
				} else {
				
					debug('done grabbing schedules');
					done();
					
				}
			});
			//debug('EPG', this.epg)
			_this.epg.talk(['refreshGuide', 'schedules', remember.iden], 'Adding schedules in background');
		}
		// cache
		function store(result, finished) {
			
			if(typeof result === 'object') {
					var pro = result;
					var n = 0;
					pro.programs.forEach((p, k) => {
						
						p.headend = remember.lineup;
						p.stationID = pro.stationID;
						
						p.airDateTime = moment(p.airDateTime).unix();
						p.airDateEndTime = moment.unix(p.airDateTime).add(p.duration, 's').unix();
						Schedules.updateOrCreate({ stationID: p.stationID, airDateTime: p.airDateTime, headend: p.headend, programID: p.programID }, p, (err, newdoc) => {
							if(err) {
								debug('error adding schedule', err, remember, p.programID, newdoc);
								_this.epg.talk(data.iden,{ error: { message: 'Error adding program ' + p.programID + ' to database' }});
							}
							
							n++;
							remember.total++;
							
							if(n === pro.programs.length) {
								process.nextTick(() => {
									_this.epg.talk(['refreshGuide', 'programs', remember.iden],'Added ' + n + ' programs for station ' + pro.stationID)
								});
								return finished();
							
							} else {
								
								return true;
							
							}		
						});
					});
			} else {
				debug('bad result', pro);
				return finished();
			}			
		}
		
		function grab() {
			// change the iden so we catch the results instead of sending over the socket
			data.iden = hat();
			_this.epg.onTalk(data.iden, (data) => {
				queue.push(data, function (err) {
					//debug('finished processing item');
				});
			});
			_this.epg.agent.schedules(data);
		}			
	},
	
	programs( data ) {
		debug('listener programs')
		
		var _this = this;
		
		// is cache false
		if(isFalse(data.cache)) {
			debug('data.cache isFalse', isFalse(data.cache));
			_this.epg.onTalk('programs', (results) => {
				//this.epg.emit(['refreshGuide', 'programs', data.iden], results);
				//if(data._broadcast) {
				//	this.broadcast(['programs', data.iden], results);
				//} 
			});
			return _this.epg.agent.programs(data);
		}
		
		if(!data.lineup) {
			debug('no lineup');
			_this.epg.talk(['programsError', data.iden], {action: 'programs', error: { message: 'headend required' }});
			return;
		}
		
		var remember = Object.assign({}, data);
		
		var Programs = this.epg.Models.Programs;
		var Schedules = this.epg.Models.Schedules;
		
		remember.total = 0;
		remember.limit = 2500;
		remember.skip = 0;
		remember.ratelimit = data.ratelimit || 500;
		
		// run the database items through a queue
		var queue = async.queue(store, remember.ratelimit);
		
		var done = () => {
			_this.epg.talk('programsDone', {remember});
		}
		queue.drain = () => {
			debug('drain');
			delete data.programs
			getScheds()
		};
		
		getScheds( );
		
		function getScheds(skip, limit) {
			// defaults
			if(!skip) var skip = remember.skip;
			if(!limit) var limit = remember.limit;
			
			process.nextTick(() => {
				_this.epg.talk(['refreshGuide', 'programs', remember.iden],'Get schedule from database 4500 at a time... Total records so far: ' + remember.total)
			})
			
			
			Schedules.find({where: { headend: data.lineup }, skip: skip, limit: limit}, (err, docs) => {
				if(docs && docs.length > 0) {
					data.programs = _.uniq(docs.map((v) => { return  v.programID  }));
					remember.limit = limit;
					remember.skip = docs.length + remember.skip;
					_this.epg.talk(['refreshGuide', 'programs', remember.iden],'Got ' + docs.length + ' active timeslots for ' + data.lineup + '... Asking agent for schedules.');
					return grab( );
					
				} else {
					done();
				}
				_this.epg.talk(['refreshGuide', 'programs', remember.iden],'done grabbing programs... Total: ' + remember.total);
			});
		}
		
		function stringMe( val ) {
			if( typeof val === 'object' ) {
				try {
					val = JSON.stringify(val);
				} catch(e) {
					val = {}
				}
			} else {
				val = {}
			}
			return val;
		}
		// cache
		function store(result, finished) {
			//debug('run store');
			var n = 0;
			var pro = result;
			
			if(pro.descriptions === Object(pro.descriptions) ) {
				pro.descriptions = {
					short: Array.isArray(pro.descriptions.description100) ? pro.descriptions.description100[0].description : '',
					long: Array.isArray(pro.descriptions.description1000) ? pro.descriptions.description1000[0].description : ''
				}
			} else {
				pro.descriptions = {}
			}
			if(pro.titles === Object(pro.titles) ) {
				pro.title = pro.titles.title120;
			} else {
				pro.title = 'Not Available';
			}
			pro.recommendations = stringMe( pro.recommendations );
			pro.episodeImage = stringMe( pro.episodeImage );
			pro.contentRating = stringMe( pro.contentRating );
			pro.contentAdvisory = stringMe( pro.contentAdvisory );
			pro.episodeImage = stringMe( pro.episodeImage );
			pro.movie = stringMe( pro.movie );
			pro.metadata = stringMe( pro.metadata );
			pro.cast = stringMe( pro.cast );
			pro.crew = stringMe( pro.crew );
			pro.titles = stringMe( pro.titles );
			pro.genres = stringMe( pro.genres );
			pro.eventDetails = stringMe( pro.eventDetails );
			pro.originalAirDate = moment(pro.originalAirDate).unix();
			
			Schedules.find({ where: { programID: pro.programID } }, ( err, docs ) => {
				//debug( 'Got Find', err );
				if ( docs ) {
					debug('Adding program info to ' + docs.length + ' entries');
					docs.forEach( doc => {
						Schedules.update({ id: doc.id }, pro, (err, newdoc) => {
							if(err) {
								debug('error adding program', err, remember, pro.programID, newdoc);
								_this.epg.talk('error',{ error: { message: 'Error adding program ' + pro.programID + ' to database' }});
							}
							//debug(newdoc)
							_this.epg.talk(['refreshGuide', 'programs', remember.iden],'Added program id ' + pro.programID + ' with title ' + pro.episodeTitle150);
							n++;
							remember.total++;
						});						
					});

					finished();	
					
				} else {
					debug(' no items so skip ');
					finished();
				}				
			});			
		}
		
		function grab() {
			// change the iden so we catch the results instead of sending over the socket
			data.iden = hat();
			_this.epg.onTalk(data.iden, (data) => {
				debug('got program data');
				queue.push(data, function (err) {
					debug('finished processing item');
				});
			});
			_this.epg.agent.programs(data);
		}			
	},
	
	updateConfig( data, socket ) {
		if(typeof data !== 'object') {
			data = {}
		}
		if ( !data.username && !data.password ) {
			debug('no username and no password');
			this.emit(['updateConfigError', data.iden], {action: 'updateConfig', error: { message: 'user or password required' }}, socket);
			return;
		}
		debug('Read Config File');
		fs.readJson(path.join(this.epg._options.moduleRoot, 'conf', 'epg.json'))
		.then( cfg => {
			let _reinit = false;
			
			if ( data.username ) {
				cfg.auth.username = data.username;
				_reinit = true;
			}
			if ( data.password ) {
				var shasum = crypto.createHash('sha1');
				shasum.update( data.password );
				cfg.auth.password = shasum.digest('hex');
				_reinit = true;
			}
			
			// socket
			if ( data.host ) {
				cfg.host = data.host;
				_reinit = true;
			}
			if ( data.port ) {
				cfg.port = data.port;
				_reinit = true;
			}
			
			// database
			if ( data.db_user ) {
				cfg.database.username = data.db_user;
				_reinit = true;
			}
			if ( data.db_db ) {
				cfg.database.database = data.db_db;
				_reinit = true;
			}
			if ( data.db_pass ) {
				cfg.database.password = data.db_pass;
				_reinit = true;
			}
			if ( data.db_driver ) {
				cfg.database.driver = data.db_driver;
				_reinit = true;
			}
			if ( data.db_host ) {
				cfg.database.host = data.db_host;
				_reinit = true;
			}
			if ( data.db_port ) {
				cfg.database.port = data.db_port;
				_reinit = true;
			}
			
			debug('Update Config File');
			this.epg.options({ ...this.epg._options, ...cfg });
			
			debug('ReInit?', _reinit);
			
			
			return cfg;	
		
		})
		.then( cfg => fs.outputJson(path.join(this.epg._options.moduleRoot, 'conf', 'epg.json'), cfg, {spaces: 2, EOL: '\r\n'}) )
		.then(() => {
			debug('Update Token');
			this.epg.agent._resetToken((err, tok) => {
				debug('Get Status');
				if ( err ) {
					this.emit(['updateConfig', data.iden], { action: 'updateConfig', message: err }, socket);
				}
				this.status( data )
			});
			this.emit(['updateConfig', data.iden], { action: 'updateConfig', message: 'Working' }, socket);
			return {}
		})
		.catch((e) => {
			debug('error saveing json file', e);
			this.emit(['updateConfigError', data.iden], {action: 'updateConfig', error: { message: 'error saveing json file' + e.message }}, socket);
			return;
		});
	},
	
	token( data, socket ) {
		
		if(typeof data !== 'object') {
			data = {}
		}
		debug('Agent grab token', data)
		this.epg.onTalk('ready', (results) => {
			this.emit(['ready', data.iden], results, socket);
			if(data._broadcast) {
				this.broadcast(['ready', data.iden], results, socket);
			} 
		});
		this.epg.agent.token(data);
			
	},
	status( data, socket ) {
		debug('Agent grab status')
		this.epg.onTalk('status', (results) => {
			debug('got status from agent ')
			if ( results.error ) {
				this.epg._connected.agent = results.error
			} else {
				this.epg._connected.agent = true;
			}
			this.emit(['status', data.iden], {
				...results, 
				username: this.epg._options.auth.username,
				db_user: this.epg._options.database.username,
				db_driver: this.epg._options.database.driver,
				db_host: this.epg._options.database.host,
				db_port: this.epg._options.database.port,
				db_db: this.epg._options.database.database,
				host: this.epg._options.host,
				port: this.epg._options.port,
				clean: this._CFG_CLEAN,
				_db: this.epg._connected.db,
				_agent: this.epg._connected.agent,
			}, socket); 
			if(data._broadcast) {
				this.broadcast(['status', data.iden], results, socket);
			} 
		});
		this.epg.onTalk('statusError', (results) => {
			debug('status eror')
			this.emit(['status', data.iden], { ...results, username: this.epg._options.auth.username }, socket);
		});
		this.epg.agent.status(data);
			
	},
});

module.exports = Listeners;

function isFalse( val ) {
	if(val == 'false') val = false;
	//debug('',typeof val === 'boolean' , !val, typeof val === 'boolean' && !val);
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
			
