let	debug = console.log;

export default function( methods, sendMessage ) {
	
	let send = {
		getRecordings() {
			debug('### getRecordings ###');
			methods.getRecordings()
			.then(data => {
				sendMessage.postMessage({
					action: 'recordings',
					data
				});
			})
			.catch(error => {
				debug('ERROR from getRecordings', error);
				sendMessage.postMessage({
					action: 'recordings',
					data: []
				});
			});
		},
		
		getAllTimers ( ) {
			debug('### getAllTimers send ###');
			return methods.getTimers()
			.then( () => methods.getSeries() );
		},
		
		getTimers ( ) {
			debug('### getTimers send ###');
			methods.getTimers()
			.then(data => {
				sendMessage.postMessage({
					action: 'timers',
					data
				});
			})
			.catch(error => {
				debug('ERROR from getTimers', error);
				sendMessage.postMessage({
					action: 'timers',
					data: []
				});
			});
		},
		
		getChannelGroups() {
			debug('### getChannelGroups ###');
			methods.getChannelGroups()
			.then(data => {
				sendMessage.postMessage({
					action: 'groups',
					data
				});
			})
			.catch(error => {
				debug('ERROR from getChannelGroups', error);
				sendMessage.postMessage({
					action: 'groups',
					data: {}
				});
			});
		},
		
		getChannels() {
			debug('### getChannels send ###');
			methods.getChannels()
			.then(data => {
				sendMessage.postMessage({
					action: 'channels',
					data
				});
			})
			.catch(error => {
				debug('ERROR from getChannels', error);
				sendMessage.postMessage({
					action: 'channels',
					data: {}
				});
			});
		},
		
		getSeries ( ) {
			debug('### getSeries send ###');
			methods.getSeries()
			.then(data => {
				sendMessage.postMessage({
					action: 'series',
					data
				});
			})
			.catch(error => {
				debug('ERROR from getSeries', error);
				sendMessage.postMessage({
					action: 'series',
					data: []
				});
			});
		},
		
		getGuideData ( data ) {
			debug('### getGuideData send ###', data);
			
			// only send 5000 at a time to avoid memory issues
			let limit = 5000;
			let skip = 0;
			let _skip = 0;
			getData();
			function getData() {	
				debug('GetGUideData', 'skip:', skip, 'limit:', limit)
				return methods.getGuideData({
					action: 'getGuideData',
					...data,
					limit: limit,
					skip: skip
				})
				.then( sinal => {
					debug('### getGuideData send POST ###', sinal.total, sinal);
					skip = sinal.total + skip;
					sendMessage.postMessage({
						action: 'guide',
						data: sinal.groups || {},
						update: data.update
					});
					if ( skip > _skip && sinal.total === limit ) {
						_skip = skip;
						// run again
						return getData();
					}	
					return {}					
				})
				.catch(error => {
					debug('ERROR from getGuideData', error);
					sendMessage.postMessage({
						action: 'guide',
						data: {}
					});
					return;
				});
			}
		},
		
	}
	
	return send;
}
