import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Path from 'path';
import { Col } from 'react-bootstrap';
import wrapListeners from './listen';
import Debug from 'debug';
import Gab from './common/gab';
import { pickIcon } from './common/utils';
import Snackbar from './common/components/snackbar';
import Confirm from './common/components/confirm';
import Any from './pages/component/any';
import routes from './routes';
import {FontIcon, IconButton, AppBar, RaisedButton, LeftNav, MenuItem, Styles, Divider, List, ListItem} from 'material-ui/lib';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Alert from './common/alert';

//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

let debug = Debug('epg:app:render');

debug('dark raw theme', Styles.DarkRawTheme);
debug('dark  base theme', Styles.darkBaseTheme);

let myStyles = {
	primary1Color: '#223E77',
	textColor: Styles.Colors.blue100,
	alternateTextColor: Styles.Colors.lightBlue50,
	primary2Color: '#3B71E2',
	canvasColor: '#303234',
	accent1Color: "#FF6040",
	accent2Color: "#F5001E",
	accent3Color: "#FA905C",
	disabledColor: Styles.Colors.grey600,
}
let myStylesLight = {
	primary1Color: 'initial',
	primary2Color: Styles.Colors.lightBlue700,
	textColor: Styles.Colors.grey700,
	accent1Color: Styles.Colors.deepOrange700,
    accent2Color: Styles.Colors.deepOrange500,
    accent3Color: Styles.Colors.lightBlack,
}
class Main extends Component {
	constructor(props) {
		// we get props from Listener
		super(props);
		
		debug(props, 'location', location,)
		
		this.state = Object.assign({
			leftNav: false,
			theme: Styles.ThemeManager.modifyRawThemePalette(Styles.ThemeManager.getMuiTheme(Styles.LightRawTheme), myStylesLight),
			//theme: Styles.ThemeManager.getMuiTheme(Styles.DarkRawTheme),
			//theme: Styles.ThemeManager.getMuiTheme(Styles.LightRawTheme),
			query: location.search,
			location: { ...location },
			current: {},
			newalert: {},
			newconfirm: {
				open: false
			},
			status: {
				lineups: [],
				account: {
					maxLineups: 4,
				},
				notifications: [],
			},
			lineups: {
				lineups: []
			},
			headends: {}
		}, props);
		
		debug('fresh state', this.state);
		
		this.handleLeftNav = this.handleLeftNav.bind(this);
		this.LeftNavClose = this.LeftNavClose.bind(this);
		this.goTo = this.goTo.bind(this);
		this.setAsset = this.setAsset.bind(this);
		this.dismissAlert = this.dismissAlert.bind(this);
		this.answerConfirm = this.answerConfirm.bind(this);
		this.lineupRemove = this.lineupRemove.bind(this);
		this.lineupAdd = this.lineupAdd.bind(this);
		this.getLineups = this.getLineups.bind(this);
		this.showAlert = this.showAlert.bind(this);
		
	}
	
	componentWillReceiveProps(props) {
		// update from listener
		debug('listener props', props);
		this.setState(props);	
	}
	
	showAlert(style, message, type = 'html') {
		this.setState({
			newalert: {
				show: true,
				[type]: message,
				style
			}
		});
	}
	
	getLineups(e) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		this.state.sockets.lineups(this.props.lineupListener)
	}
	
	getChildContext() {
		return {
			muiTheme: this.state.theme,
		};
	}
	
	handleLeftNav() {
		this.setState({leftNav: !this.state.leftNav});
	}
	
	LeftNavClose () {
		this.setState({ leftNav: false });
	}
	
	goTo(state, legacyChild = '', legacyLineup = '') {
		debug('goTo state', state)
		
		if(typeof state === 'string') {
			// accept strings for the page
			state = {
				page: state,
				child: legacyChild,
				lineup: legacyLineup
			}
		}
		
		let _defaults = {
			leftNav: false,
			child: '',
			current: {},
			location: location,
			lineup: '',
			query: '',
		}
		
		this.setState(Object.assign(_defaults, state), () => {
			debug('push history', '/' , this.state.page, this.state.child, this.state.lineup)
			this.state.history.push({
				pathname: Path.join('/' , this.state.page, this.state.child, this.state.lineup),
				search: this.state.query,
				state: {
					page: this.state.page,
					current: this.state.current,
					child: this.state.child,
					lineup: this.state.lineup,
				}
			})
		});
	}
	
	setAsset(asset, callback) {
		this.setState(asset, callback);
	}
	
	dismissAlert() {
		this.setState({ 
			newalert: {
				show: false
			}
		});
	}
	
	dismissConfirm() {
		this.setState({ 
			newconfirm: {
				show: false
			}
		});
	}
	
	lineupRemove(lineup) {
		this.setState({
			newconfirm: {
				open: true,
				html: 'Are you sure you want to delete ' + lineup.name + '?  You will lose your saved channels!'
			},
			answerConfirm: lineup,
			answerMethod: 'lineupRemoveForReal'
		});
	}
	
	answerConfirm(success) {
		if(success) {
			this[this.state.answerMethod](this.state.answerConfirm);
		}
		this.setState({
			newconfirm: {
				open: false,
			},
			answerConfirm: false
		});
		
	}
	
	lineupRemoveForReal(lineup) {
				
		debug('got lineupRemove', lineup.uri, this.state, 'props', this.props);
	
		this.state.sockets.lineupRemove(lineup.uri, (data) => {
			debug('got lineupRemove data', data);
			if(data.err) {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error.message,
						show: true
					}
				});
			} else {
				this.getLineups();
				var state = {
					newalert: {
						style: 'warning',
						html: 'Removed lineup ' + lineup.name + '.',
						show: true,
					}
				}
				
				state.page = 'home';
				
				this.goTo(state);
			}
		});
	}
	
	lineupAdd(lineup) {
		this.setState({
			newconfirm: {
				open: true,
				html: 'Are you sure you want to add lineup ' + lineup.name + ' - ' + lineup.lineup + '?',
				yesText: 'Add ' + lineup.name,
				
			},
			answerConfirm: lineup,
			answerMethod: 'lineupAddForReal'
		});
	}
	
	lineupAddForReal(lineup) {
		
		debug('got lineupAdd', lineup, this.state, 'props', this.props);
		
		this.state.sockets.lineupAdd(lineup, (data) => {
			debug('got lineupAdd data', data);
			if(data.error) {
				this.setState({
					newalert: {
						style: 'danger',
						html: data.error.message,
						show: true
					}
				});
				if(this.refs.manage) this.refs.manage.error();		
			} else {
				if(this.refs.manage) this.refs.manage.success();
				this.getLineups();
				this.goTo({
					newalert: {
						style: 'success',
						html: 'Added lineup '+lineup.lineup+'.  Now select some channels...',
						show: true
					},
					lineup: lineup.lineup,
					page: 'lineup',
				});
			}
		});
	}
	
	render() {
		debug('render state', this.state);
		
		let title = this.state.page;
		if(this.state.child) {
			switch(this.state.child) {
				case "settings":
					title="Settings"
					break;
				case "index":
				case "add-lineup":
					title = 'Add Lineup';
					break;
				default:
					title = this.state.child;
			};
		}
		if(this.state.lineup && this.state.headends[this.state.lineup]) {
			title = this.state.headends[this.state.lineup].name;
		}
		
		let isConnected = this.state.sockets.io.connected !== false ? 
			this.state.guideRefresh.download ?
				<IconButton onClick={(e)=>{e.preventDefault();this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.deepPurple200} hoverColor={Styles.Colors.deepPurple200} title={"Downloading guide data for " + this.state.guideRefresh.who.join(', ')}>cloud_download</FontIcon></IconButton>
			:	
				<IconButton onClick={(e)=>{e.preventDefault();this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.green600} hoverColor={Styles.Colors.lightBlue300} title="Connection established. View status">cloud_done</FontIcon></IconButton>
		:
			<span><IconButton onClick={(e)=>{e.preventDefault();this.goTo('disconnected');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.amber100} hoverColor={Styles.Colors.red900} title="Connection to server lost">cloud_off</FontIcon></IconButton> <span style={{color:Styles.Colors.amber100,fontSize:'20px'}}>Connection Lost </span></span>
		
		let eRight = (<span>
			
			<IconButton onClick={(e)=>{e.preventDefault();this.goTo('home');}} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.lightBlue300} >home</FontIcon></IconButton>
			<IconButton onClick={(e)=>{e.preventDefault();this.goTo('add-lineup');}} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.lightBlue300} >add_to_queue</FontIcon></IconButton>
			{isConnected}
		</span>);
		
		let appbar = <AppBar
			title={title}
			onLeftIconButtonTouchTap={this.handleLeftNav} 
			iconElementRight={eRight}
			style={{boxShadow: 'none',position: 'fixed',background: this.state.sockets.io.connected ? '#26282D' : '#FF6F00'}}
		/>;
		
		let mylineups = this.state.lineups.lineups.map((v) => {
			return (
				<ListItem 
					key={v.lineup+'1'} 
					className="fixmenuleft"
					style={{fontSize:'12px', marginLeft:0}} 
					primaryText={v.name} 
					secondaryText={<span style={{fontSize:'11px'}}>{v.lineup}</span>}
					onClick={(e) => {
						e.preventDefault(e);
						this.goTo({
							page: 'lineup',
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
		
		let menu = 	<LeftNav 
						docked={false}
						open={this.state.leftNav}
						width={255}
						onRequestChange={open => {
							debug('request change', open, this.state);
							this.setState({
								leftNav: open
							})
						}}
					>
						
						<List>
							<ListItem  onTouchTap={()=>{this.goTo('guide')}} primaryText="Guide" leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >home</FontIcon>} />
							<ListItem  onTouchTap={()=>{this.goTo('settings')}} primaryText="Settings" leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >home</FontIcon>} />
							<ListItem onTouchTap={()=>{this.goTo('add-lineup')}} primaryText="Add A Lineup" leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >plus_one</FontIcon>} />
							<ListItem
								primaryText="My Lineups"
								primaryTogglesNestedList={true}
								leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >tv</FontIcon>}
								initiallyOpen={true}
								nestedItems={mylineups}
							/>
						</List>
						
					</LeftNav>;
        
        const Page = routes(this.state.page, this.state.child);
        const colors = {
			danger: {
				bg: Styles.Colors.deepOrangeA700,
				color: Styles.Colors.grey50
			},
			warning: {
				bg: Styles.Colors.amber800,
				color: Styles.Colors.grey50
			},
			info: {
				bg: Styles.Colors.blue800,
				color: Styles.Colors.grey50
			},
			success: {
				bg: Styles.Colors.limeA700,
				color: Styles.Colors.grey900
			}
		};
        const bodyStyle =  {
			backgroundColor: colors[this.state.newalert.style] ? colors[this.state.newalert.style].bg : colors.info.bg,
			color: colors[this.state.newalert.style] ? colors[this.state.newalert.style].color : colors.info.color,
		};
		
        return (<div>
			{appbar}
			<div style={{height:65,width:'100%'}} />
			{menu}
			
			<div className="clearfix" />
			<div className="epg-container" >
				<div >
					<Page { ...this.state } assets={this.setAsset} showAlert={this.showAlert} goTo={this.goTo} getLineups={this.getLineups} lineupAdd={this.lineupAdd} lineupRemove={this.lineupRemove} />
				</div>
			</div>
			<Confirm 
				html={this.state.newconfirm.html}
				title={this.state.newconfirm.title}
				answer={this.answerConfirm}
				open={this.state.newconfirm.open}
				yesText={this.state.newconfirm.yesText}
				noText={this.state.newconfirm.noText}
			/>
			{this.state.newalert.show ? 
				<Snackbar 
					bodyStyle={bodyStyle}
					setParentState={this.setAsset}
					html={'<div style="color:' +bodyStyle.color+ '">' +this.state.newalert.html+ '</div>'}
					data={this.state.newalert.data}
					component={this.state.newalert.component}
					open={this.state.newalert.show}
					autoHideDuration={this.state.newalert.duration >= 0 ? this.state.newalert.duration : 5000}
					onRequestClose={() => {this.setState({ newalert: { show: false }});}}
				/> 
			: 
				''
			}
        </div>);

	}
	
	
}

Main.childContextTypes = {
    muiTheme: React.PropTypes.object
};

export default wrapListeners(Main);


