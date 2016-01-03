import React from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import { DateCell, ImageCell, LinkCell, TextCell, ChannelCheckbox } from '../../common/utils';

import Debug from 'debug';
let debug = Debug('epg:app:pages:tables/channels');

export default class ChannelsTable extends React.Component {
	constructor(props) {
	super(props);
		this.state = {
			list: props.list
		};
		
		this.reverseChannels = this.reverseChannels.bind(this);


	}
	
	componentWillReceiveProps(props) {
		this.setState(props);
	}
	
	reverseChannels(e) {
		
		e.preventDefault();
		debug('reverse');
		this.setState({
			list : this.state.list.reverse(),
		});
							 
	}
	
	render() {
		debug('render channels table', 'props', this.props);
		let channels = this.state.list;
		
		return (
			<div style={{margin:'0 auto'}} >
				 <Table
					rowHeight={40}
					headerHeight={40}
					rowsCount={channels.length}
					width={document.body.offsetWidth - 30}
					maxHeight={document.body.offsetHeight - 275}
					{...this.props}
				>
					<Column
						cell={<ImageCell style={{textAlign:'center'}}  data={channels} col="logo" source="channels" />}
						fixed={true}
						width={50}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} >Active</Cell>}
						cell={<ChannelCheckbox data={channels} source="Channel" col="active" { ...this.props } />}
						fixed={true}
						width={75}
						style={{textAlign:'center'}}
						allowCellsRecycling={true}
						columnKey="active"
					/>
					<Column
						columnKey="Channel"
						header={<Cell style={{textAlign:'center'}} ><a href="#" onClick={this.reverseChannels}>Channel</a></Cell>}
						
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="channel" />}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>Station</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="name" />}
						fixed={false}
						width={200}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>Callsign</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="callsign" />}
						fixed={false}
						width={150}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>Affiliate</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="affiliate" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>uhfVhf</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="uhfVhf" />}
						width={75}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>atscMajor</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="atscMajor" />}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}>atscMinor</Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="atscMinor" />}
						width={100}
						allowCellsRecycling={true}
					/>
					
					<Column
						header={<Cell style={{textAlign:'center'}}>providerCallsign</Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={channels} source="channels" col="providerCallsign" />}
						width={100}
						allowCellsRecycling={true}
					/>
				</Table>
			</div>
		);
	}
	
}
