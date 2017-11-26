import React from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import { DateCell, ImageCell, LinkCell, TextCell, ChannelCheckbox } from '../../common/utils';
import sortByOrder from 'lodash.sortbyorder';
import naturalSort from 'object-property-natural-sort'

import Debug from 'debug';
let debug = Debug('epg:app:pages:tables:channels');

export default class ChannelsTable extends React.Component {
	constructor(props) {
	super(props);
		if(props.list) props.list.sort(naturalSort('channel'))
		this.state = {
			list: props.list,
			sortPath: 'channel',
			order: 'asc'
		};
		
		this.reverseOrder = this.reverseOrder.bind(this);
		this.sortHD = this.sortHD.bind(this);

	}
	
	componentWillReceiveProps(props) {
		debug('got props', this.state, props)
		if(props.list && this.state.sortPath !== 'hd') {
			this.reverseOrder(false, props.list, this.state.order);
			//this.setState(props);
		} else {
			this.sortHD(false, props.list, this.state.order);
		}
		
	}
	
	reverseOrder(e, list, order) {
		
		let path;
		
		if(e) {
			e.preventDefault();
			path = e.target.dataset.path;
		} else {
			path = this.state.sortPath;
		}
		debug('sort',  Array.isArray(list), order, path);
		if(!Array.isArray(list)) {
			 list = this.state.list;
		}
		
		order = typeof order === 'string' ? order : this.state.order === 'asc' ? 'desc':'asc';
		
		let sorted = list.sort(naturalSort(path));
		
		if (order === 'desc') sorted.reverse();
		
		debug('sort channels', sorted.map(e=>e[path]));
		this.setState({
			list : sorted,
			order: order,
			sortPath: path
		});
							 
	}
	
	sortHD(e, list, order) {
		
		if(e) {
			e.preventDefault();
		} 
		
		if(!Array.isArray(list)) {
			 list = this.state.list;
		}
		
		order = typeof order === 'string' ? order : this.state.order === 'asc' ? 'desc':'asc';
		
		this.setState({
			list : sortByOrder(list, [(n) => {
				let search = n.name ? n.name : n.callsign ? n.callsign : 'sd';
				let searchedForHD = search.toLowerCase().search('hd') > -1;
				let returnValue = searchedForHD  ? 'HD': search.toLowerCase().search('dt') > -1  ? 'HD' :'SD';
				return returnValue;
			},'channel'], order),
			order: order,
			sortPath: 'hd'
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
					maxHeight={document.body.offsetHeight - 260}
					{...this.props}
				>
					<Column
						cell={<ImageCell style={{textAlign:'center'}}  data={channels} col="stationLogo" source="channels" />}
						fixed={true}
						width={50}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}}><a href="#" data-path="active" onClick={this.reverseOrder}>Active</a></Cell>}
						cell={<ChannelCheckbox data={channels} source="Channel" col="active" { ...this.props } />}
						fixed={true}
						width={75}
						style={{textAlign:'center'}}
						allowCellsRecycling={true}
						columnKey="active"
					/>
					<Column
						columnKey="Channel"
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="channel" onClick={this.reverseOrder}>Channel</a></Cell>}
						
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="channel" />}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						columnKey="hd"
						header={<Cell style={{textAlign:'center'}} ><a href="#" onClick={this.sortHD}>HD/SD</a></Cell>}
						
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="hd" />}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="name" onClick={this.reverseOrder}>Station</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="name" />}
						fixed={false}
						width={200}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="callsign" onClick={this.reverseOrder}>Callsign</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="callsign" />}
						fixed={false}
						width={150}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="affiliate" onClick={this.reverseOrder}>Affiliate</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="affiliate" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="uhfVhf" onClick={this.reverseOrder}>uhfVhf</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="uhfVhf" />}
						width={75}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="atscMajor" onClick={this.reverseOrder}>atscMajor</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="atscMajor" />}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="atscMinor" onClick={this.reverseOrder}>atscMinor</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={channels} source="channels" col="atscMinor" />}
						width={100}
						allowCellsRecycling={true}
					/>
					
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="providerCallsign" onClick={this.reverseOrder}>providerCallsign</a></Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={channels} source="channels" col="providerCallsign" />}
						width={100}
						allowCellsRecycling={true}
					/>
				</Table>
			</div>
		);
	}
	
}
