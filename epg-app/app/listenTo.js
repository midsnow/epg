import Debug from 'debug';
let debug = Debug('epg:app:listenTo');

export default function () {
	debug('set heartbeat');
	let Sockets = this.state.Sockets;
	// setup a 15 sec heartbeat for socket connection loss
	clearInterval(window.heartbeat2);
	window.heartbeat2 = setInterval(() => {
		//debug('heartbeat', Sockets.io.connected);
		if(!Sockets.connected.io && this.state.connected) {
			debug('io connect-error');
			this.setState({
				connected: false,
				newalert: {},
			});
		}
		if(Sockets.connected.io && !this.state.connected) {
			debug('io connect', this.state);
			this.setState({
				connected: true,
				newalert: {},
			});
		}
	},5000);
	
	// receive page from server
	Sockets.io.on('json', (data) => {
		debug('got page socket data', data);
		thisComponent.pageResults(data);
	});
	
	// listen for a server error event
	Sockets.io.on('error', (data) => {
		debug('received socket error event', data);
		this.setState({
			newalert: {
				show: true,
				style: 'danger',
				html: data.error
			}
		});
	});
	
	// status report
	debug('get status');
	Sockets.status();
	Sockets.io.on('status', (data) => {
		debug('got status data', data);
		if(data.err) {
			this.setState({
				newalert: {
					style: 'danger',
					html: data.err.message,
					show: true,
					duration: 1500
				}
			});
		} else {
			this.setState({ status: data });
		}
		
	});
	
	// grab current lineups
	this.getLineups();
	
	// listen for a server error event
	Sockets.io.on('error', (data) => {
		debug('received socket error event', data);
		this.setState({
			newalert: {
				show: true,
				style: 'danger',
				html: data.error.message
			}
		});
	});	
	// listen for a server error event
	Sockets.io.on('globalUpdate', (data) => {
		debug('received socket global update event', data);
		if(data.stderr) data.message = data.stderr;
		this.setState({
			newalert: {
				show: true,
				style: data.style,
				html: data.message,
				duration: 0
			}
		});
	});	
	
	//guide refresh updata data
	Sockets.io.on('guideRefreshDownload', (data) => {
		debug('received guide download state event', data);
		let guideRefresh = this.state.guideRefresh;
		if(data.lineup) {
			if(!data.downloading) {
				_.pull(guideRefresh.who, data.lineup);
			} else {
				guideRefresh.who.push(data.lineup);
			}
		}
		guideRefresh.download = guideRefresh.who.length === 0 && !data.downloading ? false : true;
		this.setState({guideRefresh});
	});	
	Sockets.io.on('guideRefreshUpdate', (data) => {
		//debug('received guide refresh update event', data);
		Gab.guideUpdates.push(data.message);
	});	
	
	//listen for new lineups
	Sockets.io.on('lineups', this.lineupListener);
	
	// updatre events
	Sockets.io.on('updateChannel', function(data) {
		debug('updateChannel on event', data);
		Gab.emit('updateChannel', data);
	});
	
	//listen for schedule updates
	Sockets.io.on('schedules', this.scheduleListener);
	
}
