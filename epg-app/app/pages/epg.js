import React from 'react';
import { unmountComponentAtNode } from 'react-dom';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';
import moment from 'moment';
import LinearProgress from 'material-ui/LinearProgress';
import uniqWith from 'lodash/uniqWith';
import store from '../common/localstore';

snowUI.Worker = undefined;

let debug = Debug('epg:app:pages:epg');

let guide = new store({
	name: 'guide',
	store: 'guide'
});
let recordings = new store({
	name: 'recordings',
	store: 'recordings'
});
let channels = new store({
	name: 'channels',
	store: 'channels'
});
let groups = new store({
	name: 'groups',
	store: 'groups'
});
let timers = new store({
	name: 'timers',
	store: 'timers'
});
let series = new store({
	name: 'series',
	store: 'series'
});
	
export default class EPG extends React.Component {
	constructor(props) {
		super(props);
		
		let channels = [];
		let entries = {};
		let groups = {};
		
		this.displayName = 'EPG Component';

		this.state = {
			channels,
			groups,
			series: [], 
			timers: [],
			recordings: [],
			numberOfGuideDays: 1,
			guidePreHours: 6,
			route: props.routes[2].path,
			channelsLoaded: false,
			groupsLoaded: false,
			timersLoaded: false,
			seriesLoaded: false,
			recordingsLoaded: false
		};
		
		debug('EPG start props', props);
		
		this._update = true;
		this._mounted = [];
		
		this._channels = this._channels.bind(this);
		this._groups = this._groups.bind(this);
		this._recordings = this._recordings.bind(this);
		this._series = this._series.bind(this);
		this._timers = this._timers.bind(this);
		this.reload = this.reload.bind(this);
		this.notify = this.notify.bind(this);
		this.onMessage = this.onMessage.bind(this);
		
		return this;
	} 
	
	notify ( data ) {
		debug('Got Notification', data.update, typeof this[data.update] );
		if ( data.update && typeof this[data.update] == 'function' ) {
			debug( 'Run', data.update);
			this[data.update]();
		}
	}
	
	componentDidUpdate() {
		//snowUI.fadeIn();
		debug('EPG didUpdate');
	}
	
	componentDidMount( ) {
		debug('EPG will mount');
		if(!this._skipMount) {
			//this._load();			
		}
		this.props.Sockets.io.on( 'notify epg', this.notify);
		//snowUI.fadeIn();
	}
	 
	componentWillMount() {
		debug('will mount');
		snowUI.Worker = undefined;
		snowUI.Worker = new SharedWorker('/epg-app/bundles/worker.js');
		snowUI.Worker.port.onmessage = this.onMessage;
		const s = moment().startOf('hour').subtract(this.state.guidePreHours, 'h').unix();
		const f = moment().add(this.state.numberOfGuideDays, 'days').unix();
		snowUI.Worker.port.postMessage({
			action: 'getGuideData',
			data: {
				start: s,
				end: f,
				skipMetadata: true 
			}
		});
	}  
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener( 'notify epg', this.notify);
		debug(snowUI.Worker, snowUI.Worker.terminate);
		if ( snowUI.Worker.terminate) snowUI.Worker.terminate();
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## EPG ##',  props, this.state);
		this._update = true;
		const run = () => {
			this.setState( { route: props.routes[2].path } );
		}
		run();
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ## EPG ', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	onMessage (event) {
		
		let payload = event.data;
		debug('onMessage', payload);
		// the data.action contains our message key value
		let who = '_' + payload.action
		if ( typeof this[who] === 'function' ) {
			this[who]( payload );
		} else {
			this.props.appState({
				newalert: {
					show: true,
					html: 'Action requested an unknown function',
					style: 'warning',
					error: payload
				}
			});
		}
	}
	
	reload ( who ) {
		debug( '############ RELOAD DATA ###################' );
		let reload = !Array.isArray(who) ? [who] : who;
		reload.forEach( v => {
			debug( 'reload', v, typeof this[v] === 'function');
			if ( typeof this[v] === 'function' ) {
				this[v]();
			}
		});
	}
	
	_guide( payload ) {
		debug('### getGuideData ###');
		if ( payload.data ) {
			Object.keys(payload.data).forEach( ( c, k ) => {
				//debug(data[c])
				guide.getItem( c )
				.then( item => {
					//debug(item, data[c]);
					if ( !item ) item = [];
					let add = [ ...item, ...payload.data[c] ];
					add = uniqWith(add, ( a, b ) => {
						return a.startTime === b.startTime;
					});
					guide.setItem( c, add );
				});
			});
			if ( payload.update ) {
				debug( 'force update');
				this.forceUpdate();
			}
		}
	}
	
	_recordings( payload ) {
		debug('### getRecordings ###');
		if ( payload.data ) {
			payload.data.forEach( ( c, k ) => {
				recordings.setItem( c.recordingId, c );
			});
			this._update = true;
			this.setState({
				recordingsLoaded: true,
			});
		}
	}
	
	_timers ( payload ) {
		debug('### getTimers data ###');
		if ( payload.data ) {
			payload.data.forEach( ( c, k ) => {
				timers.setItem( c.timerId, c );
			});
			this._update = true;
			this.setState({
				timersLoaded: true,
			});
		}
		
	}
	
	_groups( payload ) {
		debug('### getChannelGroups ###');
		if ( payload.data ) {
			Object.keys(payload.data).forEach( ( c, k ) => {
				//debug(data[c])
				if ( c ) groups.setItem( c, payload.data[c] );
			});
			this._update = true;
			this.setState({
				groupsLoaded: true,
			});
		}
	}
	
	_channels( payload ) {	
		debug('### getTVChannels ###');
		if ( payload.data ) {
			Object.keys(payload.data).forEach( ( c, k ) => {
				channels.setItem( c, payload.data[c] );
			});
			this._update = true;
			this.setState({
				channelsLoaded: true,
			});
		}
	}
	
	_series ( payload ) {
		debug('### getSeries data ###');
		if ( payload.data ) {
			payload.data.forEach( ( c, k ) => {
				series.setItem( c.seriesId, c );
			});
			this._update = true;
			this.setState({
				seriesLoaded: true,
			});
		}		
	}
	
	render() {
		
		let state = this.state
		
		debug('## render  ##  EPG ', state, this.state);
		
		//if ( !state.seriesLoaded || !state.recordingsLoaded || !state.timersLoaded || !state.channelsLoaded ||  !state.groupsLoaded  ) {
		if( this.state.THISDOESNOTEXist ) {
			debug('## render  ##  EPG Loading', this.props, this.state);
			return (
				<div style={{ padding: 50, color: this.props.theme.baseTheme.palette.accent1Color }}>
					
					<br />
					<LinearProgress mode="indeterminate" />
					{ !state.channelsLoaded ? 'Waiting for Channels' : <span style={{ color: Styles.Colors.limeA400 }} children='Channels Ready' /> }
					<br />
					{ !state.groupsLoaded ? 'Waiting for Channel Groups' : <span style={{ color: Styles.Colors.limeA400 }} children='Channel Groups Ready' /> }
					<br />
					{ !state.seriesLoaded ? 'Waiting for Season Passes' : <span style={{ color: Styles.Colors.limeA400 }} children='Season Passes Ready' /> }
					<br />
					{ !state.timersLoaded ? 'Waiting for Timers' : <span style={{ color: Styles.Colors.limeA400 }} children='Timers Ready' /> }
					<br />
					{ !state.recordingsLoaded ? 'Waiting for Recodings' : <span style={{ color: Styles.Colors.limeA400 }} children='Recordings Ready' /> }
				</div>
			);
		
		} 
		
		let children = <span />;
		
		children = (this.props.children && React.cloneElement(this.props.children, Object.assign({
			...this.props, 
			...this.state,
			reload: this.reload
		})));
		return (<div ref={ ref => this._mounted.push(ref) } >
			{children}
		</div>);
	}
	
	
	_load( props ) {
		this.getChannelGroups();
		this.getChannels();
		this.getRecordings();
		this.getSeries();
		this.getTimers();
	}
	
	_loadCheck( ) {	
		debug('_loadCheck', this.state);
		return Promise.resolve();
		
		
		let check = { ...state };
		this.setState({
			channelsLoaded: this.state.recordings.length < 1,
			groupsLoaded: Object.keys(props.groups).length < 1,
			timersLoading: this.state.timers.length < 1 ,
			seriesLoading: this.state.series.length < 1,
			recordingsLoading: this.state.recordings.length < 1,
		}, () => {
			if ( !this.state.recordingsLoaded && !this.state.recordingsLoading ) this.getRecordings();
			if ( !this.state.groupsLoaded && !this.state.groupsLoading ) this.getChannelGroups();
			if ( !this.state.channelsLoaded && !this.state.channelsLoading ) this.getChannels();
			if ( !this.state.timersLoaded && !this.state.timersLoading ) this.getTimers();
			if ( !this.state.seriesLoaded && !this.state.seriesLoading ) this.getSeries();
			//delete check;
		});
		
		return Promise.resolve();
	}
	
}


EPG.getInitialData = function(params, location) {
	let ret = {
		channels: {
			action: 'getTVChannels',
		},
		entries: {
			action: 'getGuideData',
		},
		groups: {
			action: 'getChannelGroups',
		}
	}
	return {}
}
