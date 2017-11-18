/**
 * PIM adapter using clamente models
 *
 * ####Example:
 *
 *     PIM({}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('epg:agent:adapter');
var moment = require('moment');
var _ = require('lodash');
var Promise = require('bluebird');
var hat = require('hat');

var PIM = function PIM ( epg ) {
			
		if ( !( this instanceof PIM ) ) return new PIM(  );
		
		debug('MariaDB Adapter constructor');

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
		
		this.trap = ( callback ) => {
		
			var unique = hat();
			
			this.epg.once(unique, callback);
			
			return unique;
		}
				
		return this;
		
}

module.exports = PIMDB;
	
	PIMDB.prototype.endSession = function ( ) {
		debug('END Session');
	}
	
	/* send notificationof updates or messages */
	PIMDB.prototype.notify = function ( who, results ) {
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
	
	PIMDB.prototype.getSeriesTimers = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
			callback = function() {};	
		}
		let vv = [];
		return {
			seriesId: Number(vv[0]),
			show: vv[1],
			channelId: Number(vv[2]),
			programId: Number(vv[3]),
			showName: vv[4],
			start: Number(vv[5]),
			end: Number(vv[6]),
			marginStart: Number(vv[7]),
			marginEnd: Number(vv[8]),
			isPreMarginRequired: vv[9],
			priority: vv[11],
			isPostMarginRequired: vv[10],
			//12: vv[12],
			anyChannel: strToBool(vv[13]),
			anyTime: strToBool(vv[14]),
			daysOfWeek: Number(vv[15]),
			state: Number(vv[16]),
			name: vv[17],
			genre: Number(vv[18]),
			subgenre: Number(vv[19]),
			runType: Number(vv[20]),
			timerId: Number(vv[21]),
			keyword: vv[22],
			fullText: vv[23],
			lifetime: Number(vv[24]),
			maximumRecordings: Number(vv[25]),
			priority: Number(vv[26]),
		} 
	}
		
	PIMDB.prototype.getTimers = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
				callback = function() {};
			}
		let vv = [];
		return {
			timerId: Number(vv[0]), // iClientIndex
			channelId: Number(vv[1]), // iClientChannelUid
			startTime: Number(vv[2]),
			endTime: Number(vv[3]),
			state: Number(vv[4]), // pvr_timer_state
			name: vv[5],
			directory: vv[6], //strDirectory
			info: vv[7], //summary
			priority: Number(vv[8]), 
			isRepeating: vv[9],
			recordMarginStart: Number(vv[11]),
			programId: Number(vv[10]),
			recordMarginEnd: Number(vv[12]),
			genre: Number(vv[13]),
			subgenre: Number(vv[14]),
			programId: Number(vv[15]),
			seriesTimerId: Number(vv[16]),
			isPreMarginRequired: vv[17],
			isPostMarginRequired: vv[18],
			runType: Number(vv[19]), // iPreventDuplicateEpisodes
			anyChannel: Number(vv[20]),
			anyTime: Number(vv[21]),
			daysOfWeek: Number(vv[22]), // iWeekdays
			parentSeriesID: Number(vv[23]), // iParentClientIndex
			lifetime: Number(vv[24]),
			maximumRecordings: Number(vv[25]),
			priority: Number(vv[26]),
			keyword: vv[27],
			fulltext: vv[28],
		}
		
	}
	
	PIMDB.prototype.setTimer = function ( obj = {}, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		debug('Add Timer Test', obj);
		
	
		var message = 'Working on scheduling {0} at {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('llll')
        );
        
        var error = 'Error scheduling {0} at {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('llll')
        );
		
		debug( 'Set a Timer', send);	
		let vv = [];
		return {}
		
	}
	
	PIMDB.prototype.deleteTimer = function ( obj = {}, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
	    
        var error = 'Error recording {0} on {2}.'.format(
            obj.title,
            moment.unix(obj.startTime).format('llll')
        );
		
		debug( 'Delete a Timer', send);	
		let vv = [];
		return {
				success: true,
				message: '{1}... Working on removing {0} on {2}.'.format(
					obj.title,
					results[0],
					moment.unix(obj.startTime).format('llll')
				),
			}
	}
	
	PIMDB.prototype.deleteSeriesTimer = function ( obj, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		
	    
        var error = 'Error cancelling {0}.'.format(
            obj.showName
        );
		
		debug( 'Delete a Series Pass', send);	
		let vv = [];
		return  {
				success: results[0] == 'error' ? false : true,
				message: results[0] == 'error' ? 'Could not remove series pass' : '{1}... Working on removing {0}.'.format(
					obj.showName,
					results[0]
				),
			};
		
	}
	
	/* get saved recordings */
	PIMDB.prototype.getRecordings = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
			callback = function() {};
		}
		
		let vv = [];
		return {
					recordingId: vv[0], // 
					title: vv[1], // 
					url: replaceSMB(vv[2]),
					directory: vv[3],
					show: show,
					count: count,
					plotOutline: vv[4], // 
					plot: vv[5],
					channelName: vv[6], //
					iconPath: vv[7], //
					thumbnailPath: vv[8], 
					recordingTime: Number(vv[9]),
					duration: Number(vv[11]),
					priority: Number(vv[10]),
					lifetime: Number(vv[12]),
					genreType: Number(vv[13]),
					subGenreType: Number(vv[14]),
					genre: Number('' + vv[13] + vv[14]),
					lastplayedPosition: Number(vv[15]),
					status: vv[16],
					channelId: Number(vv[17]),
					programId: Number(vv[18]),
					19: vv[19], // 
					audio: vv[20],
					21: Number(vv[21]),
					22: Number(vv[22]), // 
					23: Number(vv[23]), // 
					playCount: Number(vv[24]),
					25: vv[25],
					26: vv[26],
					27: vv[27],
					28: vv[28],
				} 
		
	}
	
	/** guide data **/
	PIMDB.prototype.getGuideData = function ( obj ) {
		var channels = obj.channels;
		var start = obj.start;
		var end = obj.end

		let ep = {};
		return {
							epgId: ep.idEpg,
							//channel: c.pop(),
							programId: ep.iBroadcastUid,
							episodeId: ep.iEpisodeId,
							//title: (typeof ep.sTitle == 'string') ? ep.sTitle.replace(/ *\([^)]*\) */g, "").trim() : '',
							episode: ep.sEpisodeName,
							iconPath: ep.sIconPath,
							firstAired: ep.iFirstAired,
							startTime: ep.iStartTime,
							endTime: ep.iEndTime,
							genre: ( "" + ep.iGenreType + ep.iGenreSubType),
							repeat: (Number(ep.iFirstAired) == Number(ep.iStartTime)),
						}
	}
	
	
	/** single guide program **/
	PIMDB.prototype.getGuideProgram = function ( program, key ) {
		let ep = {};
		return {
							channelName: ep.channelName,
							//channel: c.pop(),
							epgId: ep.idEpg,
							broadcastId: ep.idBroadcast,
							programId: ep.iBroadcastUid,
							//title: (typeof ep.sTitle == 'string') ? ep.sTitle.replace(/ *\([^)]*\) */g, "").trim() : '',
							plotOutline: ep.sPlotOutline,
							plot: ep.sPlot,
							originalTitle: ep.sOriginalTitle,
							cast: ep.sCast,
							director: ep.sDirector,
							writer: ep.sWriter,
							year:  ep.iYear,
							imdb: ep.sIMDBNumber,
							iconPath: ep.sIconPath,
							startTime: ep.iStartTime,
							endTime: ep.iEndTime,
							genreType: ep.iGenreType,
							genreSubType: ep.iGenreSubType,
							genre:  ep.sGenre,
							firstAired: ep.iFirstAired,
							parentalRating: ep.iParentalRating,
							starRating: ep.iStarRating,
							seriesId: ep.iSeriesId,
							episodeId:  ep.iEpisodeId,
							episodePart: ep.iEpisodePart,
							episode: ep.sEpisodeName,
						}
	}
	
	
	/** channel list **/
	PIMDB.prototype.getTVChannels = function ( ) {
		return new Promise( ( resolve, reject ) => {
			
			debug('getTVChannels');
			
			const iden = this.trap( talk );
			
			this.epg.lineupMap({
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
					if ( typeof c.logo !== 'object' ) {
						c.logo = {};
					}
					let station = _.find( data.stations, ( v, k ) => {
						//debug( v.stationID, c.stationID );
						return v.stationID == c.stationID;
					});
					debug( 'got station?', station)
					return {
						channelId: c.id,
						epgId: c.id,
						stationID: c.stationID,
						channelName: station.name + '/' + c.channel,
						channel: Number( c.channel ),
						iconPath: c.logo.URL,
						...station
					}
				});
				resolve({
					success: true,
					channels: tv,
				});
			};
		});	
		
	}
	
	
	/** channel groups **/
	PIM.prototype.getChannelGroups = function ( ) {
			
	let vv = [];

	}
	
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};
