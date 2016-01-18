import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon } from '../common/utils';
import { Divider, FontIcon, Styles, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui/lib';
import { Col } from 'react-bootstrap';

let debug = Debug('epg:app:pages:disconnect');
		
export default class Disconnect extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Disconnect Component'	
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
		debug('disconnect render', this.state, this.props);
		if(this.props.sockets.io.connected) {
			return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} ><Card>
					<CardTitle 
						title={"Server Connected"}
						subtitle={"The agent is currently responding to socket requests"}
						titleColor={Styles.Colors.green600}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
						<div className="" style={{color:Styles.Colors.grey600, fontSize:'76px', padding:0, height:100, paddingTop:0, paddingBottom:30}}>
							<FontIcon style={{fontSize:'128px'}} className="material-icons" color={Styles.Colors.green600} hoverColor={Styles.Colors.blue600} >cloud_done</FontIcon>
						</div>
						<div style={{marginBottom:30}} />
						<p>No problems here.</p>
						<p><a href="#" onClick={(e)=>{e.preventDefault();window.history.back();}}>Previous Page</a></p>
					</CardText>
				</Card></Col>);
		} else {
			return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} ><Card>
					<CardTitle 
						title={"Server Connection Issues"}
						subtitle={"The agent is currently not responding to socket requests"}
						titleColor={Styles.Colors.red600}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
						<div className="" style={{color:Styles.Colors.grey600, fontSize:'76px', padding:0, height:100, paddingTop:0, paddingBottom:30}}>
							<FontIcon style={{fontSize:'128px'}} className="material-icons" color={Styles.Colors.red600} hoverColor={Styles.Colors.amber500} >cloud_off</FontIcon>
						</div>
						<div style={{marginBottom:30}} />
						<p>The main server is not responding to connection requests. <br /> The App Bar will return to normal when the issue is resolved.</p>
						<p><a href="#" onClick={(e)=>{e.preventDefault();window.history.back();}}>Previous Page</a></p>
					</CardText>
				</Card></Col>);
		}
			
	}
}

