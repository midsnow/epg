import React from 'react';
import Debug from 'debug'
import { Styles } from '../styles';
import ArrowDropRight from 'material-ui/svg-icons/navigation-arrow-drop-right';

import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import FontIcon from 'material-ui/FontIcon';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import Divider from 'material-ui/Divider';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

let debug = Debug('epg:app:common:components:mainMenu'); 

export default class mainMenu extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'mainMenu Component'	
		this.state = {
			page: props.page,
			leftNav: props.leftNav
		};
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		debug("## componentWillReceiveProps ## mainMenu WillReceiveProps", props.leftNav !== this.state.leftNav, props.update, this.state.page !== props.page);
		if(props.leftNav !== this.state.leftNav || props.update || this.state.page !== props.page) {
			this._update = true;
			this.setState({
				page: props.page,
				leftNav: props.leftNav
			});
			return;
		}
		
	}
	
	shouldComponentUpdate(nextProps) {
		debug('## shouldComponentUpdate ## mainMenu should update? ', this._update);
		if(this._update  || this.props.currentTheme !== nextProps.currentTheme) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	toggleDrawer() {
		
	}

	render() {
		debug('## RENDER ## mainMenu render', this.props);
		
		let mylineups = this.props.lineups.lineups.map((v) => {
			return (
				<MenuItem 
					key={v.lineup+'1'} 
					className="fixmenuleft"
					style={{fontSize:'12px', marginLeft:0}} 
					primaryText={v.name} 
					secondaryText={<span style={{fontSize:'11px'}}>{v.lineup}</span>}
					onClick={(e) => {
						e.preventDefault(e);
						this.props.goTo({
							page: 'Schedule',
							path: '/epg/lineup',
							lineup: v.lineup,
							current: v,
							newalert: {
								show: true,
								html: 'Manage '+ v.name,
								style: 'info',
								duration: 2500,
							}
						});
					}}
				/>
			);
		});
		
		let menu = 	(<div id="MENU" style={{ paddingTop: 20 }}>
			
			<Menu >
				<MenuItem
					primaryText="My Schedules"
					primaryTogglesNestedList={true}
					leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >tv</FontIcon>}
					initiallyOpen={false}
					nestedItems={mylineups}
				/>				
			</Menu>
		</div>);
		
		let page = this.props.anchor || this.props.page;
		
		let menuItems = []; 

        let LeftDrawer = (
			<Drawer 
				zDepth={5}
				docked={false}
				open={this.state.leftNav}
				style={{ zIndex: 1300 }}
				containerStyle={{ zIndex: 1300 }}
				openSecondary={false}
				width={225}
				onRequestChange={open => {
					debug('## RENDER ## mainMenu request change', open, this.props);
					this._update = true;
					this.props.appState({ leftNav: open });
				}}
			>
				<div className="" style={{
					height: 50,
					width: '100%',
					overflow: 'hidden',
					bottom: 0,
					left: 0,
					position: 'absolute',
					borderLeft: '10px solid ' + this.props.theme.baseTheme.palette.canvasColor
				}} >
					
					<div style={{float:'left',width:'33%', textAlign: 'center'}}>
						<IconButton 
							title="Home"
							onClick={(e)=>{
								e.preventDefault();
								this.props.goTo({page: 'Home', path: '/epg/home'});
							}} 
						>
							<FontIcon 
								className="material-icons" 
								hoverColor={Styles.Colors.limeA400} 
								color={this.props.theme.appBar.buttonColor || 'initial'} 
							> 
								home
							</FontIcon>
						</IconButton>
					</div>
					<div style={{float:'left',width:'33%', textAlign: 'center'}}>
						<IconButton title="Status" onClick={(e)=>{e.preventDefault();this.props.goTo({ page: 'Status', path: '/epg/status' });}} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.appBar.buttonColor || 'initial'} >router</FontIcon></IconButton>
					</div>
					<div style={{float:'left',width:'34%', textAlign: 'center', paddingTop: 12}}>
						<IconMenu
							title="Change Theme"
							iconButtonElement={<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.props.theme.appBar.buttonColor || 'initial'} style={{cursor:'pointer'}}>invert_colors</FontIcon>}
							onItemTouchTap={(e, val) => {
								debug('clecked switch theme link', e, val);
								this.props.switchTheme(val.props.value, true, false, true);
							}}
							useLayerForClickAway={true}
							menuStyle={{}}
						>
						  <MenuItem style={{lineHeight: 2}} primaryText="Default" value="default" />
						  <MenuItem style={{lineHeight: 2}} primaryText="Ocean" value="blue"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Purple" value="purple"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Woobi" value="woobi"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Light" value="light" />
						  <MenuItem style={{lineHeight: 2}} primaryText="Blue" value="nitelite3"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Night" value="night"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Graphite" value="graphite"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Nitelite" value="nitelite"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Orange" value="nitelite2"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Other" value="nitelite4"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Cream" value="cream" />
						</IconMenu>
					</div>
				</div>
				<div className="menu" style={{
					height: '100%',
					width: '100%',
					overflow: 'hidden',
					paddingTop: 25,
					marginTop: 0,
					borderLeft: '10px solid ' + this.props.theme.baseTheme.palette.canvasColor
				}} >	
					<div style={{ position: 'absolute', height: 25, width: 25, right: 0, top: 0 }} >
						<div style={{ float:'right' }} >
							<IconButton title="Close" onClick={(e)=>{e.preventDefault();this.props.handleLeftNav();}} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'18px'}}  color={this.props.theme.appBar.buttonColor || 'initial'} >close</FontIcon></IconButton>
						</div>
					</div>
					<Menu desktop={false} >
					
					<MenuItem
						primaryText="My Schedules"
						leftIcon={<FontIcon className="material-icons"  >tv</FontIcon>}
						desktop={false} 
						onTouchTap={()=>{
							this.props.goTo({ 
								page: 'My Schedules', 
								path: '/epg/home' 
							})
						}} 
					/>
					
					<MenuItem 
						desktop={false}
						primaryText="TV Channels" 
						leftIcon={<FontIcon className="material-icons">tv</FontIcon>} 
						onClick={(e) => {
							e.preventDefault(e);
							this.props.goTo({
								page: 'TV Channels',
								path: '/tv/channels',
							}, {}, () => { this.toggleDrawer(false, false) });
						}}
						style={{}}
						href="/noscript/tv/channels"
					/>	
					
					<MenuItem 
						desktop={false}
						primaryText="Guide" 
						leftIcon={<FontIcon className="material-icons">dvr</FontIcon>} 
						onClick={(e) => {
							e.preventDefault(e);
							this.props.goTo({
								page: 'Episode Program Guide',
								path: '/tv/guide',
							}, {}, () => { this.toggleDrawer(false, false) });
						}}
						style={{}}
						href="/noscript/tv/guide"
					/>
				
					<MenuItem 
						desktop={true}
						primaryText="Scheduled" 
						leftIcon={<FontIcon className="material-icons">fiber_dvr</FontIcon>} 
						onClick={(e) => {
							e.preventDefault(e);
							this.props.goTo({
								page: 'Scheduled',
								path: '/tv/scheduled',
							}, {}, () => { this.toggleDrawer(false, false) });
						}}
						style={{}}
						href="/noscript/tv/scheduled"
					/>
					
					<MenuItem 
						desktop={true}
						primaryText="Season Passes" 
						leftIcon={<FontIcon className="material-icons">fiber_dvr</FontIcon>} 
						onClick={(e) => {
							e.preventDefault(e);
							this.props.goTo({
								page: 'Season Passes',
								path: '/tv/season-passes',
							}, {}, () => { this.toggleDrawer(false, false) });
						}}
						style={{}}
						href="/noscript/tv/season-passes"
					/>
					
					<MenuItem 
						desktop={true}
						primaryText="Recordings" 
						leftIcon={<FontIcon className="material-icons">play_circle_filled</FontIcon>} 
						onClick={(e) => {
							e.preventDefault(e);
							this.props.goTo({
								page: 'Recordings',
								path: '/tv/recordings',
							}, {}, () => { this.toggleDrawer(false, false) });
						}}
						style={{}}
						href="/noscript/tv/recordings"
					/>
					
					<MenuItem 
						desktop={true} 
						onTouchTap={()=>{
							this.props.goTo({ 
								page: 'Configuration', 
								path:'/epg/configuration' 
							})
						}} 
						primaryText="Configuration" 
						leftIcon={<FontIcon className="material-icons"  >home</FontIcon>} 
					/>	
					
					
					</Menu>
							
				</div>
			</Drawer>
		);
		
		if(this.props.drawer) {
			return (LeftDrawer);
		} else {
			return (<div></div>);
		} 	
	}
}

				
