import ProgressButton from 'react-progress-button';
import React from 'react';
import Styles from './styles';
import { Cell } from 'fixed-data-table';
import { Checkbox } from 'material-ui';
import { FontIcon, IconButton } from 'material-ui';
import debugging from 'debug';
let	debug = debugging('epg:client:common:utils');
import Visibility from 'material-ui/svg-icons/action/visibility';
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off';

export let Request = function ( props, emitTo, list = 'woobi' ) {
	debug('Send request ', list, props, this.state);
	return this.state.Sockets.grab(Object.assign({ 
		list,
		action: 'find',
		limit: 20,
		skip: 0,
	}, props), emitTo);
	
	return true; 
}

export const Button = ProgressButton;

export class iButton extends React.Component {
	constructor(props){
		super(props);
	}
	render() {
		debug('render iconButton');
		return <IconButton onClick={this.props.clickOn} ><FontIcon { ...this.props } >{this.props.dataIcon}</FontIcon></IconButton>;
	}
}

export const clickButton = function(onClick, opts) {
	return <FontIcon  onClick={onClick} { ...opts } >{opts.dataIcon}</FontIcon>;
}

export const pickIcon = function pickIcon( text = 'cable' ) {
	text = text || '';
	if(text.toLowerCase() === 'cable') {
		return 'tv';
	} else if(text.toLowerCase() === 'satellite') {
		return 'satellite';
	} else if(text.toLowerCase() === 'antenna') {
		return 'settings_input_antenna';
	} else  {
		return 'tv';
	} 
}

export const setChannelKey = function(v) {
	if(!v || typeof v !== 'object') {
		return 'undefined';
	}
	if(v.atscMajor) {
		return v.atscMajor + '-' + v.atscMinor;
	} 
	if(v.channel) {
		return v.channel;
	}
	if(v.frequencyHz && v.serviceID) {
		return v.serviceID;
	}
	if(v.uhfVhf) {
		return v.uhfVhf;
	}
	
	debug('no channel', v)
	return false;
}


export const DateCell = ({rowIndex, data, col, ...props}) => {
	let val = data[rowIndex][col];
	return (<Cell {...props}>
		{val}
	</Cell>);
}
export const ImageCell = ({rowIndex, data, col, ...props}) => {
	let val = data[rowIndex][col];
	let logo = <FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >tv</FontIcon>;
	if(val) {
		logo = <div style={{width:'100%',height:'100%',backgroundSize:'contain',backgroundImage:'url('+val.URL+')',backgroundRepeat:'no-repeat',backgroundPosition:'center'}} />
	}
	return (logo);
};

export const LinkCell = ({rowIndex, data, col, ...props}) => {
	let val = data[rowIndex][col];
	return (<Cell {...props}>
		<a href="#">{val}</a>
	</Cell>);
}
export const TextCell = ({rowIndex, data, col, ...props}) => {
			
	let val;

	if(col === 'hd') {
		let search = data[rowIndex].name ? data[rowIndex].name : data[rowIndex].callsign ? data[rowIndex].callsign : 'sd';
		val = search.toLowerCase().search('hd') > -1  ? 'HD': search.toLowerCase().search('dt') > -1  ? 'HD' :'SD';
	} else {
		val = data[rowIndex][col];
	}
				
	return (<Cell {...props}>
		{val}
	</Cell>);
}

export const ChannelCheckbox = ({rowIndex, data, col, ...props}) => {
	// for channels only		
	let val = !!data[rowIndex][col];
				
	return (<Cell {...props} style={{textAlign:'center'}} >
		<Checkbox
			name={col+rowIndex}
			value={""+val}
			defaultChecked={val}
			checkedIcon={<FontIcon className="material-icons" color={Styles.Colors.green400} >visibility</FontIcon>}
			unCheckedIcon={<FontIcon className="material-icons" color={Styles.Colors.grey300}  >visibility_off</FontIcon>}
			onCheck={(e) => {
				debug('update ', props.source, data[rowIndex]);
				// we cheat here and mutate the state object...
				// our update listener should fix the state quickly
				data[rowIndex][col] = !val;
				props.sockets['update' + props.source](data[rowIndex], { [col]: !val });
			}}
		/>
	</Cell>);
}


