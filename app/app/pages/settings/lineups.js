import React from 'react';
import Debug from 'debug';
import ChannelsTable from '../tables/channels';
import StationsTable from '../tables/stations';
import Confirm from '../../common/components/confirm';
import Gab from '../../common/gab';
import Routes from '../../routes';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, Divider, FontIcon, FlatButton, IconButton, IconMenu,  List, ListItem, MenuItem, Styles, Tabs, Tab, TextField } from 'material-ui/lib';
import SwipeableViews from 'react-swipeable-views';
import { Col } from 'react-bootstrap';
import { Button, setChannelKey as setKey } from '../../common/utils';
import Icons from '../../assets/icons';
import { defaultsDeep } from 'lodash';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Path from 'path';

injectTapEventPlugin();
let debug = Debug('epg:app:pages:lineups');

const styles = {
	headline: {
		fontSize: 24,
		paddingTop: 16,
		marginBottom: 12,
		fontWeight: 400,
	},
	slide: {
		padding: 10,
	},
};

let pageIndex = {
	'headend': 0,
	'channels': 1,
	'stations': 1,
	'guide-settings': 2,
	0: 'headend',
	1: 'channels',
	2: 'guide-settings'
};

let paths = location.pathname.split( '/' ).filter(v => v !== '');

export default class Lineup extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Lineup Component'	
		this.state = {
			parent: props,
			slideIndex: pageIndex[paths[3]] ?  pageIndex[paths[3]] : 0,
			pageIndex: pageIndex,
			ready: false,
			durationError:2000,
			durationSuccess:1500,
			lineups: {
				channels: [],
				stations: []
			},
			lineupMap: {},
			stationsTable: paths[3] === 'stations' ? true : false,
			newconfirm: {
				open: false
			},
		}
		this._update = false
		
		this.changePage = this.changePage.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.lineupMap = this.lineupMap.bind(this);
		this._listenUpdateChannel = this._listenUpdateChannel.bind(this);
		this.reverseChannels = this.reverseChannels.bind(this);
		this.answerConfirm = this.answerConfirm.bind(this);
		this.lineupMapRefresh = this.lineupMapRefresh.bind(this);
		
		Gab.on('updateChannel', this._listenUpdateChannel);
		
	}
	
	changePage (e) {
		e.preventDefault();
		this.setState({
			stationsTable: !this.state.stationsTable
		}, e => this.pushHistory(this.state.stationsTable ? 'stations' : 'channels'));
	}
	
	pushHistory(page) {
		debug('push history', '/' , Path.join('/' , this.props.page, this.props.child, this.props.lineup, page))
		this.props.history.push({
			pathname: Path.join('/' , this.props.page, this.props.child, this.props.lineup, page),
			search: this.props.query,
			state: {
				page: this.props.page,
				current: this.props.current,
				child: this.props.child,
				lineup: this.props.lineup,
				headend: page
			}
		})
	}
	
	handleChange (value) {
		this.setState({
			slideIndex: value,
		}, () => this.pushHistory(pageIndex[value]));
	}
	componentDidMount() {
		debug('mount grab lineupMap');
		this.lineupMap();
	}
	_listenUpdateChannel(data) {
		/**
		 * we get back the same data that was sent if successful
		 * we also get an index and source property
		 * 
		 * */
		
		debug('update channel listen', data, 'test', (data.source && data.index >= 0 && typeof data.data === 'object'));
		if(data.source && typeof data.data  === 'object' && typeof data.data.channel === 'object') {
			debug('do we have a data source?', this.state.lineupMap[data.source].length, data.source, this.state.lineupMap)
			
			if(this.state.lineupMap.channels[data.data.channel.channel]) {
				
				// copy the item so we do not mutate the state object
				let copy = Object.assign({}, this.state.lineupMap);
				
				debug('copy done... cheking',copy[data.source][data.data.channel.channel].id === data.data.channel.id,copy[data.source][data.data.channel.channel].id,data.data.channel.id)
				
				if(typeof copy[data.source][data.data.channel.channel] === 'object' && copy[data.source][data.data.channel.channel].id === data.data.channel.id) {
					
					// merge the updated data in
					copy[data.source][data.data.channel.channel] = Object.assign(copy[data.source][data.data.channel.channel], data.data.update)
					
					debug('save data from channel update listener', copy[data.source][data.data.channel.channel], data.data);
					
					this.setState({ lineupMap: copy });
				
				} else {
					debug('no good data from channel update listener', copy, data);
				}
			}
		}
	}
	componentWillUnmount() {
		debug('remove listener _listenUpdateChannel from Gab');
		Gab.removeListener('updateChannel', this._listenUpdateChannel);
	}
	componentWillReceiveProps(props) {
		//debug('receiveProps');
		
		if(props.lineup !== this.state.parent.lineup) {
			this.setState({
				parent: props,
				lineups: {
					channels: [],
					stations: []
				},
				lineupMap: {},
				stationsTable: false
			}, this.lineupMap);
			
		}
		
		this._update = false;
		
	}
	componentDidUpdate() {
		//debug('didUpdate');
		this._update = false;
		
	}
	componentDidMount() {
		//debug('did mount');
		debug('mount grab lineupMap');
		this.lineupMap();
	}
	
	reverseChannels(e) {
		
		e.preventDefault();
		debug('reverse');
		this.setState({
			lineups: {
				channels : this.state.lineups.channels.reverse(),
				stations: this.state.lineups.stations
			}
		});
							 
	}
	
	getSchedules() {
		if(this.refs['schedules']) {
			this.refs['schedules'].loading();
		}
		
		var headend = this.props.headends[this.props.lineup];
		
		if(typeof headend !== 'object') {
			return debug('linepMap no headends', headend);
		}
		
		debug('schedule headend', headend);
		
		this.props.sockets.refreshGuide(headend, (data) => {
			debug('got schedules data', data);
			if(this.refs['schedules']) {
				this.refs['schedules'].success();
			}
			if(data === 'success') {
				debug('update started');
				return;
			}
			this.props.assets({
				newalert: data
			});
		});
	}
	lineupMapRefresh(e) {
		e.preventDefault();
		var headend = this.props.headends[this.props.lineup];
		this.setState({
			newconfirm: {
				open: true,
				html: 'Are you sure you want to refresh ' + headend.name + '?  You will lose your saved channels!',
				yesText: 'Get Channels'
			},
			answerConfirm: true,
			answerMethod: 'lineupMap'
		});
	}
	
	answerConfirm(success) {
		if(success) {
			this[this.state.answerMethod](this.state.answerConfirm);
		}
		this.setState({
			newconfirm: {
				open: false,
			},
			answerConfirm: false
		});
		
	}
	lineupMap(refresh = false, button = 'submit') {
		
		debug('getLineup');
		
		if(this.refs[button]) {
			this.refs[button].loading();
		}
		
		var headend = this.props.headends[this.props.lineup];
		
		if(typeof headend !== 'object') {
			debug('linepMap no headends', headend);
			return this.props.sockets.io.once('status',(data) => {
				debug('headends once');
				this.lineupMap();
			});
			
		}
		this.props.showAlert('warning', 'Channels will be available soon!', 'html');
		headend.refresh = refresh;
		
		debug('lineupMap headend', headend);
		
		this.props.sockets.lineupMap(headend, (data) => {
			debug('got getLineup data', data);
			if(data.error) {
				this.props.showAlert('danger', data.error.message, 'html');
				if(this.refs[button]) {
					this.refs[button].error();
				}		
			} else {
				if(this.refs[button]) {
					this.refs[button].success();
				}
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
					
			}
		});
	}
	
	render() {
		debug('render lineup', this.state, 'props', this.props);
		
		let headend = this.props.headends[this.props.lineup];
		
		let table;
		let GR = [];
		let updates = <span><b>Guide Update Log will  list here</b></span>;
		
		if(!this.props.headends) {
			return (<Col xs={12} style={{marginBottom:20}}  >
				<Card>
					<CardTitle 
						title={"Loading"}
						subtitle={"Waiting for all assets to load"}
						titleColor={Styles.Colors.blue400}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
						<div className="" style={{padding:0, height:100, paddingTop:0, paddingBottom:30}}>
							<div className="Spinner Spinner--default Spinner--lg"><span className="Spinner_dot Spinner_dot--first"></span><span className="Spinner_dot Spinner_dot--second"></span><span className="Spinner_dot Spinner_dot--third"></span></div>
						</div>
						<Divider style={{marginBottom:30}} />
						<p>Data is loading or you have selected a headend that is no longer valid.  </p>
						<p>Please wait a moment and if you need to <a href="#" onClick={(e)=>{e.preventDefault();this.props.goTo('add-lineup')}}> add a new headend</a></p>
					</CardText>
				</Card>
			</Col>);
		} else if(!headend) {
			return (<Col xs={12} style={{marginBottom:20}}  >
				<Card>
					<CardTitle 
						title={"404"}
						subtitle={"The requested headend could not be found"}
						titleColor={Styles.Colors.red600}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
						<div className="" style={{color:Styles.Colors.grey600, fontSize:'76px', padding:0, height:100, paddingTop:0, paddingBottom:30}}>
							<FontIcon style={{fontSize:'128px'}} className="material-icons" color={Styles.Colors.amber600} hoverColor={Styles.Colors.amber500} >error</FontIcon>
						</div>
						<div style={{marginBottom:40}} />
						<p><a href="#" onClick={(e)=>{e.preventDefault();this.props.goTo('add-lineup')}}>Add a new headend</a></p>
					</CardText>
				</Card>
			</Col>);
		
		} else {
			table = !this.state.stationsTable && this.state.slideIndex === 1 ? 
				<ChannelsTable list={this.state.lineups.channels} sockets={this.props.sockets} { ...this.state } />
			: 
				this.state.stationsTable && this.state.slideIndex === 1 ?
					<StationsTable list={this.state.lineups.channels} sockets={this.props.sockets} { ...this.state } />
				:
					<span />
				
			
			if(this.state.slideIndex === 2) {
				if(Gab.guideUpdates.length > 0) {
					GR = Gab.guideUpdates.map((v, k) => {
						return <p key={k+'sdffret'}>{v}</p>;
					});
				}
				updates = GR.length === 0 ? <span><b>Guide Update Log will  list here</b></span> : <div style={{maxHeight:document.body.offsetHeight/2,overflow:'auto', padding:10}} ><span><b>Guide Refresh Log</b></span>{GR}</div>;
			}
							
			return (<Col xs={12} className="no-padding" >
				
						<Tabs
							onChange={this.handleChange}
							value={this.state.slideIndex}
						>
							<Tab label="Headend" value={0} />
							<Tab label={<div style={{position:'relative'}}>
								Channels 
								<div style={{display: this.state.slideIndex === 1 ? 'block':'none', position:'absolute',top:'-12',right:'-15'}}>
									<IconMenu 
										iconButtonElement={<IconButton><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >cached</FontIcon></IconButton>}
									>
										
										<MenuItem 
											leftIcon={<FontIcon className="material-icons" color={Styles.Colors.blue100}  >archive</FontIcon>}  
											primaryText="Get Channels from Cache" 
											onClick={e => this.lineupMap(false, "cached")} 
											durationSuccess={this.state.durationSuccess} 
											durationError={this.state.durationError} 
										/>
										<Divider />
										<MenuItem
											rightIcon={<FontIcon className="material-icons" color={Styles.Colors.blue100}  >cloud_download</FontIcon>}  
											primaryText="Force grab of Channels from Agent" 
											onClick={this.lineupMapRefresh} 
											durationSuccess={this.state.durationSuccess} 
											durationError={this.state.durationError}
										/>
									
									</IconMenu>
								</div>
							</div>} value={1} />
							<Tab label="Guide" value={2} />
						</Tabs>
						
						<SwipeableViews
							index={this.state.slideIndex}
							onChangeIndex={this.handleChange}
						>
							<div style={styles.slide} className="no-gutter">
								<Col xs={12} style={{padding:5}}  >
									<Card>
										<CardTitle 
											title={<TextField
												hintText="change the headend name"
												value={headend.name}
												style={{width:'100%'}}
												underlineStyle={{borderColor:'transparent'}}
												inputStyle={{fontWeight:'bold',fontSize:'32px',color:Styles.Colors.blue500}}
												onChange={(e) => {
													headend.name = e.target.value;
													this.props.sockets.updateHeadend(headend, { name: e.target.value});
													this.props.lineups.lineups[headend.index].name = e.target.value;
													this.props.assets({});
												}} 
											/>}
											subtitle={"headend information"}
											titleColor={Styles.Colors.blue400}
											subtitleColor={Styles.Colors.grey500}
										/>
										<CardText style={{}} >
											<List>
												<ListItem 
													primaryText={
														headend.name
													} 
													disabled={true} 
													insetChildren={true} 
												/>
												<Divider inset={true} />
												<ListItem primaryText={headend.lineup} disabled={true} insetChildren={true} />
												<Divider inset={true} />
												<ListItem primaryText={headend.location} disabled={true} insetChildren={true}  />
												<Divider inset={true} />
												<ListItem primaryText={headend.transport}  disabled={true} insetChildren={true} />
												<Divider inset={true} />
												<ListItem primaryText={headend.uri} disabled={true} insetChildren={true}  />
												<Divider inset={false} />
												<ListItem secondaryText={"confirm and remove " + headend.lineup + " from account"} primaryText="Delete" style={{color:Styles.Colors.deepOrange800}} leftIcon={<Icons name="trash"  style={{color:Styles.Colors.deepOrange800}} />} onClick={()=>{this.props.lineupRemove(headend)}}  />
												<Divider inset={false} />
											</List>
											<div className="clearfix" style={{margin:'10px 0'}} />
										</CardText>
									</Card>
								</Col> 
								<div className="clearfix" style={{marginBottom:30}} />
							</div>
							<div id="channels" className="no-gutter" style={styles.slide}>
								<Card>
									<CardTitle 
										title={this.state.stationsTable ? 'Stations':"Channels"}
										subtitle={<div>{headend.name} - <a href="#" onClick={this.changePage}>Switch to {this.state.stationsTable ? 'Channels' : 'Stations'}</a></div>}
										titleColor={Styles.Colors.blue400}
										subtitleColor={Styles.Colors.grey500}
									/>
									<CardText style={{padding:0}} >	
										{table}
										<Confirm 
											html={this.state.newconfirm.html}
											title={this.state.newconfirm.title}
											answer={this.answerConfirm}
											open={this.state.newconfirm.open}
											yesText={this.state.newconfirm.yesText}
											noText={this.state.newconfirm.noText}
										/>
									</CardText>
								</Card>
								<div className="clearfix" />
							</div>
							<div style={styles.slide}>
								<Card>
									<CardTitle 
										title={"Guide"}
										subtitle={headend.name}
										titleColor={Styles.Colors.blue400}
										subtitleColor={Styles.Colors.grey500}
									/>
									<CardText style={{padding:0}} >
										<Col xs={6}><Button className={"left"} ref="schedules" onClick={e => this.getSchedules()} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Get Schedules</Button>
										</Col>
										<div className="clearfix" style={{margin:'20px 0'}} />
										<Col xs={12} >
											{updates}
											<br />
										</Col>
										<div className="clearfix" style={{margin:'10px 0 40px'}} />
									</CardText>
								</Card>
								<div className="clearfix" />
							</div>
						</SwipeableViews>
					
			</Col>);
		}
	}
		
}

Lineup.defaultProps = {
	current: {},
	
};

