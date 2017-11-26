import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { pickIcon } from '../../common/utils';
import Routes from '../../routes';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import CardActions from 'material-ui/Card/CardActions';
import CardHeader from 'material-ui/Card/CardHeader';
import CardMedia from 'material-ui/Card/CardMedia';
import CardTitle from 'material-ui/Card/CardTitle';
import ListItem from 'material-ui/List/ListItem';
import Divider from 'material-ui/Divider';
import List from 'material-ui/List/List';
import TextField from 'material-ui/TextField';
import GridTile from 'material-ui/GridList/GridTile';
import FlatButton from 'material-ui/FlatButton';
import GridList from 'material-ui/GridList/GridList';
import MenuItem from 'material-ui/MenuItem';
import SelectField from 'material-ui/SelectField';
import Toggle from 'material-ui/Toggle';
import FontIcon from 'material-ui/FontIcon';
import { Button } from '../../common/utils';
import Alert from '../../common/alert';
import Select from 'react-select';
import Col from 'react-bootstrap/lib/Col';
import Icons from '../../assets/icons';
import sortBy from 'lodash/sortBy';
import Styles from '../../common/styles';

let debug = Debug('epg:app:pages:settings:index');
		
export default class Settings extends React.Component {	
	constructor(props) {
		super(props)
		this.displayName = 'Settings Component'	
		this.state = {
			html: props.children || props.html || <span />,
			durationError:2000,
			durationSuccess:1500,
			parent: props,
			step: 1,
			headends: [],
			headendsMap: {},
			lineups: {},
			lineupMap: {
				channel: {},
				id: {},
			}
		}
		this._update = false
		
		this.submit = this.submit.bind(this);
		this.headends = this.headends.bind(this);
		
	}
	
	componentWillReceiveProps(props) {
		//debug('receiveProps');
		this.setState({html: props.children || props.html});
		this._update = true;
	}
	
	componentDidUpdate() {
		//debug('didUpdate');
	}
	
	componentDidMount() {
		//debug('did mount');
		
	}
	
	dismissAlert() {
		this.setState({ 
			newalert: {
				show: false
			}
		});
	}
	
	headends() {
		debug('do headends', postal, this.state, 'props', this.props);
		let postal = this.state.postal;
		
		this.props.sockets.headends(postal, (data) => {
			debug('got headends data', data);
			if(data.error) {
				this.props.assets({
					newalert: {
						style: 'danger',
						html: data.error.message,
						show: true
					}
				});
				this.refs.manage.error();		
			} else {
				//this.refs.manage.success();
				let headendsMap = {};
				data.forEach(v => headendsMap[v.uri] = v)
				this.setState({
					headends: sortBy(data, 'name'),
					headendsMap: headendsMap,
					step: 2,
				});
				this.props.assets({
					newalert: {
						html: 'Select a lineup to add',
						show: true,
						style: 'info',
						duration: 2000
					}
				});
			}
		});
	}
	
	lineupAdd(uri) {
		this.props.lineupAdd(uri);
	}
	
	lineupRemove(lineup) {
		this.props.lineupRemove(lineup);		
	}
	
	submit() {
		debug('submit', this.state, this.props);
		
		if(this.refs.manage) this.refs.manage.loading();
		
		if(this.state.step === 1) {
			this.headends();
		} else {
			this.props.assets({
				newalert: {
					style: 'danger',
					html: 'error',
					show: true
				}
			});
		}
		
		
		
	}
	
	render() {
		debug('render', this.state, this.props);
		
		
		let typeOptions = this.state.headends.map(v => {
			if(v) {
				return (<span><ListItem 
					key={v.uri+'add'} 
					style={{fontSize:'14px'}} 
					primaryText={v.name} 
					title={'Add ' + v.name + ' to your account'} 
					secondaryText={v.lineup} 
					leftIcon={<FontIcon className="material-icons" color={Styles.Colors.lightBlue600} hoverColor={Styles.Colors.greenA200} >{pickIcon(v.transport)}</FontIcon>}
					onTouchTap={(e) => {
						e.preventDefault();
						this.lineupAdd(v);
					}}	
				/>
				<Divider inset={false} />
				</span>);
			}
		}).filter(n => true);
		
		let type = <List>
			{typeOptions} 
		</List>;
		
		let btnText;
		let btnText2 = false;
		switch(this.state.step) {
			case 1:
				btnText = 'Search';
				break;
			
			default:
				btnText = 'Submit';
				break;
		}
		
		let thebutton = this.state.step > 1 ? <Col xs={4} /> : <Col xs={4} >
				<div className="pull-left" ><Button className={" "} ref="manage"  onClick={this.submit} durationSuccess={this.state.durationSuccess} durationError={this.state.durationError} >Search</Button></div>
			</Col>;
				
		let buttons = (<div className="no-gutter" style={{marginTop:20,marginBottom:20}}>

			{thebutton}
	
			<Col xs={8} >
				<div className="pull-left" >
					<Button ref="reset" className={""} durationSuccess={2000} style={{color:'#666'}} href="#" onClick={(e)=>{
						e.preventDefault();
						if(this.refs.reset) this.refs.reset.success();
						if(this.refs.manage) this.refs.manage.loading();
						this.setState({ 
							step: 1,
							headends: [],
							lineups: {},
							lineupMap: {
								channel: {},
								id: {},
							},
							type: '',
							postal: ''
						});
						this.props.assets({
							newalert: {
								show: true,
								html: 'Form Reset',
								style: 'success',
								duration: 2000
							}
						}, ()=>{if(this.refs.manage) this.refs.manage.enable});
					}} >Reset</Button>
				</div>
			</Col>
			<div className="clearfix" />
		</div>);
		
		return (<Col xs={12} md={10} mdOffset={1} lg={8} lgOffset={2} >
				<CardTitle 
					title="Add a new lineup"
					subtitle={this.props.status.account.maxLineups - this.props.status.lineups.length + " of " + this.props.status.account.maxLineups + " lineups available."}
					titleColor={Styles.Colors.blue400}
					subtitleColor={Styles.Colors.grey500}
				/>
				<CardText>
					{this.state.step === 1 ?  
						<div><TextField
							type="number"
							hintText="30126"
							floatingLabelText="Enter a Postal code" 
							ref="postal"
							onFocus={() => {
								this.refs.manage.enable();
							}}
							onChange={(e) => {
								this.setState({ postal: e.target.value});
							}}
							value={this.state.postal}
							//onBlur={this.headends}
						/>
						
						<div style={{marginTop:20}} />
						{buttons}
						</div>
					: 
						<div>{buttons}</div>
					}
					
					<div className="clearfix" />
					{this.state.step > 1 ? type : ''}
					
					
					
				</CardText>
		</Col>);
	}
}


