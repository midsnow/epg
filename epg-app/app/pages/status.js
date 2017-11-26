import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon, Button } from '../common/utils';
import IconButton from 'material-ui/IconButton';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import Divider from 'material-ui/Divider';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import CardActions from 'material-ui/Card/CardActions';
import CardHeader from 'material-ui/Card/CardHeader';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import FontIcon from 'material-ui/FontIcon';
import Col from 'react-bootstrap/lib/Col';
import Styles from '../common/styles';

let debug = Debug('epg:app:pages:status');
		
export default class Status extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Status Component'	
		this.state = {
			buttonState: '',
			durationSuccess: 5000,
			durationError: 5000,
		}
		this._update = false
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps');
		this._update = true;
		//this.setState({ buttonState: '' });
		
	}
	
	componentWillUpdate() {
		debug('willUpdate');
		
	}
	
	componentDidUpdate() {
		debug('didUpdate');
	}
	
	componentDidMount() {
		debug('did mount');
		
	}
	
	render() {
		debug('status render', this.state, this.props);
		
		if(!this.props.status.serverID) {
			const refreshButton = (<Button className={"left"} ref="schedules" onClick={()=>{this.props.sockets.status();if(this.refs.schedules) this.refs.schedules.success(); }} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Refresh Status</Button>);
			return (<Col xs={12} md={9} mdOffset={1} lg={8} lgOffset={2} >
					<CardTitle 
						title={"Status"}
						subtitle={"Status is not available"}
						titleColor={Styles.Colors.red400}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:25}} >
						<List>
							
							<ListItem 
								primaryText={this.props.status.username} 
								disabled={true} 
								insetChildren={true}
								secondaryText="Account Username"
								leftIcon={<FontIcon style={{fontSize:'32px'}} className="material-icons" color={this.props.status.error ? Styles.Colors.amber400 : Styles.Colors.green600} hoverColor={Styles.Colors.amber500} >person</FontIcon>}
							/>
							
							<ListItem 
								leftIcon={<FontIcon style={{fontSize:'32px'}} className="material-icons" color={this.props.status.error ? Styles.Colors.amber400 : Styles.Colors.green600} hoverColor={Styles.Colors.amber500} >cloud_off</FontIcon>}
								primaryText={this.props.status.error ? this.props.status.error.message : 'Checking Status'} 
								disabled={true} 
							/>
							
							<ListItem 
								leftIcon={<FontIcon 
											className="material-icons" 
											color={this.props.status._db ? Styles.Colors.green600 : Styles.Colors.red600} 
											style={{fontSize:'32px'}}
										>
											save
										</FontIcon>
								}
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({ 
										path: '/epg/configuration',
										page: 'Set Database',
									});
								}} 
								primaryText={this.props.status._db ?  'Database Connected' : 'Database Disconnected'} 
								disabled={this.props.status._db} 
							/>
							
							<Col xs={12} sm={6} >
								<ListItem 
									primaryText={
										<span><Button  className={"left"} ref="schedules" onClick={()=>{this.props.goTo('configuration');}}  >Configuration</Button>
										</span>
									} 
									disabled={true} 
									insetChildren={false} 
								/>
							</Col>
							<Col xs={12} sm={6} >
								<ListItem 
									primaryText={refreshButton} 
									disabled={true} 
									insetChildren={false}
								/>
							</Col>	
							<div className="clearfix" />			
						</List>
					</CardText>
			</Col>);
		}
		
		let GR = [];
		if(Gab.guideUpdates.length > 0) {
			GR = Gab.guideUpdates.map((v, k) => {
				return <p key={k+'sdffret'}>{v}</p>;
			});
		}
		
		let updates = GR.length === 0 ? <span><b>Guide Update Log will  list here</b></span> : <div style={{maxHeight:300,overflow:'auto', padding:10}} ><span><b>Guide Refresh Log</b></span>{GR}</div>;
		
		let connected = this.props.sockets.io.connected ?
			this.props.guideRefresh.download ?
				<FontIcon className="material-icons" style={{fontSize:'32px'}} color={Styles.Colors.deepPurple200} hoverColor={Styles.Colors.deepPurple200} title={"Downloading guide data for " + this.props.guideRefresh.who[0]}>cloud_download</FontIcon>
			:	
				<FontIcon style={{fontSize:'32px'}} className="material-icons" color={Styles.Colors.green600} hoverColor={Styles.Colors.blue600} >cloud_done</FontIcon>
		:
			<IconButton onClick={(e)=>{e.preventDefault();this.props.goTo('disconnected');}} ><FontIcon style={{fontSize:'32px'}} className="material-icons" color={Styles.Colors.red600} hoverColor={Styles.Colors.amber500} >cloud_off</FontIcon></IconButton>;
		
		if(!this.props.status.account) {
			return <span />
		}			
		return (<Col xs={12} md={9} mdOffset={1} lg={8} lgOffset={2} >
					<CardTitle 
						title={"Status"}
						subtitle={
							<div><Col style={{ padding: 0 }} xs={6} >		
										Requested status from from agent
									</Col>
									<Col style={{ padding: 0 }}  xs={6} >
										<Button 
											style={{ marginTop: '-10px' }}
											ref="schedules" 
											onClick={()=>{
												this.props.sockets.status();
												if(this.refs.schedules) 
													this.refs.schedules.success(); 
											}} 
											durationSuccess={this.state.durationSuccess} 
											durationError={this.state.durationError} 
										>
											Refresh Status
										</Button>
									</Col>
								</div>}
						titleColor={Styles.Colors.blue400}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, paddingTop:20}} >
						
						<List>
					

							<ListItem 
								leftIcon={connected}
								primaryText={this.props.sockets.io.connected ? this.props.guideRefresh.download ? 'Guide data is being refreshed for ' + this.props.guideRefresh.who.join(', ') : 'Socket Connected' : 'Socket Disconnected'} 
								disabled={true} 
							/>
							
							<ListItem 
								leftIcon={<FontIcon 
											className="material-icons" 
											color={this.props.status._db === true ? Styles.Colors.green600 : Styles.Colors.red600} 
											style={{fontSize:'32px'}}
										>
											save
										</FontIcon>
								}
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({ 
										path: '/epg/configuration',
										page: 'Set Database',
									});
								}} 
								primaryText={this.props.status._db === true ?  'Database Connected' : 'Database Disconnected'} 
								disabled={this.props.status._db === true} 
							/>
							
							<ListItem 
								leftIcon={<FontIcon 
										className="material-icons" 
										color={this.props.status._agent === true ? Styles.Colors.green600 : Styles.Colors.red600} 
										style={{fontSize:'32px'}}
									>
										dvr
									</FontIcon>
								}
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({
										path: '/epg/configuration',
										page: 'Set Account',
									});
								}} 
								primaryText={this.props.status._agent === true ?  'Account Connected' : 'Account Disconnected'} 
								disabled={this.props.status._agent === true} 
							/>
							
							<ListItem style={{maxHeight:350}} primaryText={this.props.status.username} disabled={true} insetChildren={true} secondaryText="Agent Username"  />
							
							<ListItem primaryText={this.props.status.lineups.length + '/' +this.props.status.account.maxLineups} secondaryText="Lineups Used" disabled={true} insetChildren={true} />
							
							
							<ListItem secondaryText="Account Expiration" primaryText={this.props.status.account.expires}  disabled={true} insetChildren={true} />
							
							
							<ListItem secondaryText="Notifications" primaryText={this.props.status.notifications.length === 0 ? "0" : this.props.status.notifications.length} disabled={true} insetChildren={true}  />
							
							
							<ListItem secondaryText="Last data update" primaryText={this.props.status.lastDataUpdate} disabled={true} insetChildren={true}  />
							
							
							<ListItem secondaryText="Agent serverID" primaryText={this.props.status.serverID} disabled={true} insetChildren={true}  />
							
							
							<ListItem secondaryText="Agent Server Status" primaryText={this.props.status.systemStatus[0].status} disabled={true} insetChildren={true}  />
							
							<ListItem 
								primaryText={this.props.status.systemStatus[0].message}
								secondaryText="Agent Message" 
								disabled={true} 
								insetChildren={true}
							/>
							
							
							<Divider inset={true} />
							
							<ListItem style={{maxHeight:350}} primaryText={updates} disabled={true} insetChildren={true}  />
							
							
							
							
						</List>
						
						
					</CardText>
				<div style={{height:100}} />
			</Col>);
	}
}

