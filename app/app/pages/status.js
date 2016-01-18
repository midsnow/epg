import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon, Button } from '../common/utils';
import { List, ListItem, Divider, FontIcon, Styles, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle, IconButton } from 'material-ui/lib';
import { Col } from 'react-bootstrap';

let debug = Debug('epg:app:pages:status');
		
export default class Status extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Status Component'	
		this.state = {
			
		}
		this._update = false
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps');
		this._update = true;
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
			return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} ><Card>
					<CardTitle 
						title={"Status"}
						subtitle={"Requested status from from agent"}
						titleColor={Styles.Colors.blue400}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:25}} >
						Status not currently available.
						
						<div><Button className={"left"} ref="schedules" onClick={(e)=>{e.preventDefault();this.props.sockets.status()}} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Refresh Status</Button></div>
					</CardText>
				</Card>
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
		return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} ><Card>
					<CardTitle 
						title={"Status"}
						subtitle={"Requested status from from agent"}
						titleColor={Styles.Colors.blue400}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, paddingTop:20}} >
						
						<List>
							<ListItem primaryText={<Button className={"left"} ref="schedules" onClick={(e)=>{e.preventDefault();this.props.sockets.status()}} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Refresh Status</Button>} disabled={true} insetChildren={true} />
							<Divider inset={true} />
							<ListItem 
								leftIcon={connected}
								primaryText={this.props.sockets.io.connected ? this.props.guideRefresh.download ? 'Guide data is being refreshed for ' + this.props.guideRefresh.who.join(', ') : 'Connected' : 'Disconnected'} 
								disabled={true} 
							/>
							<Divider inset={true} />
							
							<ListItem primaryText={this.props.status.account.maxLineups} secondaryText="Max Lineups" disabled={true} insetChildren={true} />
							<Divider inset={false} />
							
							<ListItem secondaryText="Available Lineups" primaryText={this.props.status.account.maxLineups - this.props.status.lineups.length} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem secondaryText="Account Expiration" primaryText={this.props.status.account.expires}  disabled={true} insetChildren={true} />
							<Divider inset={false} />
							
							<ListItem secondaryText="Notifications" primaryText={this.props.status.notifications.length === 0 ? "0" : this.props.status.notifications.length} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem secondaryText="Last data update" primaryText={this.props.status.lastDataUpdate} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem secondaryText="Agent serverID" primaryText={this.props.status.serverID} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem secondaryText="Agent Server Status" primaryText={this.props.status.systemStatus[0].status} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem secondaryText="Agent Message" primaryText={this.props.status.systemStatus[0].message} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							<ListItem style={{maxHeight:350}} primaryText={updates} disabled={true} insetChildren={true}  />
							<Divider inset={false} />
							
							
						</List>
						
						
					</CardText>
				</Card>
				<div style={{height:100}} />
			</Col>);
	}
}

