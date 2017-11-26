let	debug = console.log;

export default function( Sockets ) {
	
	let methods = {
		getRecordings() {
			debug('### getRecordings ###');
			return Request({
				action: 'getRecordings'
			})
			.then(data => {
				debug('### getRecordings ###', data);
				return data.recordings || [];
			})
			.catch(error => {
				debug('ERROR from getRecordings', error);
				return [];
			});
		},
		
		getAllTimers ( ) {
			return methods.getTimers()
			.then( () => methods.getSeries() );
		},
		
		getTimers ( ) {
			return Request({
				action: 'getTimers'
			})
			.then(data => {
				debug('### getTimers data ###', data);
				return data.timers || [];
			})
			.catch(error => {
				debug('ERROR from getTimers', error);
				return [];
			});
		},
		
		getChannelGroups() {
			debug('### getChannelGroups ###');
			return Request({
				action: 'getChannelGroups'
			})
			.then(data => {
				debug('### getChannelGroups ###', data);
				return data.groups;
			})
			.catch(error => {
				debug('ERROR from getChannelGroups', error);
				return [];
			});
		},
		
		getChannels() {
			return Request({
				action: 'getTVChannels'
			})
			.then(data => {
				debug('### getTVChannels ###', data);
				return data.channels || [];
			})
			.catch(error => {
				debug('ERROR from getTVChannels', error);
				return [];
			});
		},
		
		getSeries ( ) {
			return Request({
				action: 'getSeriesTimers'
			})
			.then(data => {
				return data.series || [];
			})
			.catch(error => {
				debug('ERROR from getSeries', error);
				return [];
			});
		},
		
		getGuideData ( data ) {
			return Request( data )
			.then(data => {
				return data.entries || [];
			})
			.catch(error => {
				debug('ERROR from getGuideData', error);
				return [];
			});
		},
		
	}
	
	return methods;
	
	function Request( props, emitTo ) { 
		debug('Send request ', props);
		return Sockets.grab(props, emitTo);
	}
}
