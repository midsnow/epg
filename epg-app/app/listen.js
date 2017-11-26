import React from 'react';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import Debug from 'debug';
import Gab from './common/gab';
import { Request } from './common/utils';
import Socket from './lib/sockets';
import listenTo from './listenTo';
import Path from 'path';
import { withRouter } from 'react-router';

let debug = Debug('epg:app:listen');
let Sockets;  
export default (Component, snowUI) => { 
	snowUI = { ...snowUI,
		breaks: {
			xs: {
				width: 575
			},
			sm: {
				width: 768
			},
			md: {
				width: 992
			},
			lg: {
				width: 1200
			}
		}
	}
	@withRouter
	class Listeners extends React.Component {
		constructor(props){
			super(props);
			this.displayName = 'Listeners';
			
			if ( props.snowUI ) {
				snowUI = { ...snowUI, ...props.snowUI };
			} 
			
			let loc = props.location;
			let pastState = loc.state || {};
			let page = pastState.page || loc.pathname;
			
			if(page.charAt(0) == '/') {
				page = page.substring(1);
			}
			
			// if(!page || page =='/') page = snowUI.name;
			
			if(!loc.state) {
				debug('#### Is this bad???..  we are pushing the last known history into the stack on first load ####');
				props.router.push({
					pathname: loc.pathname,
					query: loc.query,
					state: {
						page: loc.pathname,
						query: loc.query
					}
				});
			}
			
			debug('LOADING Listeners', snowUI.serverRendered, props.noscript);
			
			var w=window || {};
			var d=document;
			var e=d.documentElement;
			var g=d.getElementsByTagName('body')[0];
			var x=w.innerWidth || e.clientWidth || g.clientWidth;
			var y=w.innerHeight || e.clientHeight || g.clientHeight;
			var desktop = x <= snowUI.breaks.xs.width ? 'xs' : x < snowUI.breaks.sm.width ? 'sm' : 'md';
			var idesktop = x <= snowUI.breaks.xs.width ? 0 : x < snowUI.breaks.sm.width ? 1 : 2; 
			
			Sockets = Socket( this );
			 
			this.state = Object.assign({ 
				desktop,
				guideRefresh: {
					download: false,
					who: []
				},
				idesktop,
				movieImages: false,
				moviePosters: true,
				mounted: false,
				page,
				path: pastState.path || loc.pathname,
				params: {},
				Request: Request.bind(this),
				sockets: Sockets,
				Sockets,
				status: {
					_agent: false,
					_db: false,
					account: { 
						messages: [], 
						maxLineups: 4 
					},
					lineups: [],
					notifications: [],
					systemStatus: [],
				},
				tvImages: true,
				tvBanners: true,
				tvPosters: false, 
				query: {},
				window: { width: x, height: y }				
			}, props);
			
			debug('new state:', this.state);
			
			this._update = false;
			this._limiters = {};
			Gab.guideUpdates = [];
			
			// start sockets
			debug('START SOCKETS');
			this.initiate();
			
			snowUI.page = this.state.page;
			snowUI.path = this.state.path;
			
			this.newState = this.newState.bind(this);
			this.getLineups = this.getLineups.bind(this);
			this.lineupListener = this.lineupListener.bind(this);
			
		}
		
		render() {
			debug('render listeners state', this.state);
			return  <Component { ...this.props } { ...this.state } appState={this.newState} />;
		}
		
		componentWillReceiveProps(props) {
			const State = { ...props.location.state } || {};
			delete State.theme;
			debug('Listener update proposed changes:', State);
			this.newState(Object.assign({ ...State }, props));
			this._update = true;
		}
		
		componentDidUpdate() {
			this.onUpdate();
		}
		
		componentWillMount() {
			
		}
		
		componentWillUnmount() {
			if(Sockets.connected.io) {
				Sockets.io.removeAllListeners();
			}
			Gab.removeAllListeners();
		}
		
		componentDidMount() {
			if(!snowUI.serverRendered) {
				this.newState({ mounted: true, initialData: false });
			}
			debug('LOADED Listeners');
			snowUI.loaded = true;
		}
		
		mousemove(e) {
			Gab.emit('mousemove', e);
		}

		initiate() {
			debug('INITIATE SOCKET LISTENERS')
			let thisComponent = this;
			
			// listen for error
			Gab.on('error', (data) => {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error,
						show: true
					}
				});
			});
			
			// reload the page
			Gab.on('__reload', () => {
				debug('gab got __reload request ');
				thisComponent.forceUpdate();
			});
			
			// getLineups
			Gab.on('getLineups', () => {
				debug('gab getLineups request ');
				this.getLineups.call( thisComponent )
			});
			
			// socktes conected
			Gab.on('__socket-connect', () => {
				debug('gab got __socket-connect request ');
				listenTo.call( thisComponent )
			});
			
			// receive page from request
			Gab.on('request', (data) => {
				debug('gab got page request data', data);
				thisComponent.pageResults(data);
			});
			
			// update desktop
			Gab.on('resize', (e) => { 
				const desktop = e.width <= snowUI.breaks.xs.width ? 'xs' : e.width < snowUI.breaks.sm.width ? 'sm' : 'md';
				const idesktop = e.width <= snowUI.breaks.xs.width ? 0 : e.width < snowUI.breaks.sm.width ? 1 : 2;
				const contentWidth =  e.width * (!desktop ? 1 : desktop == 'md' ? 0.83 : 0.74);
				debug('RESIZE #####', e, desktop, idesktop);
				this.setState({ idesktop, desktop, contentWidth, window: e });
			});
			
			// start socket client and add listeners and talkers
			Sockets.init(  );
			
			// window resize emitter
			let _resizing = (force = false) => {
				var w=window;
				var d=document;
				var e=d.documentElement;
				var g=d.getElementsByTagName('body')[0];
				var x=w.innerWidth || e.clientWidth || g.clientWidth;
				var y=w.innerHeight || e.clientHeight || g.clientHeight;
				// only update once done moving
				let muchX = x < this.state.window.width ? (x + 100 < this.state.window.width) : (x - 100 > this.state.window.width);
				let muchY = y < this.state.window.height ? (y + 100 < this.state.window.height) : (y - 100 > this.state.window.height);
				//debug((muchX || muchY) || force === true);
				if((muchX || muchY) || force === true) {
					if(snowUI.__resizing) {
						clearTimeout(snowUI.__resizing);
					}
					snowUI.__resizing = setTimeout( ( resize ) => { 
						debug('## SEND RESIZE EVENT ##', force);
						Gab.emit('resize', resize);
						snowUI.__resizing = false
					}, 500, { width: x, height: y });
				}
			}
			window.removeEventListener('resize', _resizing);
			window.addEventListener('resize', _resizing);
			
			_resizing(true);
			
			
		} // end initiate
		
		newState(state, cb) {
			this.setState(state, () => {
				if(cb) cb();
			});		
		}
		
		onUpdate() {
			this._update = false;
		} 
		
		pageResults(data) {
			snowUI.watingForPage = false;
			if(!data.success) {
				this.setState({
					//page: '404',
					//contents: {
					//	title: 'Page not found',
					//	slug: '404'
					//},
					data,
					newalert: {
						style: 'danger',
						html: data.message,
						show: true,
						duration: 5000
					},
				});
			} else {
				this.setState({ 
					slug: data.slug,
					contents: data.results,
					data
				}, () => {
					/* run page js for new content */
					debug('##  RUN __mountedPage() js  ############');
					snowUI.code.__mountedPage();				
				});
			}
		}
		
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
			debug('got lineups data', data);
			let headends = {};
			if( !data.lineups || data.error ) {
				this.setState({
					newalert: {
						style: 'caution', 
						html: data ? data.error.message : 'Unknown Error with socket',
						show: true,
						duration: 500
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
							style: 'info',
							component: <div>You do not have any lineups... <a href="#" onClick={(e)=>{e.preventDefault();this.goTo('add')}}> Add One</a></div>,
							show: true,
							duration: 10000
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
							style: 'warning',
							component: <div>Failed to get lineups... <a href="#" onClick={this.getLineups}> Retry</a></div>,
							show: true,
							duration: 500
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

	return Listeners;
}
