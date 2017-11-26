import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import Find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import Filter from 'lodash/filter';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
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
import RenderScheduled from './components/scheduled.js';

let debug = Debug('epg:app:pages:epg:series');

export default class Series extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Series';
		this.state = {};
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Series',  this.props);
	}
	
	componentWillUnmount ( ) {
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Series got props', props);
		this._update = true;
	}	
	
	shouldComponentUpdate ( ) {
		debug('should series update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	handleExpandChange = ( expanded ) => {
		this.setState({expanded: expanded});
	};
	
	renderSchedule ( obj ) {
		
		let fields = [
			{ 
				field: 'key',
				label: 'Key' , 
			},
			{ 
				field: 'value',
				label: 'Value' , 
			},
		];
		let component = (
			<Table 
				fields={fields} 
				list={ Object.keys( obj ).map( ( keyName, i ) => {
						return ({ key: keyName, value: obj[keyName] })
					}) 
				} 
				tableProps= {{
					fixedHeader: true,
					fixedFooter: false,
					selectable: false,
					multiSelectable: false,
					height: false,
				}}
			/>
		);
		Gab.emit('dialog open', {
			title:" Series Information",
			component,
			open: true,
			close: true			
		});	
	}
	
	render ( ) { 
		debug('## render  ##  Series  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Series Data" /><br /><LinearProgress mode="indeterminate" /></div>;
		let sort = this.props.location.query.sortSeriesBy || 'show';
		if ( sort === 'nextToAir' ) sort = 'start';
		if (this.props.series) {
			
			ret = sortBy( this.props.series, [ sort ] ).map( ( obj, i ) => {
				let c = obj;
				let time = moment.unix( c.start ).format( "LLLL ");
				let list = Filter( this.props.timers, ( t ) => ( t.name == obj.showName ) );
				let innerList = (<div>
					<h5 style={{ padding: 0, margin: '10 0 10 0' }} >Scheduled Recordings</h5>
					<RenderScheduled  fixedHeader={true} fixedFooter={false} program={{ title: c.showName }} list={list} channels={this.props.channels} onRowSelection={( i ) => {
							let programId = list[i].programId;
							let channel = Find( this.props.channels, (v) => ( v.channel == list[i].channel ));
							//debug(programId, list[i])
							if( channel ) this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + programId, page: 'Program Info' } );
					}} /> 
					
				</div>);
				return (
					<div className="col-sm-12 col-md-6"  style={{ marginBottom: 10 }}  key={c.id}>
						
						<Card expanded={this.state.expanded} onExpandChange={() => {
							//const s = moment.utc().unix();
							//const f = moment.utc().add(1, 'days').unix();
							//this.getEntries( c.id, s, f );
						}}>
							<CardHeader
								title={c.name}
								subtitle={c.runType === '1' ? 'New Episodes   |   ' + time : 'All Episodes   |   ' + time }
								//avatar={c.logo}
								actAsExpander={true}
								showExpandableButton={true}
							/>						
							<CardText expandable={true}>
								{innerList}
								
								<FlatButton onClick={()=>(this.renderSchedule( c ))} label="Key/Value Pairs" title="View stored information key/value pairs" />
							</CardText>

						</Card>
					</div>
				);
			});
			
			
			return (<div style={{ padding: '0 0px' }}>
				<div style={{ position: 'absolute', top: 15, right: 0, width: 200, height: 50 }}>
					
					<FontIcon className="material-icons" title="Sort by Name" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/season-passes/', query: {sortSeriesBy: 'show'}, page: 'Season Passes'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="Sort by time" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/season-passes/', query: {sortSeriesBy: 'nextToAir'}, page: 'Season Passes'}); } } >access_time</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="View Scheduled" hoverColor={Styles.Colors.limeA400} color={'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/scheduled/', query: {sortTimersBy: this.props.location.query.sortSeriesBy}, page: 'Scheduled'}) } } >dvr</FontIcon>
					<span> &nbsp; </span>
				</div>
				{ret}
				</div>
			);
		}
		
		return (<div style={{ padding: '0 0px' }}>
			{ret}
		</div>);
	}
	
}

Series.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Series ###',  params);
	return {}
}
