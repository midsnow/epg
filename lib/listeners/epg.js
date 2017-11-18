var	_ = require('lodash');
var	debug = require('debug')('epg:lib:listeners:epg');
var async = require("async");
var _ = require('lodash');

module.exports = {
				
		getTVChannels( data ) {
			return this.adapter.getTVChannels( )
			.then( ( channels ) => {				
				debug( 'got data from getTVChannels' );
				return {
					success: true,
					channels,
				};
			});				
			
		}, // end getChannels
		
		getChannelGroups( callback ) {
							
			debug('getChannelGroups');
						
			return Promise.resolve( {
				success: true,
				groups: [],
			});
			
		}, // end getChannelGroups
		
		getGuideData( id, start, end, callback ) {
							
			debug('getGuideData');
				
			return Promise.resolve({
					success: true,
					entries: {
						groups: []
					}
			});
			
		}, // end getGuideData
		
		getGuideProgram( searchFor, searchKey, callback ) {
							
			debug('getGuideProgram');
				
			return Promise.resolve( {
				success: true,
				program: epg,
			});
			
		}, // end getGuideProgram
		
		getSeriesTimers( callback ) {
							
			debug('getSeriesTimers');
			
			return Promise.resolve( {
				
					success: true,
					series: [],
				
			});
			
			return this.adapter.getSeriesTimers( callback )
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
			return Promise.resolve( {
				success: true,
					recordings: [],
			});	
			return this.adapter.getRecordings( callback )
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
			return Promise.resolve( {
				success: true,
					timers: {},
			});	
			return this.adapter.getTimers( callback )
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
			return Promise.resolve( {
				
			});	
			return this.adapter.setTimer( obj, callback )
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
			return Promise.resolve( {
				
			});	
			return this.adapter.deleteTimer( obj, callback )
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
			return Promise.resolve( {
				
			});	
			return this.adapter.deleteSeriesTimer( obj, callback )
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

