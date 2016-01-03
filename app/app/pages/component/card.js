import React from 'react';
import Debug from 'debug'
import Gab from '../../common/gab'
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardTitle from 'material-ui/lib/card/card-title';
import FlatButton from 'material-ui/lib/flat-button';
import CardText from 'material-ui/lib/card/card-text';

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

