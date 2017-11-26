import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import moment from 'moment';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import debounce from 'lodash/debounce';
import Find from 'lodash/find';
import Filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import Debug from 'debug';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import Avatar from 'material-ui/Avatar';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import CardActions from 'material-ui/Card/CardActions';
import CardHeader from 'material-ui/Card/CardHeader';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import FontIcon from 'material-ui/FontIcon';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import LinearProgress from 'material-ui/LinearProgress';
import FlatButton from 'material-ui/FlatButton';
import Toggle from 'material-ui/Toggle';
import Toolbar from 'material-ui/Toolbar/Toolbar';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import ToolbarSeparator from 'material-ui/Toolbar/ToolbarSeparator';
import ToolbarTitle from 'material-ui/Toolbar/ToolbarTitle';
import { Styles, ColorMe } from '../../common/styles';
import hat from 'hat';
import PropTypes from 'prop-types'; // ES6
import store from '../../common/localstore';

let channels = new store({
	name: 'channels',
	store: 'channels'
});

let groups = new store({
	name: 'groups',
	store: 'groups'
});

let guide = new store({
	name: 'guide',
	store: 'guide'
});

let debug = Debug('epg:app:pages:epg:channels');

export default class Channels extends React.Component {
	constructor(props) {
		super(props)
		
		this.displayName = 'Channels';
		this.state = {
			guide: [],
			groups: {},
			expanded: false,
		};
		
		this._update = false;
		
		this.getGuideData = this.getGuideData.bind(this)
		this.onExpandChange = this.onExpandChange.bind(this);
		this._mountedSched = false;
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Channels',  this.props);
		groups.all()
		.then( chans => {
			this._update = true;
			this.setState({
				groups: chans
			});
		}).catch(debug);
	}
	
	componentWillUnmount ( ) {
		let div = document.getElementById('deleteSched');
		if ( div ) {
			debug('unmount')
			unmountComponentAtNode( div );
		}
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Channels got props', props);
		groups.all()
		.then( chans => {
			this._update = true;
			this.setState({
				groups: chans
			});
			if ( this.state.expanded ) {
				this.getGuideData( { stationID: this.state.expanded } );
			}
		}).catch(debug);
	}	
	
	shouldComponentUpdate ( ) {
		debug('should channels update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	handleExpandChange = ( expanded ) => { 
		this.setState({expanded: expanded});
	};
	
	onExpandChange( ex, obj ) {
		debug('expand', ex, obj);
		this._update = true;
		let div = document.getElementById('deleteSched');
		if ( div ) {
			debug('unmount')
			unmountComponentAtNode( div );
		}
		if ( ex ) {			
			this.setState({ guide: [], expanded: obj.stationID }, () => {
				setTimeout(() => { 
					render(<Sched { ...this.props } entry={ obj } guide={ [] } />, document.getElementById('deleteSched'))
					this.getGuideData( obj, true );
				}, 50);
			});
		} else {
			this.setState({ guide: [], expanded: false });
		}
	}
	
	render ( ) { 
		debug('## render  ##  Channels  render', this.props, this.state);
		
		// placeholder
		let ret = ( <div style={{ padding: 50 }}>
			<span 
				style={{ color: Styles.Colors.limeA400 }} 
				children="Preparing Channel List" 
			/>
			<br />
			<LinearProgress mode="indeterminate" />
		</div>);
		
		let group = this.props.params.group || 'All Channels';
		
		let sort = this.props.location.query.sortChannelsBy || 'channel';
		debug('try keys');
		if ( Object.keys(this.state.groups).length > 0 ) {
 			
			ret =  sortBy( this.state.groups[group], [ sort ] ).map( ( c, i ) => {
				return (<div className="col-sm-12 col-md-6" style={{ marginBottom: 5 }} key={i}>
					<Card  
						onExpandChange={debounce((e)=> this.onExpandChange(e, c), 150)}
						expanded={ this.state.expanded && this.state.expanded === c.stationID }
					>
						<CardHeader
							subtitle={c.channel}
							title={c.name}
							avatar={<Avatar size="50" backgroundColor='none'  children={<img src={c.iconPath} style={{maxWidth: 75 }}  />} style={{ background: 'none', borderRadius: 'none', width: 75, height: 50, marginRight: 16 }} />}
							actAsExpander={true}
							showExpandableButton={true}
							
						/>						
						<CardText expandable={true} >
							<div style={{ height: 350 }} id="deleteSched" >  </div>
						</CardText>
					</Card>
				</div>);
			});
			
		}
		return (<div style={{ padding: '0 0px' }}>
			<div style={{ padding: '10px 15px' }}>
				<Toolbar>
					<ToolbarGroup firstChild={true}>
						{ this.groups() }
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarSeparator />
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'channel' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/channels/'+group, query: {sortChannelsBy: 'channel'}, page: group + ' by channel'}); } }>format_list_numbered</FontIcon>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'name' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/channels/'+group, query: {sortChannelsBy: 'name'}, page: group + ' by name'}); } } >sort_by_alpha</FontIcon>
						<ToolbarSeparator />
         
					</ToolbarGroup>
				</Toolbar>
			</div>
			{ret}
		</div>);
	}
	
	getGuideData ( channel, refresh = false ) {
		debug( 'getGuideData', channel );
	
		// load the cache and if new information comes it it will be added.
		guide.getItem( channel.stationID )
		.then( data => {
			debug('### got getGuideData ###', data);
			render(<Sched 
				{ ...this.props } 
				entry={ channel } 
				changeProgram={ this.changeProgram.bind( this ) } 
				guide={ Filter( data, v => ( Number(v.startTime) > moment().subtract(4, 'h').unix() ) ) 
				
				}   />, document.getElementById('deleteSched'))
			if ( refresh ) {	
				// tell the worker to refresh the full information
				snowUI.Worker.port.postMessage({ 
					action: 'getGuideData',
					data: {
						id: channel.stationID,
						update: true
					}
					
				});
			}
		});
		return;
	}
	
	changeProgram ( channel, program ) {
		debug('ChangeProgram', channel, program);
		if ( !channel && !program ) {
			debug(' no channel', channel, program );
			return false;
		}
		this.props.goTo({ path: '/tv/channel/' + channel + '/' + program, page: 'Program Info' } );
		window.scrollTo(0, 0); 
	}
	
	groups() {
		return (<DropDownMenu value={this.props.params.group || 'All Channels' } onChange={( event, index, value ) => { this.props.goTo({ path: '/tv/channels/'+value, page: value}); } }> 
			{
				Object.keys( this.state.groups ).map( ( keyName, i ) => {
					return (<MenuItem key={keyName} value={keyName} primaryText={keyName}  />)
				})
			} 
		</DropDownMenu>)	
			
	}	
}

Channels.defaultProps = {
	groups: {
		'All channels': [],
		'Most viewed': []
	},	
}

Channels.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Channels ###',  params);
	return {}
}

class Sched extends React.Component {
	constructor(props) {
		super(props)
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme,
		};
	}
	
	render ( ) {
		debug('render schedule');
		if ( this.props.guide.length === 0 ) {
			return (
				<div><br />
				<span style={{ color: Styles.Colors.limeA400 }} children='Getting Programs'  /> 
				<br /></div>
			);
		}
		
		let rows = [];
		let lastday = ''
		let g = this.props.guide;
		if ( !g ) {
			return <span />
		} else {
			g.forEach( ( s, k ) => {
				let day = moment.unix(s.startTime).format("dddd MMMM Do");
				if ( day != lastday ) {
					lastday = day;
					if ( rows.length === 0 ) {
						rows.push(<div key={s.id+'er'} style={{ zIndex: 1300, padding: 5, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, height: 30, fontSize: 16, fontWeight: 400, margin: '0 0 10 0' }} >{lastday}</div>);
					} else {
						rows.push(<div key={s.id+'er'}  style={{ zIndex: 1300, padding: 5, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, height: 30, fontSize: 16, fontWeight: 400, margin: '30 0 20 0' }} >{lastday}</div>);
					}
				}
				
				let timer = <span />;
				let series = <span />;
				let recordings = <span />;
				const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programID == s.programID  ) ) );
				const isSeries = isObject( Find( this.props.series, ( v ) => ( v.show == s.title || v.programID == s.programID  ) ) );
				const isRecorded = isObject( Find( this.props.recordings, [ 'programID', s.programID]  ) );
				if ( isTimer ) {
					timer = (
						<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
							<FontIcon className="material-icons"  color={Styles.Colors.red800} style={{cursor:'pointer', fontSize: 12}}  title="This progrram will be recorded">radio_button_checked</FontIcon>
						</div>
					);
				}
				if ( isSeries ) {
					series = (
						<div style={{  marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
							<FontIcon className="material-icons"  color={Styles.Colors.blue500} style={{cursor:'pointer', fontSize: 12}}  title="You have a Series Pass enabled for this program">fiber_dvr</FontIcon>
						</div>
					);
				}
				if ( isRecorded ) { 
					recordings = (
						<div style={{ marginTop: 2, width: 12, height: 12, textAlign: 'left'}}>
							<FontIcon className="material-icons"  color={Styles.Colors.limeA400} style={{cursor:'pointer', fontSize: 12}}  title="This program is recorded">play_circle_filled</FontIcon>
						</div>
					);
				}
				let icons = <div style={{ float: 'left', width: 5, height: 50 }} />;
				if ( isRecorded || isSeries || isTimer ) {
					icons = (
						<div style={{ marginRight: 5,  float: 'right', width: 15, maxHeight: 50, textAlign: 'center'}}>
							{series} 
							{timer}
							{recordings}
						</div>
					);
				}
				const isNew = (s.repeat);
				let row = (
					<div style={{ position: 'relative', clear: 'both' }}>
						<span style={{ fontWeight: 700, fontSize: 14 }}>{moment.unix(s.startTime).format("LT")}</span> - <span style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</span> 
						<div style={{ marginTop: 5, clear: 'both' }} >
							{ s.iconPath ? <img src={s.iconPath.search('http') > -1 ? s.iconPath : 'https://json.schedulesdirect.org/20141201/image/' + s.iconPath}  style={{ maxWidth: 48, float: 'left', margin: '0 5 0 0' }} /> : <span /> }
							{icons} 
							{s.plotOutline}
						</div> 
						<div className="clearfix" />
					</div>
				);
				
				let now = moment().unix();
				let end = moment.unix(s.startTime).add(s.duration, 's').unix();
				let bg = ( now > s.startTime && now < end ) ? ColorMe(-15, this.props.theme.paper.backgroundColor).bgcolor : 'none';
				
				const tow = (<div 
						key={s.id+ 'qq'}
						onClick={( ) =>  {  
							this.props.changeProgram ( this.props.entry.channel, s.id );
						}} 
						style={{ cursor: 'pointer', marginBottom: 5, padding: 5, backgroundColor: bg }} 
					>
						{ row }
					</div>)
				
				rows.push(tow);
			});
			
			let style = { height: 350, overflow: 'auto' } ;
			
			return (<div ref={ ref => {this._mountedSched = ref} } style={style} >{rows}</div>);
		}
	}
}
Sched.childContextTypes = {
    muiTheme: PropTypes.object
};
