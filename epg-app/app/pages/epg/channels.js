import React from 'react';
import moment from 'moment';
import { sortBy, find as Find } from 'lodash';
import Debug from 'debug';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Avatar, Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('epg:app:pages:epg:channels');

export default class Channels extends React.Component {
	constructor(props) {
		super(props)
		
		this.displayName = 'Channels';
		this.state = {};
		
		this.getEntries = this.getEntries.bind(this);
		
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Channels',  this.props);
		
		//this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount ( ) {
		//this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Channels got props', props);
		/*if (props.channels.length !== this.state.channels.length) {
			this.setState({
				channels: props.channels
			});
		}*/
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
	
	getEntries ( id, start, end ) {
		this.props.Request({
			action: 'guideData',
			id,
			start,
			end
		})
		.then(data => {
			debug('### guide data ###', data);
			this._update = true;
			this.setState({
				entries: Object.assign(this.state.entries, data.entries)
			});
		})
		.catch(error => {
			debug('ERROR from Channels', error)
		});
	}
	
	handleExpandChange = ( expanded ) => {
		this.setState({expanded: expanded});
	};
	
	renderSchedule ( id ) {
		let e = this.props.entries;
		if ( !e[id] ) {
			return <span />
		} else {
			return  (
				<Table day={moment().format('D')} list={ e[id] } />
			)
		}
	}
	
	groups() {
		return (<DropDownMenu value={this.props.params.group || 'All channels' } onChange={( event, index, value ) => { this.props.goTo({ path: '/tv/channels/'+value, page: value}); } }> 
			{
				Object.keys( this.props.groups ).map( ( keyName, i ) => {
					return (<MenuItem key={keyName} value={keyName} primaryText={keyName}  />)
				})
			} 
		</DropDownMenu>)	
			
	}
	
	render ( ) { 
		debug('## render  ##  Channels  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Channel List" /><br /><LinearProgress mode="indeterminate" /></div>;
		let group = this.props.params.group || 'All channels';
		let sort = this.props.location.query.sortChannelsBy || 'channel';
		if ( Object.keys(this.props.groups).length > 0 ) {
 			// ret =  Object.keys(this.props.channels).map((keyName, i) => {
			ret =  sortBy( this.props.groups[group], [ sort ] ).map( ( c, i ) => {
				return (<div className="col-sm-12 col-md-6" style={{ marginBottom: 5 }}  key={c.channel}>
					<Card  >
						<CardHeader
							subtitle={c.channel}
							title={c.name}
							avatar={<Avatar size="50" backgroundColor='none'  children={<img src={c.iconPath} style={{maxWidth: 75 }}  />} style={{ background: 'none', borderRadius: 'none', width: 75, height: 50, marginRight: 16 }} />}
							actAsExpander={true}
							showExpandableButton={true}
						/>						
						<CardText expandable={true}>
							{this.renderSchedule( c.channelName )}
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
	
}

Channels.defaultProps = {
	groups: {
		'All channels': [],
		'Most viewed': []
	}	
}

Channels.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Channels ###',  params);
	return {}
}
