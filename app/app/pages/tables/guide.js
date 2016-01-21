import React from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import { clickButton, iButton, DateCell, ImageCell, LinkCell, TextCell } from '../../common/utils';
import { Checkbox, FontIcon, Styles } from 'material-ui/lib';
import { sortByOrder } from 'lodash';
import naturalSort from 'object-property-natural-sort'

import Debug from 'debug';
let debug = Debug('epg:app:pages:guide:table');

export default class GuideTable extends React.Component {
	constructor(props) {
	super(props);
		if(props.list) props.list.sort(naturalSort('channel'))
		this.state = {
			list: props.list || [],
			guide: props.guide || {},
			order: 'asc',
			sortPath: 'channel'
		};
		
		this.reverseOrder = this.reverseOrder.bind(this);
		this.sortHD = this.sortHD.bind(this);
		
	}
	
	componentWillReceiveProps(props) {
		debug('got props', this.state, props)
		if(props.list && this.state.sortPath !== 'hd') {
			this.reverseOrder(false, props.list, this.state.order);
		
		} else {
			this.sortHD(false, props.list, this.state.order);
		}
		if(props.guide) {
			this.setState({
				guide: props.guide
			});
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
		let guide = this.state.guide;
		let channels = this.state.list
		debug('render guide table', guide, channels, channels.length);
		return (
			<div style={{margin:'0 auto'}} >
				<Table
					rowHeight={40}
					headerHeight={40}
					rowsCount={channels.length}
					width={document.body.offsetWidth}
					height={document.body.offsetHeight}
					{...this.props}
				>
					<Column
						cell={<ImageCell data={channels} col="logo" source="channels" />}
						fixed={true}
						width={50}
						allowCellsRecycling={true}
						header={<Cell>
							<div className="col-xs-2 no-padding" style={{cursor:'pointer',padding:5}}>
								{clickButton(this.props.handleLeftNav, {
									className: "material-icons",
									style: {fontSize:'18px'},
									color: Styles.Colors.grey200,
									hoverColor: Styles.Colors.amber900,
									title: 'Menu',
									dataIcon: 'menu'
								})}
							</div>
							<div className="col-xs-10 no-padding" onClick={(e)=>{this.flickMe(e, 'down')}} style={{cursor:'pointer',backgroundColor: Styles.Colors.grey700,padding:5}}>
								{clickButton((e)=>{this.flickMe(e, 'down')} ,{
									className: "material-icons",
									style: {fontSize:'24px'},
									color: Styles.Colors.grey200,
									hoverColor: Styles.Colors.amber900,
									title: 'Prev Channels',
									dataIcon: 'arrow_drop_up'
								})}
							</div>
						</Cell>}
						footer={<Cell>
							<div className="col-xs-2 no-padding" style={{cursor:'pointer',padding:5}}>
								{clickButton(()=>{
									this.props.goTo({
										
										page: 'lineup',
										child: '',
										lineup: this.props.lineup,
										
									});
								},{
									className: "material-icons",
									style: {fontSize:'20px'},
									color: Styles.Colors.grey400,
									hoverColor: Styles.Colors.amber600,
									title: 'Settings',
									dataIcon: 'settings'
								})}
							</div>
							<div className="col-xs-10 no-padding" onClick={this.flickMe} style={{cursor:'pointer',backgroundColor: Styles.Colors.grey700,padding:5}}>
								{clickButton(this.flickMe,{
									className: "material-icons",
									style: {fontSize:'24px'},
									color: Styles.Colors.grey400,
									hoverColor: Styles.Colors.amber600,
									title: 'Next Channels',
									dataIcon: 'arrow_drop_down'
								})}
							</div>
						
						</Cell>}
					/>
					
					
				</Table>
			</div>
		);
	}
	
}
