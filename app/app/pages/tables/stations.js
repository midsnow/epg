import React from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import { DateCell, ImageCell, LinkCell, TextCell } from '../../common/utils';
import { Checkbox, FontIcon, Styles } from 'material-ui/lib';


export default class StationsTable extends React.Component {
	constructor(props) {
	super(props);
		this.state = {
			list: props.list
		};
	}

	render() {
		
		let 
		stations = this.state.list;
		
		return (
			<div style={{margin:'0 auto'}} >
				<Table
					rowHeight={40}
					headerHeight={40}
					rowsCount={stations.length}
					width={document.body.offsetWidth - 30}
					maxHeight={document.body.offsetHeight - 200}
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
							
							let first = this.state.lineupMap.stations[data[rowIndex].stationID].channel;
							
							let channel = this.state.lineupMap.channels[first];
							
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
						columnKey="Callsign"
						header={<Cell>Callsign</Cell>}
						cell={<TextCell data={stations} source="stations" col="callsign" />}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						columnKey="Channel"
						header={<Cell>Channel</Cell>}
						
						cell={({ rowIndex }) => {
							
							let data = stations;
							
							let station = this.state.lineupMap.stations[data[rowIndex].stationID];
							
							return (<Cell >
								{station.channel}
							</Cell>);
						}}
						fixed={true}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell  style={{textAlign:'center'}}>Name</Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="name" />}
						fixed={false}
						width={200}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell  style={{textAlign:'center'}}>Affiliate</Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="affiliate" />}
						fixed={false}
						width={100}
						allowCellsRecycling={true}
					/>
					<Column
						header={<Cell  style={{textAlign:'center'}}>Station ID</Cell>}
						cell={<TextCell  style={{textAlign:'center'}} data={stations} source="stations" col="stationID" />}
						fixed={false}
						width={75}
						allowCellsRecycling={true}
					/>
				</Table>
			</div>
		);
	}
	
}
