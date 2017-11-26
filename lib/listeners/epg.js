var	debug = require('debug')('epg:lib:listeners:epg');
var async = require("async");
var _ = require('lodash');

module.exports = {
				
		getTVChannels( data ) {
			return this.epg.adapter.getTVChannels( )
			.then( ( channels ) => {				
				debug( 'got data from getTVChannels' );
				return {
					success: true,
					channels,
				};
			});				
			
		}, // end getChannels
		
		getChannelGroups( ) {
			debug('getChannelGroups');
			return this.epg.adapter.getChannelGroups( )
			.then( ( groups ) => {				
				debug( 'got data from getChannelGroups' );
				return {
					success: true,
					groups,
				};
			});
		}, // end getChannelGroups
		
		getGuideData( data ) {				
			debug('getGuideData', data); 
			return this.epg.adapter.getGuideData( data )
			.then( ( groups ) => {
				debug( 'got data from getGuideData' );
				return {
					success: true,
					entries: {
						total: groups.total,
						groups: groups.data
					}
				};
			});
		}, // end getGuideData
		
		getGuideProgram( searchFor, searchKey, single ) {
							
			debug('getGuideProgram');
			return this.epg.adapter.getGuideProgram( searchFor, searchKey, single )
			.then( ( epg ) => {
				debug( 'got data from getGuideProgram' );
				return {
					success: true,
					program: epg
				};
			});			
		}, // end getGuideProgram
		
		getSeriesTimers( callback ) {
							
			debug('getSeriesTimers');
			
			return this.epg.adapter.getSeriesTimers( callback )
			.then( ( series ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getSeriesTimers' );
				callback( null, series );
				return {
					success: true,
					series: series,
				};
			});
			
		}, // end getSeriesTimers
		
		getRecordings( callback ) {
							
			debug('getRecordings');
			return this.epg.adapter.getRecordings( callback )
			.then( ( recordings ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getRecordings' );
				callback( null, recordings );
				return {
					success: true,
					recordings: recordings,
				};
			})
			.catch(e => {
				debug('ERROR with getRecordings', e);
				var res = {
					success: false,
					recordings: [],
				}
				callback(['Error getting recordings', e], []);
				return res;
			});	
			
		}, // end getRecordings
		
		getTimers( callback ) {
							
			debug('getTimers');
			
			return this.epg.adapter.getTimers( callback )
			.then( ( timers ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getTimers' );
				callback( null, timers );
				return {
					success: true,
					timers: timers,
				};
			});
			
		}, // end getTimers
		
		setTimer( obj, callback ) {
							
			debug('setTimer');
			
			return this.epg.adapter.setTimer( obj, callback )
			.then( ( timers ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from setTimer' );
				callback( null, timers );
				return timers;
			});
			
		}, // end setTimer
		
		deleteTimer( obj, callback ) {
							
			debug('deleteTimer');
			
			return this.epg.adapter.deleteTimer( obj, callback )
			.then( ( timers ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from deleteTimer' );
				callback( null, timers );
				return timers;
			});
			
		}, // end setTimer
		
		deleteSeriesTimer( obj, callback ) {
							
			debug('deleteSeriesTimer');
			
			return this.epg.adapter.deleteSeriesTimer( obj, callback )
			.then( ( timers ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from deleteSeriesTimer' );
				callback( null, timers );
				return timers;
			});
			
		}, // end setTimer
	}

