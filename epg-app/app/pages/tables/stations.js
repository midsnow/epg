import React from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import { DateCell, ImageCell, LinkCell, TextCell } from '../../common/utils';
import { Checkbox, FontIcon } from 'material-ui';
import { sortByOrder } from 'lodash';
import naturalSort from 'object-property-natural-sort'
import Styles from '../../common/styles';
import Debug from 'debug';
let debug = Debug('epg:app:pages:tables:stations');

export default class StationsTable extends React.Component {
	constructor(props) {
	super(props);
		if(props.list) props.list.sort(naturalSort('name'))
		this.state = {
			list: props.list,
			order: 'asc',
			sortPath: 'name'
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
		debug('sort', Array.isArray(list), order, path);
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
			},'name'], order),
			order: order,
			sortPath: 'hd'
		});
							 
	}
	
	render() {
		let stations = this.state.list;
		
		return (
			<div style={{margin:'0 auto'}} >
				<Table
					rowHeight={40}
					headerHeight={40}
					rowsCount={stations.length}
					width={document.body.offsetWidth - 30}
					maxHeight={document.body.offsetHeight - 260}
					style={{ background: 'transparent' }}
					{...this.props}
				>
					<Column
						cell={<ImageCell data={stations} col="logo" source="channels" />}
						fixed={true}
						width={50}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell>Active</Cell>}
						cell={({ rowIndex }) => {
							
							let data = stations;
							let col = 'active';
							
							let first = this.props.lineupMap.stations[data[rowIndex].stationID].channel;
							
							let channel = this.props.lineupMap.channels[first];
							
							let val = !!channel[col];
										
							return (<Cell style={{textAlign:'center'}} >
								<Checkbox
									name={col+rowIndex}
									value={""+val}
									defaultChecked={val}
									checkedIcon={<FontIcon className="material-icons" color={Styles.Colors.green500} >visibility</FontIcon>}
									unCheckedIcon={<FontIcon className="material-icons" color={Styles.Colors.grey300} >visibility</FontIcon>}
									onCheck={(e) => {
										debug('update ', data[rowIndex]);
										this.props.sockets['updateChannel'](channel, { [col]: !val });
									}}
								/>
							</Cell>);
						}}
						fixed={true}
						width={75}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell style={{textAlign:'center'}} ><a href="#" data-path="name"  onClick={this.reverseOrder}>Name</a></Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="name" />}
						fixed={true}
						width={200}
						allowCellsRecycling={true}
					/>
					
					<Column
						columnKey="Channel"
						header={<Cell style={{textAlign:'center'}}>Channel</Cell>}
						
						cell={({ rowIndex }) => {
							
							let data = stations;
							
							let station = this.props.lineupMap.stations[data[rowIndex].stationID];
							
							return (<Cell  style={{textAlign:'center'}}>
								{station.channel}
							</Cell>);
						}}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						columnKey="Callsign"
						header={<Cell style={{textAlign:'center'}}><a href="#" data-path="callsign" onClick={this.reverseOrder}>Callsign</a></Cell>}
						cell={<TextCell style={{textAlign:'center'}} data={stations} source="stations" col="callsign" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						columnKey="hd"
						header={<Cell style={{textAlign:'center'}} ><a href="#" onClick={this.sortHD}>HD/SD</a></Cell>}
						
						cell={<TextCell style={{textAlign:'center'}} data={stations} source="channels" col="hd" />}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell  style={{textAlign:'center'}}><a href="#" data-path="affiliate" onClick={this.reverseOrder}>Affiliate</a></Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="affiliate" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell  style={{textAlign:'center'}}><a href="#" data-path="stationID" onClick={this.reverseOrder}>Station ID</a></Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="stationID" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
				</Table>
			</div>
		);
	}
	
}
