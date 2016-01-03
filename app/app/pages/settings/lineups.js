import React from 'react';
import Debug from 'debug';
import ChannelsTable from '../tables/channels';
import StationsTable from '../tables/stations';
import Gab from '../../common/gab';
import Routes from '../../routes';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, Divider, FontIcon, FlatButton, IconButton, IconMenu,  List, ListItem, MenuItem, Styles, Tabs, Tab, TextField } from 'material-ui/lib';
import SwipeableViews from 'react-swipeable-views';
import { Col } from 'react-bootstrap';
import { Button } from '../../common/utils';
import Icons from '../../assets/icons';
import { defaultsDeep } from 'lodash';
import injectTapEventPlugin from 'react-tap-event-plugin';
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
	
export default class Lineup extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Lineup Component'	
		this.state = {
			parent: props,
			slideIndex: 0,
			ready: false,
			durationError:2000,
			durationSuccess:1500,
			lineups: {
				channels: [],
				stations: []
			},
			lineupMap: {},
			colSortDirs: {},
		}
		this._update = false
		
		this.changeTab = this.changeTab.bind(this);
		this.lineupMap = this.lineupMap.bind(this);
		this._listenUpdateChannel = this._listenUpdateChannel.bind(this);
		this.reverseChannels = this.reverseChannels.bind(this);
		
		Gab.on('updateChannel', this._listenUpdateChannel);
		
	}
	
	changeTab (value) {
		debug('value', value);
		this.setState({
			slideIndex: value,
		});
	}
	componentDidMount() {
		debug('mount grab lineupMap');
		this.lineupMap();
	}
	_listenUpdateChannel(data) {
		/**
		 * we get back the same data that was sent if successul
		 * we also get an index and source property
		 * 
		 * */
		
		debug('update channel listen', data, (data.source && data.index >= 0 && data.data));
		if(data.source && typeof data.data  === 'object' && typeof data.data.channel === 'object') {
			debug('do we have a data source?', this.state.lineupMap[data.source], data.source, this.state.lineupMap)
			
			if(this.state.lineupMap.channels[data.data.channel.channel]) {
				
				// copy the item so we do not mutate the state object
				let copy = Object.assign({}, this.state.lineupMap);
				
				debug('copy done... cheking',copy[data.source][data.data.channel.channel].id === data.data.id,copy[data.source][data.data.channel.channel].id,data.data.id)
				
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
		
		this.props.sockets.schedules(headend, (data) => {
			debug('got schedules data', data);
			if(this.refs['schedules']) {
				this.refs['schedules'].success();
			}
			this.props.showAlert('info', 'Your program data is processing.  We will alert you when done.', 'html');
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
		if(!headend) {
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
						<p>Please wait a moment and if you need to <a href="#" onClick={(e)=>{e.preventDefault();this.props.goTo('settings', 'add')}}> add a new headend</a></p>
					</CardText>
				</Card>
			</Col>);
		} else {
							
			return (<Col xs={12} className="no-padding" >
				
						<Tabs
							
						>
							<Tab label="Headend" value={0} >
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
							
							
							</Tab>
							<Tab 
								label={
									<div style={{position:'relative'}}>
										Channels 
										<div style={{display: this.state.slideIndex === 1 ? 'block':'none', position:'absolute',top:'-12',right:'-5'}}>
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
													onClick={e => this.lineupMap(true, "grab")} 
													durationSuccess={this.state.durationSuccess} 
													durationError={this.state.durationError}
												/>
											
											</IconMenu>
										</div>
									</div>
								} 
								value={1} 
							>
								
								<div id="channels" className="no-gutter" style={styles.slide}>
									<Card>
										<CardTitle 
											title={"Channels"}
											subtitle={headend.name}
											titleColor={Styles.Colors.blue400}
											subtitleColor={Styles.Colors.grey500}
										/>
										<CardText style={{padding:0}} >	
											<ChannelsTable list={this.state.lineups.channels} { ...this.state } />
										</CardText>
									</Card>
									<div className="clearfix" />
								</div>
							
							
							</Tab>
							<Tab label="Guide" value={2} >
								
								
								<div style={styles.slide}>
									<Card>
										<CardTitle 
											title={"Guide"}
											subtitle={headend.name}
											titleColor={Styles.Colors.blue400}
											subtitleColor={Styles.Colors.grey500}
										/>
										<CardText style={{padding:0}} >
											<Button className={"btninfo square"} ref="schedules" onClick={e => this.getSchedules()} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Get Schedules</Button>
											<div>
												<p />
												<br />
											</div>
										</CardText>
									</Card>
									<div className="clearfix" />
								</div>
								
								
							</Tab>
						</Tabs>
						
					
			</Col>);
		}
	}
		
}

Lineup.defaultProps = {
	current: {},
	
};

function setKey(v) {
	if(!v || typeof v !== 'object') {
		return 'undefined';
	}
	if(v.atscMajor) {
		return v.atscMajor + '-' + v.atscMinor;
	} 
	if(v.channel) {
		return v.channel;
	}
	if(v.frequencyHz && v.serviceID) {
		return v.serviceID;
	}
	if(v.uhfVhf) {
		return v.uhfVhf;
	}
	
	debug('no channel', v)
	return false;
}
