import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon } from '../common/utils';
import Card from 'material-ui/Card/Card';
import CardActions from 'material-ui/Card/CardActions';
import CardHeader from 'material-ui/Card/CardHeader';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import FlatButton from 'material-ui/FlatButton';
import FontIcon from 'material-ui/FontIcon';
import Menu from 'material-ui/Menu/Menu';
import MenuItem from 'material-ui/MenuItem/MenuItem';
import Divider from 'material-ui/Divider';
import CardText from 'material-ui/Card/CardText';
import Col from 'react-bootstrap/lib/Col';
import Icons from '../assets/icons';
import Styles from '../common/styles';

let debug = Debug('epg:app:pages:home');
		
export default class Home extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Home Component'	
		this.state = {
			
		}
		this._update = false
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps getLineups', props.lineups.lineups.length);
		if ( props.lineups.lineups.length === 0 && props.status.lineups.length > 0 ) {
			debug('receiveProps getLineups');
			Gab.emit('getLineups');
		}
		this._update = true;
	}
	componentDidUpdate() {
		debug('didUpdate');
	}
	componentDidMount() {
		debug('did mount');
		if ( this.props.lineups.lineups.length === 0 ) {
			debug('receiveProps getLineups');
			Gab.emit('getLineups');
		}
	}
	render() {
		debug('home render', this.state, this.props);
		
		let status = this.props.status || {};	
		
		status.account = this.props.status.account || {};	
		
		let mylineups = this.props.lineups.lineups.map((v) => {
			return (
				<span key={v.lineup+'home'} ><ListItem 
					key={v.lineup+'home'} 
					style={{fontSize:'16px'}} 
					primaryText={v.name} 
					secondaryText={v.lineup} 
					leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >{pickIcon(v.transport)}</FontIcon>}
					onTouchTap={(e) => {
						e.preventDefault(e);
						this.props.goTo({
							current: v,
							page: v.name,
							path: 'lineup',
							child: '',
							lineup: v.lineup,
							newalert: {
								show: true,
								html: 'Manage '+ v.name,
								style: 'info',
								duration: 2500,
							}
						});
					}}
					
				/>
				</span>
			);
		});
		const num = {
			1: "one",
			2: 'two',
			3: 'three',
			4: 'four',
			5: 'five',
			5: 'six',
			7: 'seven',
			8: 'eight'
		}
		
		let content = (<div>
			<List subHeader="My Lineups">
				{mylineups}
			</List>
			<List>
				<ListItem  primaryText="Add Lineup" secondaryText={status.account.maxLineups - status.lineups.length + " of " + status.account.maxLineups + " lineups available."} leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue500} hoverColor={Styles.Colors.greenA200} >{"plus_one"}</FontIcon>} onTouchTap={(e) => {
					e.preventDefault(e);
					this.props.goTo({
						page: 'Add Lineup',
						path: 'add-lineup',
						child: ''
					
					});
				}} />
				
				
			</List>
			
			
		</div>);
		
		return (<Col xs={12} md={9} mdOffset={1} lg={8} lgOffset={2} >
				<CardText>
					{content}
				</CardText>
		</Col>);
	}
}

