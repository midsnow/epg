import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import _ from 'lodash';

import debugging from 'debug';
let	debug = debugging('epg:client:common:alert');
let Alerter = Alert;

var Alerts = React.createClass({
	
	getInitialState: function() {
		return {
			alertVisible: true
		};
	},
	getDefaultProps: function() {
		return { 
			style: 'danger',
			html: 'error with the alert.  This is placeholder text.',
			dismiss: false,
			data: false
		}
	},
	componentDidMount: function() {
		//this.getStreams();
	},
	componentWillMount: function() {
		
	},
	componentWillReceiveProps: function(props) {
		//debug('receive props',props)
		/*
			*/	
		return false;
	},
	renderError(data) {
		try {
			var myerror = JSON.stringify(data.error, null, 4);
			var myrequest = JSON.stringify(data.received, null, 4);
		} catch(e) {
			var myerror = 'I encountered an error. Please check the console for the error object';
			var myrequest = ''; 
			debug(data);
		}
		var senderror = (<div>
			<div>ERROR</div>
			<pre>{myerror}</pre>
			<div>REQUEST</div>
			<pre>{myrequest}</pre>
		</div>);
		return senderror;
	},
	renderSuccess(data) {
		return data;
	},
	renderHTML() {
		if(this.props.data) {
			if(this.props.data.error) {
				return this.renderError(this.props.data);
			}
			return this.renderSuccess(this.props.data);
		} else if(this.props.component) {
			return this.props.component;
		} else {
			return <div dangerouslySetInnerHTML={{__html:this.props.html}} />
		}
	},
	render() {
		if (this.state.alertVisible) {
			return (
				<Alerter bsStyle={this.props.style} onDismiss={this.handleAlertDismiss}>
					{this.renderHTML()}
					<div className="clearfix" />
				</Alerter>
			);
		}

		return (
			<span />
		);
	},

	handleAlertDismiss() {
		this.setState({alertVisible: false});
		if(_.isFunction(this.props.dismiss)) {
			this.props.dismiss();
		}
	},

	handleAlertShow() {
		this.setState({alertVisible: true});
	}
	
	
	
});

export default Alerts;
