import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab';
import Styles from '../common/styles';
import { pickIcon } from '../common/utils';
import { Divider, FontIcon, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui';
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
		
		return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} ><Card>
					<CardTitle 
						title={"404"}
						subtitle={"The requested headend could not be found"}
						titleColor={Styles.Colors.red600}
						subtitleColor={Styles.Colors.grey500}
					/>
					<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
						<div className="" style={{color:Styles.Colors.grey600, fontSize:'76px', padding:0, height:100, paddingTop:0, paddingBottom:30}}>
							<FontIcon style={{fontSize:'128px'}} className="material-icons" color={Styles.Colors.red600} hoverColor={Styles.Colors.amber500} >error</FontIcon>
						</div>
						<div style={{marginBottom:30}} />
						<p>The page or lineup you requested is not valid.</p>
						<p><a href="#" onClick={(e)=>{e.preventDefault();window.history.back();}}>Previous Page</a></p>
					</CardText>
				</Card></Col>);
	}
}

