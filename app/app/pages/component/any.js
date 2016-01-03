import React from 'react';
import Debug from 'debug'
import Gab from '../../common/gab'

let debug = Debug('epg:app:pages:component:any');
		
export default class Any extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Any Component'	
		this.state = {
			html: props.children || props.html || <span />
		}
		this._update = false
		debug('Any');
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
		if('function' === typeof this.state.html) {
			
			// render a component
			return  (<div> <this.state.html /> </div>);
		
		} else if('object' === typeof this.state.html) {
			
			// this is a rendered componenet
			return  (<div> {this.state.html} </div>);
			
		} else {
			debug('any leftover', this.state);
			// add anything else
			return (<div dangerouslySetInnerHTML={{ __html: this.state.html }} />)
			
		}
	}
}

