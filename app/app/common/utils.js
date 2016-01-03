import ProgressButton from 'react-progress-button';
import React from 'react';
import { Cell } from 'fixed-data-table';
import { Styles, Checkbox } from 'material-ui/lib';
import { FontIcon } from 'material-ui/lib';

import debugging from 'debug';
let	debug = debugging('epg:client:common:utils');

export const Button = ProgressButton;

export const pickIcon = function pickIcon(text) {
	if(text.toLowerCase() === 'cable') {
		return 'tv';
	} else if(text.toLowerCase() === 'satellite') {
		return 'router';
	} else if(text.toLowerCase() === 'antenna') {
		return 'settings_input_antenna';
	} else  {
		return 'tv';
	} 
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
			
	let val = data[rowIndex][col];
				
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
			unCheckedIcon={<FontIcon className="material-icons" color={Styles.Colors.grey300}  >visibility</FontIcon>}
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
