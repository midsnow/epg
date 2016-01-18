import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon, setChannelKey as setKey } from '../common/utils';
import { List, ListItem, Divider, FontIcon, Styles, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui/lib';
import { Col } from 'react-bootstrap';
import { defaultsDeep } from 'lodash';
import moment from 'moment';

let debug = Debug('epg:app:pages:guide');
		
export default class Guide extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Guide Component'	
		this.state = {
			lineups: {
				channels: [],
				stations: []
			},
			lineup: props.lineup,
			lineupMap: {},
		}
		this._update = false
		
		this.getGuideData = this.getGuideData.bind(this)
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps');
		
		if(props.lineup && this.state.lineup !== props.lineup && !this._update) {
			this.setState({
				lineup: props.lineup
			}, this.lineupMap);
			this._update = true;
		}
	}
	
	componentDidUpdate() {
		debug('didUpdate');
	}
	
	componentWillMount() {
		debug('will mount');
		if(this.state.lineup) {
			this.lineupMap();	
		}
	}
	
	componentWillUnmount() {
		this.props.sockets.io.removeListener('guide data', this.getGuideData);
	}
	
	guide() {
		debug('guide');
		let stations = this.state.lineups.channels.map((sta) => {
			return sta.stationID;
		});
		this.props.sockets.guide({stationID: stations}, (data) => {
			this.props.showAlert('info', data.data.message, 'html');
		});
		this.props.sockets.io.on('guide data', this.getGuideData);
	}
	
	getGuideData(data) {
		debug(data)
		let ID = Object.keys(data.stations)[0];
		let lineupMap = Object.assign({}, this.state.lineupMap);
		debug(ID, lineupMap.stations[ID], data.stations[ID])
		lineupMap.stations[ID].guide = Object.assign(lineupMap.stations[Object.keys(data.stations)[0]].guide, data.stations[ID]);
		this.setState({	lineupMap }, () => { 
			debug('guide data', this.state.lineupMap);
		});
	}
	
	lineupMap() {
		
		debug('getLineup');
		
		var headend = this.props.headends[this.props.lineup];
		
		if(typeof headend !== 'object') {
			debug('linepMap no headends', headend);
			return this.props.sockets.io.once('status',(data) => {
				debug('headends once');
				this.lineupMap();
			});
			
		}
		this.props.showAlert('warning', 'Channels will be available soon!', 'html');
		headend.active = true;
		
		debug('lineupMap headend', headend);
		
		this.props.sockets.lineupMap(headend, (data) => {
			debug('got getLineup data', data);
			if(data.error) {
				this.props.showAlert('danger', data.error.message, 'html');
					
			} else {
				
				let lineupMap = {
					channels: {},
					stations: {},
					allStations: {}
				}
				
				if(Array.isArray(data.channels)) {
					data.channels.forEach((v, k) => {
						let corc = setKey(v);
						if(corc && !lineupMap.channels[corc]) {
							lineupMap.channels[corc] = v;
							lineupMap.channels[corc].index = k;
							lineupMap.stations[v.stationID] = v;
							lineupMap.stations[v.stationID].index = k;
							lineupMap.stations[v.stationID].guide = {};
						}
					});
					data.stations = data.stations.filter((v) => {
						let corc = setKey(lineupMap.stations[v.stationID]);
						lineupMap.allStations[v.stationID] = v;
						if(corc && lineupMap.channels[corc]) {
							//delete v.id;
							defaultsDeep(lineupMap.channels[corc], v);
							return true;
						}
						return false;
					});
				}
				
				debug('___________MAP-----------',data, lineupMap);
				
				this.setState({
					lineups: data,
					lineupMap,
				});
				
				this.props.showAlert('info', 'Lineup Channels and Stations available', 'html');
				
				this._update = false;
					
			}
		});
	}
	
	render() {
		debug('guide render', this.state, this.props);
		
		let mylineups = this.props.lineups.lineups.map((v) => {
			return (
				<span key={v.lineup+'home'} ><ListItem 
					key={v.lineup+'home'} 
					style={{fontSize:'16px'}} 
					primaryText={v.name} 
					secondaryText={v.lineup} 
					leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >{pickIcon(v.transport)}</FontIcon>}
					onTouchTap={(e) => {
						e.preventDefault(e);
						this.props.goTo({
							current: v,
							page: 'guide',
							child: '',
							lineup: v.lineup,
							newalert: {
								show: true,
								html: 'Viewing guide for '+ v.name,
								style: 'info',
								duration: 2500,
							}
						});
					}}
					
				/>
				</span>
			);
		});
		
		let cKeys;
		let cState;
		let channels = <span />;
		let gData = [];
		let headerTimes = [];
		let now = moment().startOf('hour');
		for(var i=0;i<48;i++) {
			let time = moment
			headerTimes.push(
				<div key={now.valueOf()} className="epg__headerTime">
					{now.add(i*30, 'minutes').format("LT")}
				</div>
			);
		}
		if( this.state.lineupMap.channels ) {
			
			cKeys = Object.keys(this.state.lineupMap.channels);
			cState = this.state.lineupMap.channels;
			channels = cKeys.map((channel) => {
				let style = {}
				if( cState[channel].logo) {
					style.backgroundImage = 'url("' + cState[channel].logo.URL + '")';
				}
				gData.push(<div className="epg__row" key={"gg" + channel}>
					<div className="epg__timeSlot" />
					<div className="epg__timeSlot" />
					<div className="epg__timeSlot" />
					<div className="epg__timeSlot" />
				</div>);
				return (
					<div className="epg__channelSlot" key={"cc" + channel}>
						<div className="logo" style={style} />
						<div className="text" >
							{channel}
						</div>
					</div>
				);
			});
		}
		let list = false;
		let pick = <span />;
		if(!this.props.lineup) {
			pick = (<List subheader="My Lineups">{mylineups}</List>);
		} else {
			list = (
				<div className="epg__container">
					<div className="col1"> 
						<div className="epg__menuBar">
							<p><a href="#" onClick={(e)=>{e.preventDefault();this.guide();}} style={{color:'#fff'}}>Get Guide</a> </p>
						
						</div>
						<div className="epg__base">{channels}</div>
					</div>
					<div className="col2">
						<div className="epg__box">
							<div className="epg__row">
								{headerTimes}
								<div className="clearfix" />
							</div>
							{gData}
						</div>
					</div>
				</div>
			);
		}
			
		if(list) {
			return list;
		} else {	
			return (<Col xs={12} ><Card>
					<CardText style={{padding:0, height:'80%', textAlign:'center'}} >
						<p><a href="#" onClick={(e)=>{e.preventDefault();this.guide();}} >Get Guide</a> | <a href="#" onClick={(e)=>{e.preventDefault();window.history.back();}}>Previous Page</a></p>
						<div >
							{pick}
						</div>
					</CardText>
				</Card></Col>);
		
		}	
	}
}

