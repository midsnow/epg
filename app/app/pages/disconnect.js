import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon } from '../common/utils';
import { CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui/lib/card';
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
		
		return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} >
			<Card>
				
				<CardText>
					<div style={{margin:'100 0',fontWeight:'bold'}} >
						The main server is not responding to connection requests.  The App Bar will return to normal when the issue is resolved.
					</div>
				</CardText>
			</Card>
		</Col>);
	}
}

