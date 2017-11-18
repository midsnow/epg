import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Path from 'path';
import { Col } from 'react-bootstrap';
import wrapListeners from './listen';
import Debug from 'debug';
import Gab from './common/gab';
import MainMenu from './common/components/mainMenu';
import Styles from './common/styles';
import { pickIcon } from './common/utils';
import Snackbar from './common/components/snackbar';
import Confirm from './common/components/confirm';
import Any from './pages/component/any';
import routes from './routes';
import {FontIcon, IconButton, AppBar, RaisedButton, LeftNav, MenuItem, Divider, List, ListItem} from 'material-ui';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Alert from './common/alert';
import PropTypes from 'prop-types'; // ES6
import { defaultsDeep as deep, every as Every, isFunction } from 'lodash';

let debug = Debug('epg:app:render');

let styles = {
	'woobi': Styles.getMuiTheme(deep(Styles.WOOBI, {})),
	'nitelite3': Styles.getMuiTheme(deep(Styles.NITELITE, {})),
	'night': Styles.getMuiTheme(deep(Styles.NIGHT,  {})),
	'light': Styles.getMuiTheme(deep(Styles.LIGHT,  {})),
	'cream': Styles.getMuiTheme(deep(Styles.CREAM,  {})),
	'alternate blue': Styles.getMuiTheme(deep(Styles.ALTERNATEBLUE,  {})),
	'blue': Styles.getMuiTheme(deep(Styles.BLUE,  {})),
	'dark': Styles.getMuiTheme(deep(Styles.DARK, {})),
	'default': Styles.getMuiTheme(deep(Styles.DEFAULT, {} )),
	'graphite': Styles.getMuiTheme(deep(Styles.GRAPHITE,  {})),
	'nitelite': Styles.getMuiTheme(deep(Styles.NITELITE, {})),
	'nitelite2': Styles.getMuiTheme(deep(Styles.NITELITE2, {})),
	'nitelite4': Styles.getMuiTheme(deep(Styles.ROMS, {})),
}
class Main extends Component {
	constructor(props) {
		// we get props from Listener
		super(props);
		
		debug(props, 'location', location,)
		
		this.state = Object.assign({
			leftNav: false,
			theme: styles.woobi,
			styles,
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
		this.appState = this.setState.bind(this);
		this.switchTheme = this.switchTheme.bind(this);
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
	
	handleLeftNav(e) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		this.setState({leftNav: !this.state.leftNav});
	}
	
	LeftNavClose () {
		this.setState({ leftNav: false });
	}
	
	switchTheme(theme = 'rommie', update = true, callback, userSelect = false) {
		let style = this.state.styles[theme];
		if(!style) {
			style = this.state.styles.rommie;
		} 
		if( theme == 'dark' ) {
			setTheme('dark-theme');
		} else if( theme == 'graphite' ) {
			setTheme('dark-theme graphite');
			snowUI.shortenTitle = true;
		} else if( theme == 'default' ) {
			setTheme('');
		} else if( theme == 'cream'  ) {
			setTheme('light-theme');
		} else if( theme == 'light'  || theme == 'reset' ) {
			setTheme('light-theme theme-light ');
			style = this.state.styles.light;
		} else if( theme == 'nitelite' || theme == 'nitelite2' ) {
			setTheme('dark-theme default');
		} else if( theme == 'nitelite3' || theme == 'nitelite4' ) {
			setTheme('nitelite');
		} else if( theme == 'alternate blue' ) {
			setTheme('light-theme bluealt');
		} else if( theme == 'blue' ) {
			setTheme('light-theme blue');
		} else if( theme == 'woobi' ) {
			setTheme('night default');
		} else {
			setTheme('dark-theme default');
		}
		function setTheme ( setclass ) {
			document.body.className = setclass;
		}
		
		debug('## switchTheme ##');
		document.body.style.background = null;
		
		let appstate = {
			theme: style,
		};
		
		if(update !== false) {
			this.setState(appstate, function() {
				debug('#### SWITCHED THEME ####', theme);
				if(typeof callback === 'function') {
					callback();
				}
			});
		}
		return appstate;
	}
	
	goTo(route, state = {}, callback = ()=>{}, noFade = true, fadeMe) {
		
		if(typeof route === 'string') {
			// accept strings for the page
			route = {
				page: route,
			}
		}
		
		debug('goTo route', route)
		
		let run = () => {
			var send = Object.assign({ 
				mode: 'cors',
				leftNav: false,
				currentTheme: this.state.currentTheme,
			}, route);
			
			if(!send.path && send.page) {
				send.path = '/epg/' + send.page;
			}
			if(send.lineup) {
				send.path += '/' + send.lineup;
			}
			
			if(!send.path) {
				send.path = '/500';
				send.error = 'Invalid page configuration';
				send.page = '500';
				send.FontIcon = {
					icon: 'help',
					Color: 'blue',
					HoverColor: 'cyan',
				};
				send.message = 'Bad Request';
			}
			
			debug('sendto', send);
			this.props.router.push({
				pathname: send.path,
				query: send.query,
				state: send
			});
			
			document.title = send.page || document.title;
			
			this.setState({
				leftNav: false,
				...state,
			});

			callback();
			
		}
		
		if(noFade) {
			run();
		} else if(fadeMe) {
			snowUI.fadeOut('slow', fadeMe, () => {
				run();
			});
		} else {
			// fade the content div before its replaced
			snowUI.fadeOut('slow', () => {
				run();
			});
		}
		
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
				
		debug('got lineupRemove', lineup, this.state, 'props', this.props);
	
		this.state.sockets.lineupRemove(lineup, (data) => {
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
	
	menu() {
		return (
			<MainMenu  { ...this.state } docked={false} drawer={true} secondary={false} searchToggle={this.searchToggle} appState={this.appState} goTo={this.goTo} handleLeftNav={this.LeftNavClose} switchTheme={this.switchTheme}/>
		);
	}
	
	render() {
		debug('render state', this.state);
		
		if ( !this.state.sockets.connected.io && ( this.state.path !== '/epg/configuration' && this.state.path !== '/epg/disconnected' ) ) {
			
			debug('just wait for sockets'); 
			//this.goTo({
			//	path: '/epg/disconnected',
			//	page: 'SOS',
			//}); 
			//return <span />;
			
		}
		
		if ( this.state.status.clean && this.state.path != '/epg/configuration' ) {
			// new install so goto the config
			this.goTo({
				path: '/epg/configuration',
				page: 'Set Up The App',
			})
			return <span />;
		}
		
        return (<div id="Render" key="Render">
			{this.appbar()}
			{this.menu()}
			<div className="clearfix" />
			<div className="epg-container" >
				{this.contents()}
			</div>
			{this.alerts()}
        </div>);
	}
	
	contents() {
		return (<div id="CONTENTS" key="CONTENTS" >
			<div className="clearfix" />
			<div className="react-hot-reload-container" >
				<div style={{paddingRight:0, paddingLeft:0}} className="no-gutter" >
					<div id="content-fader-old">
						{this.props.children && React.cloneElement(this.props.children, Object.assign({ handleLeftNav: this.handleLeftNav, goTo: this.goTo, switchTheme: this.switchTheme, assets: this.setAsset, showAlert: this.showAlert, goTo: this.goTo, getLineups: this.getLineups, handleLeftNav: this.handleLeftNav, lineupAdd: this.lineupAdd, lineupRemove: this.lineupRemove, ...this.state }, this.props.children.props))}
						<div className="clearfix" />
					</div>
				</div>
			</div>
			<div className="clearfix" />
		</div>);	
	}
	
	appbar() {
		let title = this.state.page; 
		
		if(this.state.lineup && this.state.headends[this.state.lineup]) {
			title = this.state.headends[this.state.lineup].name;
			document.title = title;
		}
		let isConnected = this.state.sockets.io.connected !== false && !this.state.status.error  ? 
			this.state.guideRefresh.download ?
				<IconButton onClick={(e)=>{this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.deepPurple200} hoverColor={Styles.Colors.deepPurple200} title={"Downloading guide data for " + this.state.guideRefresh.who.join(', ')}>cloud_download</FontIcon></IconButton>
			:	
				
				<IconButton onClick={(e)=>{this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.green600} hoverColor={Styles.Colors.lightBlue300} title="Connection established. View status">cloud_done</FontIcon></IconButton>
		:
			this.state.status.error  ?
				<span><IconButton onClick={(e)=>{this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.amber100} hoverColor={Styles.Colors.red900} title="Connection to server lost">cloud_off</FontIcon></IconButton> <span style={{color:Styles.Colors.amber100,fontSize:'20px'}}>{this.state.status.error.message}</span></span>
			:
				<span><IconButton onClick={(e)=>{this.goTo('disconnected');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.amber100} hoverColor={Styles.Colors.red900} title="Connection to server lost">cloud_off</FontIcon></IconButton> <span style={{color:Styles.Colors.amber100,fontSize:'20px'}}>Connection Lost </span></span>
		
		let eRight = (<ToolbarGroup firstChild={true}>
			<IconButton onClick={this.handleLeftNav} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.lightBlue300} >menu</FontIcon></IconButton>
			<IconButton onClick={(e)=>{this.goTo('home');}} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.lightBlue300} >home</FontIcon></IconButton>
			<IconButton onClick={(e)=>{this.goTo('add-lineup');}} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.lightBlue300} >add_to_queue</FontIcon></IconButton>
			<IconButton onClick={(e)=>{this.goTo('configuration');}} ><FontIcon className="material-icons" color={Styles.Colors.lightBlue500} hoverColor={Styles.Colors.greenA200} >settings_applications</FontIcon></IconButton>
		</ToolbarGroup>);
		
		let appbar = this.state.page === 'guide' ? <span /> : ( <div><div >
			<Toolbar style={ { zIndex: 1501, boxShadow: 'none',position: 'fixed',background: this.state.sockets.io.connected && !this.state.status.error ? '#26282D' : '#FF6F00', height:65, width:'100%' } } >
				{ eRight }
				<ToolbarGroup>
					<ToolbarTitle text={ title } />
					{isConnected}
				</ToolbarGroup>	
			</Toolbar>
		</div><div style={{height:65,width:'100%'}} />
		</div>);
		
		return (<div id="APPBAR" >{appbar}</div>);
	}
	
	alerts() {
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
			//backgroundColor: colors[this.state.newalert.style] ? colors[this.state.newalert.style].bg : colors.info.bg,
			//color: colors[this.state.newalert.style] ? colors[this.state.newalert.style].color : colors.info.color,
		};
		return (<div id="ALERTS" >
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
    muiTheme: PropTypes.object
};

export default wrapListeners(Main);


