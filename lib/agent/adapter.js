/**
 * PIM adapter
 * grab epg data
 * ####Example:
 *
 * PIM( epg, adapter )
 *
 * @param {instance} epg
 * @param {instance} adapter
 * @api public
 */

var debug = require('debug')('epg:agent:adapter');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var hat = require('hat');

module.exports = class PIM {
		
	constructor( epg, adapter ) {			
		debug('EPG PIM Adapter constructor');

		this.pvrStates = {
			pvr_timer_state_new: 0, // a new, unsaved timer
			pvr_timer_state_scheduled: 1,   //  the timer is scheduled for recording
			pvr_timer_state_recording: 2,   //  the timer is currently recording
			pvr_timer_state_completed: 3,   //  the recording completed successfully
			pvr_timer_state_aborted: 4 ,    //  recording started, but was aborted
			pvr_timer_state_cancelled: 5,   //  the timer was scheduled, but cancelled
			pvr_timer_state_conflict_ok: 6, //  the scheduled timer conflicts with another one but will be recorded
			pvr_timer_state_conflict_nok: 7, //  the scheduled timer conflicts with another one and won't be recorded
			pvr_timer_state_error: 8,       //  the timer is scheduled, but can't be recorded for some reason
				
		}
		this.recordingStates = {
			none: 0,
			scheduled: 1,
			initializing: 2,
			recording: 3,
			recorded: 4,
			deleted: 5,
		}
		
		this.epg = epg;
		
		debug('Adapter?', typeof adapter === 'function'); 
		
		if ( typeof adapter === 'function' ) {
			this.adapter = new adapter( epg )
		} else {
			this.adapter = {};
		}
		
		this.trap = ( callback ) => {
		
			var unique = hat();
			
			this.epg.once(unique, callback);
			
			return unique;
		}
				
		return this;
		
	}
	
	endSession( ) {
		debug('END Session');
		if ( this.adapter.endSession ) {
			return this.adapter.endSession();
		}
	}
	
	/* send notificationof updates or messages */
	notify( who, results ) {
		
		if ( this.adapter.notify ) {
			return this.adapter.notify( who, results );
		}
		
		//debug('notify', who, results);
		// remove the server status
		var isUp = results.shift() === 'True' ? true : false;
		//debug('after status', results);
		// remove the drivespace
		var space = results.shift();
		if ( typeof space === 'string' ) space = space.split("|");
		//debug('after space', space, results);
		var transform = {
			updateTimers: 'getAllTimers',
			updateRecordings: 'getRecordings',
			updateChannels: 'getChannels',
			updateChannelGroups: 'getChannelGroups',
			updateEPGForChannel: 'getGuideData',
			message: 'parseMessage'
		}
		results.forEach( function (v) {
			var vv = v.split('|');
			/*Broadcast.notify( 'notify epg', {
				update: transform[vv[0]] || vv[0] || false
			});*/
		});
	}
	
	getSeriesTimers( ) {
		
		if ( this.adapter.getSeriesTimers ) {
			return this.adapter.getSeriesTimers();
		} else {
			return Promise.resolve([]);
		}
	}
		
	getTimers( ) {
		
		if ( this.adapter.getTimers ) {
			return this.adapter.getTimers();
		} else {
			return Promise.resolve([]);
		}
	}
	
	setTimer( obj = {} ) {
		
		if ( this.adapter.setTimer ) {
			return this.adapter.setTimer( obj = {} );
		}else {
			return Promise.resolve([]);
		}		
	}
	
	deleteTimer( obj = {} ) {
		
		if ( this.adapter.deleteTimer ) {
			return this.adapter.deleteTimer( obj = {} );
		} else {
			return Promise.resolve([]);
		}
	}
	
	deleteSeriesTimer( obj ) {
		
		if ( this.adapter.deleteSeriesTimer ) {
			return this.adapter.deleteSeriesTimer( obj );
		} else {
			return Promise.resolve([]);
		}
	}
	
	/* get saved recordings */
	getRecordings( ) {
			
		if ( typeof this.adapter.getRecordings === 'function' ) {
			debug('Get recordings from adapter');
			return this.adapter.getRecordings( );
		} else {
			return Promise.resolve([]);
		}
	}
	
	/** guide data **/
	getGuideData( data ) {
		
		if ( this.adapter.getGuideData ) {
			return this.adapter.getGuideData( data );
		}
		
		let { id, start, end, skipMetadata, limit, skip } = data;
		let stations = id;
		
		return new Promise( ( resolve, reject ) => {
			
			debug('getGuideData');
			
			let q = this.epg.Models.Schedules.find();
			
			if ( stations ) {	
				if ( !Array.isArray( stations ) ) stations = [ stations ];	
				debug(' by stations', stations.length);
				q.where('stationID').in( stations );
			}
			if ( start ) {
				debug(' by start', start);
				q.where('airDateTime').gte( start );
			}
			if ( end ) {
				debug(' by end', end);
				q.where('airDateTime').lte( end );
			}
			if ( limit ) {
				debug(' limit ', limit);
				q.limit( limit );
			}
			if ( skip ) {
				debug(' skip ', skip);
				q.skip( skip );
			}
			//q.sort('stationID ASC');
			q.sort('airDateTime ASC');
			let ret = {}
			q.run({}, ( err, docs ) => {
				if( docs ) {
					debug('Got guide data', docs.length);
					let p = [];
					docs.forEach( doc => {
						if ( !ret[doc.stationID] ) {
							ret[doc.stationID] = [];
						}
						let title = doc.titles ? doc.titles[0] : { title120: 'Not Available' };
						//if( doc.titles) debug(doc.titles, doc.titles[0], title, title.title120, title[0])
						p.push(this.epg.Listeners.metadataAdd(doc, false, skipMetadata) 
							.then( cc => {
								//debug(cc)
								return ret[doc.stationID].push({
									stationID: doc.stationID,
									programID: doc.programID,
									id: doc.id,
									title: title.title120,
									plotOutline: doc.descriptions,
									episode: doc.episodeTitle150,
									plot: doc.descriptions,
									type: doc.entityType,
									iconPath: cc.image,
									photos: cc.images,
									firstAired: doc.originalAirDate,
									startTime: doc.airDateTime,
									duration: doc.duration,
									endTime: moment.unix(doc.airDateTime).add(doc.duration, 's').unix(),
									//genre: ( "" + ep.iGenreType + ep.iGenreSubType),
									repeat: !doc["new"],
								});
							}).catch((e) => { debug(e); return; })
						);						
					});
					Promise.all(p)
					.then( r => resolve({ total: docs.length, data: ret }))
					.catch(e => { debug(e); resolve([]) });
					
				} else {
					debug('No guide data');
					resolve([]);
				}
			});
		});
	}
	
	/** single guide program **/
	getGuideProgram( value, key, single = false ) {
		
		if ( this.adapter.getGuideProgram ) {
			return this.adapter.getGuideProgram(  value, key, single );
		}
		
		return new Promise( ( resolve, reject ) => {
			
			debug('getGuideProgram');
			
			let q = this.epg.Models.Schedules.find();
			let useKey;
			switch ( key ) {
				case "title":
					q.where('title').like( value );
					break;
				default:	
					q.where( 'id', value );
			}
			q.sort('airDateTime ASC');
			if ( single ) {
				q.limit(1);
			}			
			q.run({}, ( err, eps ) => {
				//debug(err,ep)
				let p = [];
				if ( !eps ) {
					resolve({});
				} else {					
					
					eps.forEach( ep => {
						let title = Array.isArray(ep.titles) ? ep.titles[0] : { title120: 'Not Available' };
						let info = {
							season: 0,
							episode: 0,
							totalEpisodes: 0
						}
						
						if ( ep.metadata !== null && typeof ep.metadata === 'object' ) {
							//debug(ep.metadata)
							ep.metadata.forEach( i => {
								let k = Object.keys(i)[0];
								info[k] = i[k] || {};
								if ( i[k].season ) {
									info.season = i[k].season;
								}
								if ( i[k].episode ) {
									info.episode = i[k].episode;
								}
								if ( i[k].totalEpisodes ) {
									info.totalEpisodes = i[k].totalEpisodes;
								}
							})
							if ( typeof ep.metadata.Gracenote === 'object' ) {
								epp.a = ep.metadata.Gracenote.season;
								epp.b = ep.metadata.Gracenote.episode;
								epp.c = ep.metadata.Gracenote.totalEpisodes;
							}
						}
						p.push(new Promise( ( resolve2 ) => {
							let pp = [];
							if ( single ) {
								ep.cast.forEach( (c,k) => {
									pp.push(this.epg.Listeners.celebrity(c) 
									.then( cc => {
										ep.cast[k] =  { 
											billingOrder: '01',
											role: c.role,
											nameId: c.nameId,
											personId: c.personId,
											name: c.name,
											characterName: c.characterName,
											photo: cc.photo,
											images: cc.images
										};
										//debug('done with person info', ep.cast[k]);
										return;
									}).catch((e) => { debug(e); return; }));
								});
							}
							let ppp = [];
							if ( single ) {
								ep.crew.forEach( (c,k) => {
									pp.push(this.epg.Listeners.celebrity(c) 
									.then( cc => {
										ep.crew[k] =  { 
											billingOrder: '01',
											role: c.role,
											nameId: c.nameId,
											personId: c.personId,
											name: c.name,
											characterName: c.characterName,
											photo: cc.photo,
											images: cc.images
										};
										//debug('done with person info', ep.crew[k]);
										return;
									}).catch((e) => { debug(e); return; }));
								});
							}
							let pppp = [ 
								this.epg.Listeners.metadataAdd(ep) 
								.then( cc => {
									//debug(cc)
									ep.image = cc.image;
									ep.images = cc.images;
									return ep
								}).catch((e) => { debug(e); return; })
							];			
							Promise.all(pp)
							.then( r => Promise.all(ppp))
							.then( r => Promise.all(pppp))
							.then( r => {
								//debug('done with cast info');
								resolve2( {
									epgId: ep.id,
									broadcastId: ep.stationID,
									stationID: ep.stationID,
									programID: ep.programID,
									title: title.title120 || '',
									plotOutline: ep.descriptions,
									plot: ep.descriptions,
									episode: ep.episodeTitle150,
									cast: ep.cast,
									crew: ep.crew,
									year: moment.unix(ep.originalAirDate).format("Y"),
									metadata: ep.metadata,
									iconPath: ep.episodeImage ? ep.episodeImage.uri : false,
									startTime: ep.airDateTime,
									endTime: moment.unix(ep.airDateTime).add(ep.duration, 's').unix(),
									genres:  ep.genres,
									firstAired: ep.originalAirDate,
									parentalRating: ep.iParentalRating,
									showType: ep.showType,
									info,
									images: ep.images,
									image: ep.image,
									repeat: !ep["new"],
									type: ep.entityType,
									contentAdvisory: ep.contentAdvisory,
									contentRating: ep.contentRating,
									movie: ep.movie
								})
							}).catch((e) => { debug(e); return; });
						}))
					});
					return Promise.all(p)
					.then( r => {
						debug('done with program info');
						resolve(r);
					} ).catch((e) => { debug(e); return; })
				}
			});
		});
	}
	
	
	/** channel list **/
	getTVChannels( ) {
		
		if ( this.adapter.getTVChannels ) {
			return this.adapter.getTVChannels();
		}
		
		return new Promise( ( resolve, reject ) => {
			
			const iden = this.trap( talk );
			
			this.epg.Listeners.lineupMap({
				iden,
				active: true, 
			});
						
			function talk( data ) {
				debug( 'got getTVChannels' );
				
				if ( !data.channels ) {
					return resolve({
						success: false,
						channels: []
					});
				}
				let tv = data.channels.map( c => {
					
					let station = _.find( data.stations, ( v, k ) => {
						//debug( v.stationID, c.stationID );
						return v.stationID == c.stationID;
					});
					if ( !station ) {
						station = {}
					}
					if ( typeof station.logo !== 'object' || station.logo == null ) {
						station.logo = {};
					}
					if ( Array.isArray(station.stationLogo) ) {
						//debug('use station logo 1', station.stationLogo[1]);
						station.logo = station.stationLogo[1] || station.stationLogo[0];
					}
					//debug( 'got station?', station.logo)
					return Object.assign({}, station, {
						id: c.id,
						epgId: c.id,
						stationID: c.stationID,
						name: station.name,
						channelName: station.name + '/' + c.channel,
						channel: Number( c.channel ),
						iconPath: station.logo.URL,
					})
				});
				resolve(tv);
			};
		});	
		
	}
	
	/** channel groups **/
	getChannelGroups( ) {
		
		if ( this.adapter.getChannelGroups ) {
			return this.adapter.getChannelGroups();
		}
		
		return this.getTVChannels()
		.then( channels => {
			// get groups
			return this._getGroups()
			.then( groups => {
				return {
					groups,
					channels
				}
			});				
		})
		.then( ret => {
			// get group map
			return this._getGroupMap()
			.then( map => {
				return {
					...ret,
					map
				}
			});	
		})
		.then( ret => {
			// build the return groups
			var groups = {};
			ret.map.forEach( function ( v, k ) {
				// v is the object of entries
				// find the group
				let group = _.find( ret.groups, g => g.id == v.group );
				if ( !groups[group.name] ) groups[group.name] = [];
				// find teh channel
				let channel = _.find( ret.channels, g => g.id == v.channel );
				//debug( channel)
				if ( channel ) groups[group.name].push(channel);
			});
			
			debug( 'Got getChannelGroups' );
			
			return groups;
		});
	}
	
	_getGroups() {
		return new Promise( ( resolve ) => {
			this.epg.Models.Groups.all( ( err, map ) => {
				if ( !map ) {
					map = [];
				}
				resolve(map);
			});		
		});
	}
	
	_getGroupMap() {
		return new Promise( ( resolve ) => {
			this.epg.Models.ChannelGroupMap.all( ( err, map ) => {
				if ( !map ) {
					map = [];
				}
				resolve(map);
			});		
		});
	}

} //end class
	
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

function safeFromJSON( val ) {
	if( typeof val === 'object' ) {
		try {
			val = JSON.parse(val);
		} catch(e) {
			val = {}
		}
	} else {
		val = {}
	}
	if ( !val ) val = {}
	return val;
}
