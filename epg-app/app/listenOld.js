import React from 'react';
import _ from 'lodash';
import Debug from 'debug';
import Gab from './common/gab';
import Sockets from './lib/sockets';
import Path from 'path';
import { withRouter } from 'react-router';

// add the context menu
// import './common/contextMenu';

let debug = Debug('epg:app:listen');

export default (Component) => {
	@withRouter
	class Listeners extends React.Component {
		constructor(props){
			super(props);
			this.displayName = 'Listeners';
			
			debug('listener',props);
			
			const clean = location.pathname;
			
			let paths = location.pathname.split( '/' ).filter(v => v !== '');
			
			this.state = { 
				route: clean,
				prev: clean,
				paths,
				sockets: Sockets,
				history,
				location,
				page: paths[1] || 'home',
				child: paths[1] === 'lineup' ? '' : paths[2] || '',
				lineup: paths[1] === 'lineup' ? paths[2] || '' : '',
				guideRefresh: {
					download: false,
					who: []
				}
			}
			this._update = false;
			this._limiters = {};
			Gab.guideUpdates = [];
			
			this.getLineups = this.getLineups.bind(this);
			this.lineupListener = this.lineupListener.bind(this);
			
			this.initiate();
		}
		
		// add static listeners here
		initiate() {
			debug('INITIATE SOCKERT LISTENERS')
			let thisComponent = this;
			
			// listen for error
			Gab.on('error',(data) => {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error,
						show: true
					}
				});
			});
			
			// sockets
			// initialize
			Sockets.init(() => {
				debug('set heartbeat');
				// setup a 15 sec heartbeat for socket connection loss
				this.heartbeat = setInterval(() => {
					//debug('heartbeat', this.io.connected);
					if(Sockets.io.connected === false) {
						debug('io connect-error');
						this.setState({
							faked: 'for a render',
							newalert: {},
						});
					}
				},15000);
				
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
				
			});
			
			
		} // end initiate	
		
		render() {
			// return React.cloneElement(Component, this.props)
			debug('render listeners state', this.state, this.props);
			return  <Component { ...this.props } { ...this.state } />;
		}
		componentWillReceiveProps(props) {
			const clean = props.path
			if(clean !== this.state.route) {
				this.setState({
					route: clean,
					prev: this.state.route
				});
				this._update = true;
			}
		}
		componentDidUpdate() {
			if(this._update) {
				this.onUpdate();
			}
		}
		componentWillUnmount() {
			debug('remove all socket listeners');
			Sockets.removeAllListeners();
		}
		componentDidMount() {
			//this.onMount();
			this.onUpdate();
		}
		// add dynamic listeners here
		onUpdate() {
			let thisComponent = this;
			this._update = false;
			debug('update listeners')
		
			 		
		} // end onUpdate
		
		schedulesListener(data) {
			debug('got lineups data', data.lineups);
			let headends = {};
			if(data.error) {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error.message,
						show: true
					}
				});
			} else {
				this.setState({
					newalert: {
						style: 'success',
						html: data,
						show: true
					}
				});
			}
		}
		lineupListener(data) {
			debug('got lineups data', data.lineups);
			let headends = {};
			if(data.error) {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error.message,
						show: true
					}
				});
			} else {
				if(Array.isArray(data.lineups) && data.lineups.length > 0) {
					data.lineups.forEach((head, k) => {
						headends[head.lineup] = Object.assign({ index: k }, head);
					});
					debug('save lineups data', headends, data);
					this.setState({ 
						headends,
						lineups: data
					});
				} else if(data.lineups.length === 0) {
					debug('no lineups data', data);
					this.setState({
						newalert: {
							style: 'danger',
							component: <div>You do not have any lineups... <a href="#" onClick={(e)=>{e.preventDefault();this.goTo('add')}}> Add One</a></div>,
							show: true
						},
						lineups: {
							lineups: []
						},
						headends: {}
					});
				} else {
					debug('failed lineups data', data);
					this.setState({
						newalert: {
							style: 'danger',
							component: <div>Failed to get lineups... <a href="#" onClick={this.getLineups}> Retry</a></div>,
							show: true
						}
					});
				}
			}
			
		}
		
		getLineups(e) {
			if(e && typeof e.preventDefault === 'function') {
				e.preventDefault();
			}
			Sockets.lineups(this.lineupListener)
		}	
	}

	Listeners.propTypes = {};

	return Listeners
}



