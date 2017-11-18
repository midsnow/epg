import React from 'react';
import Debug from 'debug'
import Gab from '../../common/gab'
import FlatButton from 'material-ui/FlatButton';
import CardText from 'material-ui/Card/CardText';
import Card from 'material-ui/Card/Card';
import CardActions from 'material-ui/Card/CardActions';
import CardHeader from 'material-ui/Card/CardHeader';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';

let debug = Debug('epg:app:pages:component:card');
		
export default class myCard extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Card Component'	
		this.state = {
			html: props.children || props.html || <span />
		}
		this._update = false
		//debug('Card');
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps');
		this.setState({html: props.children || props.html});
		this._update = true;
	}
	componentDidUpdate() {
		debug('didUpdate');
	}
	componentDidMount() {
		debug('did mount');
		
	}
	render() {
		debug('any', this.state);
		let content;
		if('function' === typeof this.state.html) {
			
			// render a component
			content = (<div> <this.state.html /> </div>);
		
		} else if('object' === typeof this.state.html) {
			
			// this is a rendered componenet
			content = (<div> {this.state.html} </div>);
			
		} else {
			debug('any leftover', this.state);
			// add anything else
			content = (<div dangerouslySetInnerHTML={{ __html: this.state.html }} />)
			
		}
		return (<Card>
			<CardTitle title={this.props.title} subtitle={this.props.subtitle} />
			<CardActions>
				<FlatButton label="Action1"/>
				<FlatButton label="Action2"/>
			</CardActions>
			<CardText>
				{content}
			</CardText>
		</Card>);
	}
}

