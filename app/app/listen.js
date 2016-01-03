import React from 'react';
import _ from 'lodash';
import Debug from 'debug';
import Gab from './common/gab';
import Sockets from './lib/sockets';
import { createHistory, useBasename  } from 'history';
import Path from 'path';

// add the context menu
// import './common/contextMenu';

let debug = Debug('epg:app:listen');

let history = useBasename(createHistory)({
	basename: '/epg'
});



export default (Component) => {
		
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
				history: history,
				page: paths[1] || 'home',
				child: paths[2] || '',
				lineup: paths[3] || '',
			}
			this._update = false;
			this._limiters = {};
			
			this.getLineups = this.getLineups.bind(this);
			this.lineupListener = this.lineupListener.bind(this);
			
			this.initiate();
		}
		
		// add static listeners here
		initiate() {
			let thisComponent = this;
			
			// Listen for changes to the current location. The 
			// listener is called once immediately. 
			function checkPath(a, b) {
				return Path.join(a.page,a.child,a.lineup) === Path.join(b.page,b.child,b.lineup);
			}
			let unlisten = history.listenBefore((newLocation) => {
				debug('locationBefore change listener  .. current, new, state ', location, newLocation, this.state)
				if(!checkPath(newLocation.state, this.state)) {
					// new path from a browser action
					debug('location changed... old then new', location, newLocation)
					this.setState(newLocation.state);
				}
			})
			
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
				
				//listen for new lineups
				Sockets.io.on('lineups', this.lineupListener);
				
				// updatre events
				Sockets.io.on('updateChannel', function(data) {
					debug('updateChannel on event', data);
					Gab.emit('updateChannel', data);
				});
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
		componentWillMount() {
			
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
							component: <div>You do not have any lineups... <a href="#" onClick={(e)=>{e.preventDefault();this.goTo('settings', 'add')}}> Add One</a></div>,
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



