import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { pickIcon } from '../common/utils';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardTitle from 'material-ui/lib/card/card-title';
import { Styles, List, ListItem, FlatButton, FontIcon } from 'material-ui/lib';
import Menu from 'material-ui/lib/menus/menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Divider from 'material-ui/lib/divider';
import CardText from 'material-ui/lib/card/card-text';
import { Col } from 'react-bootstrap';
import Icons from '../assets/icons';

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
		debug('receiveProps');
		this._update = true;
	}
	componentDidUpdate() {
		debug('didUpdate');
	}
	componentDidMount() {
		debug('did mount');
		
	}
	render() {
		debug('home render', this.state, this.props);
		
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
							page: 'lineup',
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
		
		
		let content = (<div>
			<List>
				<ListItem  primaryText="Add Lineup" secondaryText={this.props.status.account.maxLineups - this.props.status.lineups.length + " of " + this.props.status.account.maxLineups + " lineups available."} leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue500} hoverColor={Styles.Colors.greenA200} >plus_one</FontIcon>} onTouchTap={(e) => {
					e.preventDefault(e);
					this.props.goTo({
						page: 'add-lineup',
						child: ''
					
					});
				}} />
				<ListItem  onTouchTap={()=>{this.goTo('home')}} primaryText="Settings" secondaryText="misc options" leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue500} hoverColor={Styles.Colors.greenA200} >settings_applications</FontIcon>} />
			</List>
			<List subheader="My Lineups">
				{mylineups}
			</List>
		</div>);
		
		return (<Col xs={12} md={8} mdOffset={2} lg={6} lgOffset={3} >
			<Card>
				
				<CardText>
					{content}
				</CardText>
			</Card>
		</Col>);
	}
}

