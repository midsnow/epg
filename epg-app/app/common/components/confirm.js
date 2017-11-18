import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import debugging from 'debug';
let	debug = debugging('epg:app:common:components:confirm');

export default class Modal extends React.Component {
	constructor(props) {
		super(props);
		
		
		this.handleYes = this.handleYes.bind(this);
		this.handleNo = this.handleNo.bind(this);
	}
	
	handleYes() {
		if(typeof this.props.answer == 'function') {
			this.props.answer(true);
		}
	}
	
	handleNo() {
		if(typeof this.props.answer == 'function') {
			this.props.answer(false);
		}
	}
	
	render() {
		const actions = [
			
			<FlatButton
				label={this.props.yesText}
				primary={true}
				onTouchTap={this.handleYes} 
			/>,
			<FlatButton
				label={this.props.noText}
				secondary={true}
				onTouchTap={this.handleNo} 
			/>,
		];

		return (
			<div>
				
				<Dialog
					title={this.props.title}
					actions={actions}
					modal={true}
					open={this.props.open}
				>
					
					<div dangerouslySetInnerHTML={{__html:this.props.html}} />
				
				</Dialog>
			</div>
		);
	}
}

Modal.defaultProps = {
	yesText: 'Delete',
	noText: 'Cancel',
	open: false,
	html: 'Placeholder Text',
	title: 'Confirm',
};
