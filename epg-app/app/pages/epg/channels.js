import React from 'react';
import moment from 'moment';
import { sortBy, find as Find, isObject, filter as Filter, debounce } from 'lodash';
import Debug from 'debug';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Avatar, Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles, ColorMe } from '../../common/styles';

let debug = Debug('epg:app:pages:epg:channels');

export default class Channels extends React.Component {
	constructor(props) {
		super(props)
		
		this.displayName = 'Channels';
		this.state = {
			guide: [],
			expanded: false,
		};
		
		this.getGuideData = this.getGuideData.bind(this)
		this.renderSchedule = this.renderSchedule.bind(this);
		this.onExpandChange = this.onExpandChange.bind(this)
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Channels',  this.props);
		
	}
	
	componentWillUnmount ( ) {
		delete this.state;
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Channels got props', props);
		this._update = true;
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
	
	onExpandChange( ex, id ) {
		debug('expand', ex, id);
		this._update = true;
		if ( ex ) {
			this.setState({ guide: [], expanded: id }, () => {
				this.getGuideData( id );
			});
		} else {
			this.setState({ guide: [], expanded: false });
		}
	}
	
	render ( ) { 
		debug('## render  ##  Channels  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Channel List" /><br /><LinearProgress mode="indeterminate" /></div>;
		let group = this.props.params.group || 'All Channels';
		let sort = this.props.location.query.sortChannelsBy || 'channel';
		if ( Object.keys(this.props.groups).length > 0 ) {
 			// ret =  Object.keys(this.props.channels).map((keyName, i) => {
			ret =  sortBy( this.props.groups[group], [ sort ] ).map( ( c, i ) => {
				return (<div className="col-sm-12 col-md-6" style={{ marginBottom: 5 }}  key={c.channel}>
					<Card  
						onExpandChange={debounce((e)=> this.onExpandChange(e, c.stationID), 150)}
						expanded={ this.state.expanded === c.stationID }
					>
						<CardHeader
							subtitle={c.channel}
							title={c.name}
							avatar={<Avatar size="50" backgroundColor='none'  children={<img src={c.iconPath} style={{maxWidth: 75 }}  />} style={{ background: 'none', borderRadius: 'none', width: 75, height: 50, marginRight: 16 }} />}
							actAsExpander={true}
							showExpandableButton={true}
							
						/>						
						<CardText 
							expandable={true}
							
						>
							<div style={{ height: 400 }} > {this.renderSchedule( )} </div>
						</CardText>
					</Card>
				</div>);
			});
			
		}
		//return <div>{ret}</div>;
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
	
	getGuideData ( id ) {
		debug( 'getGuideData', id );
		
			this.props.Request({
				action: 'getGuideData',
				id
			})
			.then(data => {
				debug('### got getGuideData ###', data);
				this._update = true;
				this.setState({
					guide: Filter( data.entries.groups[id], v => ( Number(v.startTime) > moment().subtract(1, 'h').unix() ) ),
				});
			})
			.catch(error => {
				debug('ERROR from getGuideData', error)
			});
		
			
	}
	
	changeProgram ( station ) {
		let p = this.props.entries[station];
		let q = ( Array.isArray(p) && typeof p[0] === 'object' ) ? p[0].channel : false;
		if ( q === false ) {
			debug(' no channel', p, q );
			return false;
		}
		this.props.goTo({ path: '/tv/channel/' + p.channel + '/' + station, page: 'Program Info' } );
		window.scrollTo(0, 0);
	}
	
	renderSchedule ( id ) {
		if ( this.state.guide.length === 0 ) {
			return (
				<div><br />
				<LinearProgress mode="indeterminate" />
				<span style={{ color: Styles.Colors.limeA400 }} children='Getting Programs'  /> 
				<br /></div>
			);
		}
		 
		let rows = [];
		let lastday = ''
		let g = this.state.guide;
		if ( !g ) {
			return <span />
		} else {
			g.forEach( ( s, k ) => {
				let day = moment.unix(s.startTime).format("dddd MMMM Do");
				if ( day != lastday ) {
					lastday = day;
					if ( rows.length === 0 ) {
						rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, height: 25, fontSize: 14, fontWeight: 700, margin: '0 0 10 0' }} >{lastday}</div>);
					} else {
						rows.push(<div style={{ zIndex: 1300, padding: 2, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, height: 25, fontSize: 14, fontWeight: 700, margin: '30 0 20 0' }} >{lastday}</div>);
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
							{ s.iconPath ? <img src={s.iconPath}  style={{ maxWidth: 48, float: 'left', margin: '0 5 0 0' }} /> : <span /> }
							{icons} 
							{s.plot}
						</div>
						<div className="clearfix" />
					</div> 
				);
				
				const tow = (<div 
						key={s.programID}
						onClick={( ) =>  {  
							this.changeProgram (k);
						}} 
						style={{ cursor: 'pointer', marginBottom: 5, padding: 5 }} 
					>
						{ row }
					</div>)
				
				rows.push(tow);
			});
			
			let style = { height: 400, overflow: 'auto' } ;
			
			return (<div style={style} >{rows}</div>);
		}
	}
	
	groups() {
		return (<DropDownMenu value={this.props.params.group || 'All Channels' } onChange={( event, index, value ) => { this.props.goTo({ path: '/tv/channels/'+value, page: value}); } }> 
			{
				Object.keys( this.props.groups ).map( ( keyName, i ) => {
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
