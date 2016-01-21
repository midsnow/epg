import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { clickButton, iButton, pickIcon, setChannelKey as setKey } from '../common/utils';
import { IconButton, List, ListItem, Divider, FontIcon, Styles, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui/lib';
import { Col } from 'react-bootstrap';
import { defaultsDeep } from 'lodash';
import moment from 'moment';
import Swipeable from 'react-swipeable';
import store from '../common/localstore';
import GuideTable from './tables/guide';

let debug = Debug('epg:app:pages:guide');

let w;
	
let myStyles = {
	primary1Color: '#26282D',
	textColor: Styles.Colors.blue100,
	alternateTextColor: Styles.Colors.lightBlue50,
	primary2Color: '#26282D',
	primary3Color: '#26282D',

	canvasColor: '#303234',
	accent1Color: "#FF6040",
	accent2Color: "#F5001E",
	accent3Color: "#FA905C"
}
		
export default class Guide extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Guide Component'	
		this.state = {
			lineup: props.lineup,
			lineups: {
				channels: [],
				stations: []
			},
			channels: {},
			stations: [],
			hours: 24,
			page: 1,
			perPage: 5,
			cachePerGrab: 15,
			channelsPer: 100,
			index: 0
		};
		this.guide = {};
		this.moment = moment().startOf('hour');
		this.timeframe = () => {
			return moment(this.moment);
		}
		this._update = false
		
		this.getGuideData = this.getGuideData.bind(this);
		this.advanceChannels = this.advanceChannels.bind(this);
		this.prevChannels = this.prevChannels.bind(this);
		this.flickMe = this.flickMe.bind(this);
		this.handleSwipeAction = this.handleSwipeAction.bind(this);
		this.swipedUp = this.swipedUp.bind(this);
		this.swipedDown = this.swipedDown.bind(this);
		this.swipingUp = this.swipingUp.bind(this);
		this.swipingDown = this.swipingDown.bind(this);
		
	}
	
	getChildContext() {
		return {
			muiTheme: Styles.ThemeManager.modifyRawThemePalette(Styles.ThemeManager.getMuiTheme(Styles.DarkRawTheme), myStyles)
		};
	}
	
	setMoment(moment) {
		this.moment = moment(moment);
	}
	
	componentWillReceiveProps(props) {
		//debug('receiveProps');
		
		if(props.lineup && this.state.lineup !== props.lineup && !this._update) {
			this.setState({
				lineup: props.lineup
			}, this.lineupMap);
			this._update = true;
		}
	}
	
	componentWillMount() {
		//debug('will mount');
		if(this.state.lineup) {
			this.lineupMap();	
		}
		w = undefined;
		w = new Worker('/epg-files/app/common/workers/index.js');
		w.onmessage = (event) => {
			this.gotGuideDataFromWorker(event.data);
		};
	}
	
	componentWillUnmount() {
		this.props.sockets.io.removeListener('guide data', this.getGuideData);
		w.terminate();
	}
	
	componentDidUpdate() {
		//debug('did update', this.state.lineup, this._startedSwipeAt);
		if(this.state.lineup && this._startedSwipeAt === undefined) {
			this.setBreakPoints();
			debug('did update 2', this.state.lineup, this._startedSwipeAt, document.getElementById('swiping').offsetTop);
		}
	}
	
	componentDidMount() {
		//debug('did mount', this.state.lineup, this._startedSwipeAt);
		if(this.state.lineup && this._startedSwipeAt === undefined) {
			this.setBreakPoints();
			debug('did mount 2', this.state.lineup, this._startedSwipeAt, document.getElementById('swiping').offsetTop);
		}
	}
	
	setBreakPoints() {
		this._startedSwipeAt = document.getElementById('swiping').offsetTop;
		this._baseHeight = document.getElementsByClassName('epg__base')[0].offsetHeight;
		this._channelHeight = this._baseHeight / this.state.perPage;
		this._breakpoint = 0;
		this.__swiping = 0;
		this.__swipe = false;
		this.__guideAt = document.getElementsByClassName('epg__box')[0].offsetTop;
		this._breakpoints = [];
		for(var i = 1; i <= this.state.perPage; i++) {
			this._breakpoints.push(this._channelHeight * i + this._startedSwipeAt);
		}
		debug('setBreakPoints', this._startedSwipeAt, this._baseHeight, this._channelHeight);
	}
	
	advanceChannels(e, index) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		let newIndex = index ? this.state.index + index : this.state.index + this.state.perPage;
		this.setState({
			index: newIndex
		});
	}
	
	prevChannels(e, index) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		let newIndex = index ? this.state.index - index : this.state.index === 0 ? 0 : this.state.index - this.state.perPage;
		if(newIndex < 0 ) newIndex = 0;
		this.setState({
			index: newIndex
		});
	}
	
	grabGuideData(data = {}) {
		debug('guide', data);
		
		let g = { 
			end:  this.timeframe().add(this.state.hours, 'hours'),
			start: this.timeframe().subtract(1, 'hours')
		}
		//debug('between', g);
		
		let startC = this.state.index;
		let endC = this.state.index + this.state.perPage + this.state.cachePerGrab;
		let i = -1;
		let stations = this.state.lineups.channels.filter((sta) => { 
			i++;
			if(this.guide[sta.stationID] === Object(this.guide[sta.stationID])) {
				let v = false;
				for(const k in this.guide[sta.stationID]) {
					if(k>=g.start.valueOf() && k<=g.end.valueOf()) {
						v = true;
					}
				}
				if(v) return false;
			}
			if(i>=startC && i<endC) {
				return true;
			}
			return false;
		}).map((sta) => {
			
			return sta.stationID;
		});
		this.props.sockets.guide({ stationID: stations, ...g }, (data) => {
			debug('return callback data', data);
			let m = data.data === Object(data.data) ? data.data.message : false;
			if(m) {
				this.props.showAlert('info', m, 'html');
			}
		});
		this.props.sockets.io.on('guide data', this.getGuideData);
	}
	
	getGuideData(data) {
		//debug(data)
		return;
		let ID = Object.keys(data.stations)[0];
		let lineupMap = Object.assign({}, this.state.lineupMap);
		//debug(ID, lineupMap.stations[ID], data.stations[ID])
		lineupMap.stations[ID].guide = Object.assign(lineupMap.stations[Object.keys(data.stations)[0]].guide, data.stations[ID]);
		this.setState({	lineupMap }, () => { 
			debug('guide data', ID, data);
		});
	}
	
	guideWorker(filter = {}) {
		// load guide data from storage first then refresh
		this.guide = {};
		store.getStations(this.state.stationMap, (err, stations) => {
			this.guide = stations;
		});
		
		let def = {
			hours: this.state.hours,
			stations: this.state.stationMap,
			moment: this.timeframe().valueOf()
		}
		
		let opts = Object.assign(def, filter);
		
		w.postMessage(opts);
	}
	
	gotGuideDataFromWorker(data) {
		let ID;
		if(data.stations === Object(data.stations)) {
			ID = Object.keys(data.stations)[0];
			let guide = { ...this.guide };
			if(guide[ID] !== Object(guide[ID])) {
				guide[ID] = {};
			}
			guide[ID] = Object.assign(guide[ID], data.stations[ID]);
			this.guide =  guide;
			
			store.getItem(ID, (err, doc) => {
				if(doc) {
					let item = Object.assign(doc, data.stations[ID]);
					store.setItem(ID, item, (err, value) => {
						if(err) {
							debug('error saving guide data', err, data)
						}
					});
				}
			});
		}
		 
		//debug('got guide data from worker', ID, data);		
	}
	
	lineupMap() {
		
		//debug('getLineup');
		
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
		
		//debug('lineupMap headend', headend);
		
		this.props.sockets.lineupMap(headend, (data) => {
			//debug('getLineup data', data);
			if(data.error) {
				this.props.showAlert('danger', data.error.message, 'html');
					
			} else {
				
				let channels = {};
				let stations = {};
				let stationMap = [];
				
				if(Array.isArray(data.channels)) {
					data.channels.forEach((v, k) => {
						let corc = setKey(v);
						if(corc && !channels[corc]) {
							channels[corc] = v;
							channels[corc].index = k;
							stationMap.push(v.stationID);
							stations[v.stationID] = v;
							stations[v.stationID].index = k;
						}
					});
					data.stations = data.stations.filter((v) => {
						let corc = setKey(stations[v.stationID]);
						if(corc && channels[corc]) {
							//delete v.id;
							defaultsDeep(channels[corc], v);
							return true;
						}
						return false;
					});
				}
								
				this.setState({
					channels,
					stations,
					stationMap,
					lineups: data
				}, this.guideWorker);
				
				this.props.showAlert('warning', 'Grabbing guide data', 'html');
				
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
		let timeSlot = [];
		let now = this.timeframe().subtract(30,'minutes');
		//debug(this.timeframe().valueOf(), now.format("LT"));
		for(var i=0;i<this.state.hours*2;i++) {
			let time = moment
			headerTimes.push(
				<div key={now.valueOf()} className="epg__headerTime" style={{ left: i * 150 }}>
					{now.add(30, 'minutes').format("LT")}
				</div>
			);
			timeSlot.push(<div key={'ts' + now.valueOf()} className="epg__timeSlot"  style={{ left: i * 300 }} />);
		}
		let n = 0;
		let _saveW = 0;
		if( this.state.channels ) {
			
			cKeys = Object.keys(this.state.channels);
			cState = this.state.channels;
			
			let startC = this.state.index;
			let endC = this.state.index + this.state.perPage + 1;
			let i = -1;
			
			channels = cKeys.filter(()=>{i++;return (i<(endC+this.state.channelsPer))}).map((channel) => {
				let style = {}
				if( cState[channel].logo) {
					style.backgroundImage = 'url("' + cState[channel].logo.URL + '")';
				}
				
				n++;
				let programs = [];
				if(this.guide && n < endC * 2) {
					if(this.guide[cState[channel].stationID]) {
						
							let ks = this.guide[cState[channel].stationID];
							let _saveW = 0;
							let time = 0;
							let times = Object.keys(ks).sort();
							times.forEach((x,k) => {
								if(x >= this.timeframe().valueOf() && x < this.timeframe().add(this.state.hours, 'hours').subtract(1, 'minute').valueOf()) {
									let info = ks[x];
									let time = moment(info.airDateTime);
									let width = info.duration / 12;
									let description;
									if(info.descriptions === Object(info.descriptions)) {
										description = info.descriptions;
									} else {
										description = {};
									}
									let dd = <span>{moment(info.airDateTime).format('LT')} till {moment(info.airDateTime).add(info.duration, 'seconds').format('LT')}</span>;
									let text = (<div>
										{Array.isArray(info.titles) ? info.titles[0].title120 : 'no title'} <br />
										<span style={{color:'#F4AA30',fontSize:'11px'}}>{description.short}</span>
									</div>);
									programs.push(
										<div key={'ts' + x} className="epg__timeSlot"  style={{ left: _saveW, width: width }} >
											{text}
										</div>
									);
									_saveW += width;
									time = x;
								}
							});
						
					}
				}
				if(programs.length < 1) {
					programs = timeSlot;
				}
				gData.push(<div className="epg__row" key={"gg" + channel}>
					{programs}
				</div>);
				
				let styler = {};
				
				return (
					<div style={styler} className="epg__channelSlot" key={"cc" + channel}>
						<div className="logo" style={style} />
						<div className="text" >
							{channel}
						</div>
					</div>
				);
			});
			// pad the top for the first page
			if(this.state.index < 5) {
				//channels.unshift(<div className="epg__channelSlot" key={"ccm5"}>nothung to see here</div>);
				for(var ii=0;ii<4;ii++) {
					//channels.unshift(<div className="epg__channelSlot" key={"ccm" + ii}></div>);
				}
			}
		}
		let list = false;
		let pick = <span />;
		if(!this.props.lineup) {
			pick = (<List subheader="Select a Guide">{mylineups}</List>);
		} else {
			list = (
				<div className="epg__container">
					<GuideTable list={this.state.lineups.channels} sockets={this.props.sockets} guide={this.guide} { ...this.state } />
				</div>
			);
			let list2 = (
				<div className="epg__container">
					<div className="col1"> 
						<div className="epg__menuBarTop">
							<div className="col-xs-2 no-padding" style={{cursor:'pointer',padding:5}}>
								{clickButton(this.props.handleLeftNav, {
									className: "material-icons",
									style: {fontSize:'18px'},
									color: Styles.Colors.grey200,
									hoverColor: Styles.Colors.amber900,
									title: 'Menu',
									dataIcon: 'menu'
								})}
							</div>
							<div className="col-xs-10 no-padding" onClick={(e)=>{this.flickMe(e, 'down')}} style={{cursor:'pointer',backgroundColor: Styles.Colors.grey700,padding:5}}>
								{clickButton((e)=>{this.flickMe(e, 'down')} ,{
									className: "material-icons",
									style: {fontSize:'24px'},
									color: Styles.Colors.grey200,
									hoverColor: Styles.Colors.amber900,
									title: 'Prev Channels',
									dataIcon: 'arrow_drop_up'
								})}
							</div>
						</div>
						<div className="epg__base">
							
							<Swipeable
								delta={0}
								onSwipedUp={this.swipedUp}
								onSwipedDown={this.swipedDown}
								onSwipingUp={this.swipingUp}
								onSwipingDown={this.swipingDown}
								onSwiped={this.handleSwipeAction}
							>
								<div id="swiping">{channels}</div>
							</Swipeable>
						</div>
						<div className="epg__menuBarFloat">
							<div className="col-xs-2 no-padding" style={{cursor:'pointer',padding:5}}>
								{clickButton(()=>{
									this.props.goTo({
										
										page: 'lineup',
										child: '',
										lineup: this.props.lineup,
										
									});
								},{
									className: "material-icons",
									style: {fontSize:'20px'},
									color: Styles.Colors.grey400,
									hoverColor: Styles.Colors.amber600,
									title: 'Settings',
									dataIcon: 'settings'
								})}
							</div>
							<div className="col-xs-10 no-padding" onClick={this.flickMe} style={{cursor:'pointer',backgroundColor: Styles.Colors.grey700,padding:5}}>
								{clickButton(this.flickMe,{
									className: "material-icons",
									style: {fontSize:'24px'},
									color: Styles.Colors.grey400,
									hoverColor: Styles.Colors.amber600,
									title: 'Next Channels',
									dataIcon: 'arrow_drop_down'
								})}
							</div>
						</div>
					</div>
					<div className="col2">
						<div className="epg__box">
							<div className="epg__headerRow">
								{headerTimes}
								<div className="clearfix" />
							</div>
							{gData}
							<div className="epg__headerRow">
								
								<div className="clearfix" />
							</div>
						</div>
					</div>
				</div>
			);
		}
			
		if(list) {
			return list;
		} else {	
			return pick;
		}
	}
	
	
	swipingUp(ev, x, y) {
		if(ev && typeof ev.preventDefault === 'function') {
			ev.preventDefault();
		}
	
		this.__swipe = 'up';
		
		let newPos = this._startedSwipeAt - x;
		document.getElementById('swiping').style.top = newPos;
		document.getElementsByClassName('epg__box')[0].scrollTop = -newPos;
		
		debug('going up', ev, x, this._startedSwipeAt, newPos, -newPos);
	}
	
	swipingDown(ev, x, y, isFlick) {
		if(ev && typeof ev.preventDefault === 'function') {
			ev.preventDefault();
		}
		
		this.__swipe = 'down';
		
		let newPos = this._startedSwipeAt + x > 0 ? 0 : this._startedSwipeAt + x;
		document.getElementById('swiping').style.top = newPos;
		document.getElementsByClassName('epg__box')[0].scrollTop = -newPos;
		
		debug('going down', ev, x, this._startedSwipeAt, newPos, -newPos);
	}
	
	swipedUp(ev, x, y) {
		if(ev && typeof ev.preventDefault === 'function') {
			ev.preventDefault();
		}
		debug('swiped up', ev, x, y, this.__swiping, this._channelHeight);
						
		if(this.__swiping >= this._channelHeight) {
			this.advanceChannels(ev, Math.floor(this.__swiping/this._channelHeight));
			debug('reload from swipedUp', Math.floor(this.__swiping/this._channelHeight));
			this.__swiping = 0;
		}
		
	}
	
	swipedDown(ev, x, y) {
		if(ev && typeof ev.preventDefault === 'function') {
			ev.preventDefault();
		}
		debug('swiped down', ev, this.__swiping, this._baseHeight);
				
		if(this.__swiping*-1 >= this._channelHeight) {
			this.prevChannels(ev, Math.floor(this.__swiping*-1/this._channelHeight));
			debug('reload from swipedDown', Math.floor(this.__swiping*-1/this._channelHeight));
			this.__swiping = 0;
			
		}
		
	}
	
	handleSwipeAction(ev, x, y, isFlick) {
		if(ev && typeof ev.preventDefault === 'function') {
			ev.preventDefault();
		}
		
		this.__swiping += y;		
		
		if(isFlick && !this.state) {
			console.info('Flicked');
			this.flickMe(ev);
		}
		
		this._startedSwipeAt = document.getElementById('swiping').offsetTop;
		
		debug('swiped', ev, y, isFlick, this.__swiping, this._startedSwipeAt, this.__guideAt);
	}
	
	flickMe(e, go) {
		if(e) {
			e.stopPropagation();
			e.preventDefault();
		}
		if(this.__swipe === 'down' || go === 'down') {
			let newPos = this._startedSwipeAt + this._baseHeight;
			debug('moveto down', newPos);
			newPos = newPos > 0 ? 0 : newPos;
			document.getElementById('swiping').style.top = newPos;
			document.getElementsByClassName('epg__box')[0].scrollTop = -newPos;
			this._startedSwipeAt = document.getElementById('swiping').offsetTop;
			this.prevChannels(e);
		} else {
			let newPos = this._startedSwipeAt - this._baseHeight;
			debug('moveto up', newPos);
			document.getElementById('swiping').style.top = newPos;
			document.getElementsByClassName('epg__box')[0].scrollTop = -newPos;
			this._startedSwipeAt = document.getElementById('swiping').offsetTop;
			this.advanceChannels(e);
		}
		this.__swiping = 0;
	}
}

Guide.childContextTypes = {
    muiTheme: React.PropTypes.object
};
