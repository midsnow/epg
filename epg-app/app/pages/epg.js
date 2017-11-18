import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';
import moment from 'moment';
import { LinearProgress } from 'material-ui';
import { differenceWith } from 'lodash';

let debug = Debug('epg:app:pages:epg');
		
export default class EPG extends React.Component {
	constructor(props) {
		super(props);
		
		let channels = [];
		let entries = {};
		let groups = {};
		
		this.displayName = 'EPG Component';

		this.state = {
			channels,	
			entries, 
			groups,
			series: [], 
			timers: [],
			recordings: [],
			numberOfGuideDays: 1,
			guidePreHours: 24,
		};
		
		debug('EPG start props', props);
		
		this._update = true;
		
		this.getChannels = this.getChannels.bind(this);
		this.getGuideData = this.getGuideData.bind(this);
		this.getChannelGroups = this.getChannelGroups.bind(this);
		this.getSeries = this.getSeries.bind(this);
		this.getTimers = this.getTimers.bind(this);
		this.reload = this.reload.bind(this);
		this.notify = this.notify.bind(this);
		this.getRecordings = this.getRecordings.bind(this);
		
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
	
	componentDidMount() {
		debug('EPG will mount');
		if(!this._skipMount) {
			this.getChannelGroups();
			this.getChannels();
			this.getRecordings();
			this.getSeries();
			this.getTimers();
			const s = moment().startOf('hour').subtract(this.state.guidePreHours, 'h').unix();
			const f = moment().add(this.state.numberOfGuideDays, 'days').unix();
			this.getGuideData( false, s, f);
			
		}
		this.props.Sockets.io.on( 'notify epg', this.notify);
		//snowUI.fadeIn();
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener( 'notify epg', this.notify);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## EPG ##',  props, this.state);
		this._update = true;
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ## EPG ', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
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
	
	getRecordings() {
		debug('### getRecordings ###');
		this.props.Request({
			action: 'getRecordings'
		})
		.then(data => {
			debug('### getRecordings ###', data);
			this._update = true;
			this.setState({
				recordings: data.recordings,
				recordingsLoaded: true,
			});
		})
		.catch(error => {
			debug('ERROR from getRecordings', error)
		});
	}
	
	getAllTimers ( ) {
		this.getTimers();
		this.getSeries();
	}
	
	getTimers ( ) {
		this.props.Request({
			action: 'getTimers'
		})
		.then(data => {
			debug('### getTimers data ###', data);
			this._update = true;
			if ( this.state.timers.length > 0 ) {
				let added = differenceWith( data.timers, this.state.timers,  ( a, b ) => {
					return a.timerId == b.timerId
				});
				added.forEach( v => {
					Gab.emit('snackbar', {
						style: 'success',
						html: "Added Timer for " + v.name + ' on ' +  moment.unix(v.startTime).format("l [at] LT"),
						open: true,
						onRequestClose: () => {},
						autoHideDuration: 2000
					});
				});
				let removed = differenceWith( this.state.timers, data.timers,  ( a, b ) => {
					return a.timerId == b.timerId
				});
				removed.forEach( v => {
					Gab.emit('snackbar', {
						style: 'warning',
						html: "Removed Timer for " + v.name + ' on ' + moment.unix(v.startTime).format("l [at] LT"),
						open: true,
						onRequestClose: () => {},
						autoHideDuration: 2000
					});
				});
			}
			this.setState({
				timers: data.timers,
				timersLoaded: true,
			});
		})
		.catch(error => {
			debug('ERROR from getTimers', error)
		});
	}
	
	getChannelGroups() {
		debug('### getChannelGroups ###');
		this.props.Request({
			action: 'getChannelGroups'
		})
		.then(data => {
			debug('### getChannelGroups ###', data);
			this._update = true;
			this.setState({
				groups: data.groups,
				groupsLoaded: true
			});
		})
		.catch(error => {
			debug('ERROR from getChannelGroups', error)
		});
	}
	
	getGuideData ( id, start, end ) {
		this.props.Request({
			action: 'getGuideData',
			id,
			start,
			end
		})
		.then(data => {
			debug('### getGuideData ###', data);
			this._update = true;
			this.setState({
				entries: data.entries.groups,
				guideLoaded: true,
			});
		})
		.catch(error => {
			debug('ERROR from getGuideData', error)
		});
	}
	
	getChannels() {
		this.props.Request({
			action: 'getTVChannels'
		})
		.then(data => {
			debug('### getTVChannels ###', data);
			this._update = true;
			this.setState({
				channels: data.channels,
				channelsLoaded: true,
			});
		})
		.catch(error => {
			debug('ERROR from getTVChannels', error)
		});
	}
	
	getSeries ( ) {
		this.props.Request({
			action: 'getSeriesTimers'
		})
		.then(data => {
			debug('### getSeries data ###', data);
			this._update = true;
			this.setState({
				series: data.series,
				seriesLoaded: true,
			});
		})
		.catch(error => {
			debug('ERROR from getSeries', error)
		});
	}
	
	render() {
		
		let state = this.state
		
		debug('## render  ##  EPG ', state, this.state);
		
		if ( !state.recordingsLoaded || !state.guideLoaded || !state.channelsLoaded ||  !state.groupsLoaded  ) {
			debug('## render  ##  EPG Loading', this.props, this.state);
			return (
				<div style={{ padding: 50, color: this.props.theme.baseTheme.palette.accent1Color }}>
					
					<br />
					<LinearProgress mode="indeterminate" />
					{ !state.guideLoaded ? 'Waiting for Guide Data' : <span style={{ color: Styles.Colors.limeA400 }} children='Guide Ready'  /> }
					<br />
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
			reload: this.reload, 
		})));
		return (<div  >
			{children}
		</div>);
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
