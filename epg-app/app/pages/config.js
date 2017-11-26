import React from 'react';
import Debug from 'debug';
import Col from 'react-bootstrap/lib/Col';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import Divider from 'material-ui/Divider';
import CardText from 'material-ui/Card/CardText';
import CardTitle from 'material-ui/Card/CardTitle';
import Styles from '../common/styles';
import { Button } from '../common/utils';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

let debug = Debug('epg:app:pages:config');

const items = [
  <MenuItem key={1} value={'mysql'} primaryText="mysql" />,
  <MenuItem key={2} value={'sqlite3'} primaryText="sqlite3" />,
  <MenuItem key={3} value={'redis'} primaryText="redis" />,
  <MenuItem key={4} value={'postgres'} primaryText="postgres" />,
  <MenuItem key={5} value={'riak'} primaryText="riak" />,
  <MenuItem key={6} value={'mongodb'} primaryText="mongodb" />,
  <MenuItem key={7} value={'mongoose'} primaryText="mongoose" />,
  <MenuItem key={8} value={'firebird'} primaryText="firebird" />,
  <MenuItem key={9} value={'neo4j'} primaryText="neo4j" />,
  <MenuItem key={10} value={'tingodb'} primaryText="tingodb" />,
  <MenuItem key={11} value={'couchdb'} primaryText="couchdb" />,
  <MenuItem key={12} value={'rethinkdb'} primaryText="rethinkdb" />,
];


	class Base extends React.Component {
		constructor(props) {
			super(props)
			this.displayName = 'Configuration'
			this.state = { 
				username: props.status.username,
				db_driver: props.status.db_driver || 'mysql',
				db_user: props.status.db_user || 'epg',
				db_host: props.status.db_host || '127.0.0.1',
				db_port: props.status.db_port || '3306',
				db_db: props.status.db_db || 'ismEpg',
				host: props.status.host,
				port: props.status.port,
				socketHost: props.status.socketHost || snowUI.host,
				socketPort: props.status.socketPort || snowUI.port,
				meg: 'Will NOT Change Server Port / Host Settings',
				dbmeg: '' + (props.status._db === true ? 'Will  NOT ' : '') + ' Change Database Settings',
				ameg: '' + (props.status._agent === true ? 'Will  NOT ' : '') + '  Change Account Settings',
				cmeg: '' + (props.sockets.connected.io ? 'Will  NOT ' : '') + '  Change Client Settings',
				db: props.status._db !== true,
				account: props.status._agent !== true,
				client: !props.sockets.connected.io,
			}
		}
		
		componentWillReceiveProps( props ) {
			this.setState({ 
				username: props.status.username,
				db_driver: props.status.db_driver,
				db_user: props.status.db_user,
				db_host: props.status.db_host,
				db_port: props.status.db_port,
				db_db: props.status.db_db,
				host: props.status.host,
				port: props.status.port,
			})
		}
		
		render() {
			let messages = [];
			if ( this.state.db ) messages.push('Will update database settings');
			if ( this.state.account ) messages.push('Will update host settings');
			if ( this.state.server ) messages.push('Will update server settings');
			if ( this.state.client ) messages.push('Will update client settings');
			
			let button = messages.length === 0 ? <span /> : (<Button 
							className={"left"} 
							ref="setconfigbutton" 
							onClick={() => {
								let send = {};
								if ( this.state.server ) {
									send = {  
										port: this.state.port,
										host: this.state.host,
										server: this.state.server,
									}
								}
								if ( this.state.db ) {
									send = { 
										...send, 
										database: {
											driver: this.state.db_driver,
											username: this.state.db_user,
											port: this.state.db_port,
											host: this.state.db_host,
											database: this.state.db_db,
										}
									}
									if ( this.state.db_pass ) {
										send.database.password = this.state.db_pass;
									}
								}
								if ( this.state.client ) {
									send = { 
										...send, 
										socketPort: this.state.socketPort,
										socketHost: this.state.socketHost,
									}
								}
								if ( this.state.account ) {
									send = { 
										...send, 
										auth: {
											username: this.state.username,
											password: this.refs.password.input.value,
										}
									}
								}
								this.props.sockets.updateConfiguration(send, ( data ) => {
									debug( 'Got data from updateConfig', data )
									this.refs.setconfigbutton.success(); 
									if ( data.message ) {
										let style = data.success === false ? 'danger' : data.success ? 'success' : 'info';
										// fetch status and go to home page
										this.props.sockets.status(() => {;
											this.props.goTo({
												path: '/epg/home',
												page: 'Welcome Back',
												newalert: {
													show: true,
													html: data.message,
													style,
													duration: 7500,
												}
											});
										});
									}
									//this.state.username = data.username;
								});
							}}
							durationSuccess={7500} 
							durationError={7500} 
						>
							Update
						</Button>);
			
			let client = (<div><div className="clearfix" style={{height: 15}} />
						<TextField
							name="socketHost"
							ref="socketHost"
							id="socketHost"
							disabled={!this.state.client}
							floatingLabelFixed={true}
							value={this.state.socketHost}
							floatingLabelText="Client Connect To Host"
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ socketHost: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="socketPort"
							ref="socketPort"
							id="socketPort"
							disabled={!this.state.client}
							floatingLabelFixed={true}
							value={this.state.socketPort}
							floatingLabelText="Client Connect To Port"
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ socketPort: e.target.value });
							}} 
						/></div>);
			
			let account = (<div><div className="clearfix" style={{height: 15}} />
						<TextField
							name="username"
							ref="username"
							id="username"
							disabled={!this.state.account}
							floatingLabelText="set your account username"
							value={this.state.username}
							floatingLabelFixed={true}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ username: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="password"
							ref="password"
							id="password"
							disabled={!this.state.account}
							floatingLabelText="password will be hashed and saved"
							floatingLabelFixed={true}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								
							}} 
						/></div>);
						
			let server = (<div><div className="clearfix" style={{height: 15}} />
						<TextField
							name="host"
							ref="host"
							id="host"
							disabled={!this.state.server}
							floatingLabelText="Server Bind to Host"
							floatingLabelFixed={true}
							value={this.state.host}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ host: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="port"
							ref="port"
							id="port"
							disabled={!this.state.server}
							floatingLabelFixed={true}
							value={this.state.port}
							floatingLabelText="Port for Server and Client"
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ port: e.target.value });
							}} 
						/>		</div>);
			let db = (<div><div className="clearfix" style={{height: 15}} />
						<SelectField
							value={this.state.db_driver}
							onChange={this.handleChange}
							disabled={!this.state.db}
							floatingLabelText="Select a Database Driver"
							floatingLabelFixed={true}
							ref="db_driver"
							onChange={(a,b,c) => {
								this.setState({ db_driver: c });
							}}
						>
							{items}
						</SelectField>
						<div className="clearfix" />
						<TextField
							name="db_db"
							ref="db_db"
							id="db_db"
							disabled={!this.state.db}
							floatingLabelText="Database"
							floatingLabelFixed={true}
							value={this.state.db_db}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_db: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="db_user"
							ref="db_user"
							id="db_user"
							disabled={!this.state.db}
							floatingLabelText="Database Username"
							floatingLabelFixed={true}
							value={this.state.db_user}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_user: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="db_pass"
							ref="db_pass"
							id="db_pass"
							disabled={!this.state.db}
							floatingLabelFixed={true}
							floatingLabelText="Database Password"
							value={this.state.db_pass}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_pass: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="db_host"
							ref="db_host"
							id="db_host"
							disabled={!this.state.db}
							floatingLabelText="Database Host Address"
							floatingLabelFixed={true}
							value={this.state.db_host}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_host: e.target.value });
							}} 
						/>
						<div className="clearfix" />
						<TextField
							name="db_port"
							ref="db_port"
							id="db_port"
							disabled={!this.state.db}
							floatingLabelText="Database Port"
							floatingLabelFixed={true}
							value={this.state.db_port}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_port: e.target.value });
							}} 
						/></div>);
			return (<div><Col xs={12} >
				<CardTitle 
					title="Configuration"
					subtitle={"Data will be saved in conf/epg.json"}
					titleColor={Styles.Colors.blue400}
					subtitleColor={Styles.Colors.grey500}
				/>
				</Col>
				<CardText>
				<Col xs={12} sm={6}   >
						
						<h4 style={{ marginBottom: 0 }} > Client Host Setting </h4>
						<div className="clearfix" style={{height: 15}} />
						<Toggle
							label={this.state.cmeg}
							labelPosition="right"
							toggled={this.state.client}
							onToggle={(e, client) => {
								let cmeg = client === true ? 'WILL Change Client Settings' : 'Will NOT Change Client Settings';
								this.setState({ client, cmeg })
							}}
							thumbStyle={{
								backgroundColor: '#ffcccc',
							}}
						/>
						{this.state.client ? client : <span />}
						
						<div className="clearfix" style={{ height: 30, width: 100 }} />
						<h4 style={{ marginBottom: 0 }} > Account Details </h4>
						<div className="clearfix" style={{height: 15}} />
						<Toggle
							label={this.state.ameg}
							labelPosition="right"
							toggled={this.state.account}
							onToggle={(e, account) => {
								let ameg = account === true ? 'WILL Change Server Account Settings' : 'Will NOT Change Server Account Settings';
								this.setState({ account, ameg })
							}}
							thumbStyle={{
								backgroundColor: '#ffcccc',
							}}
						/>
						{this.state.account ? account : <span />}			
					</Col>
					<Col xs={12} sm={6} >						
						<h4 style={{ marginBottom: 0 }} > Server Settings </h4>
						<div className="clearfix" style={{height: 15}} />
						<Toggle
							label={this.state.meg}
							labelPosition="right"
							toggled={this.state.server}
							onToggle={(e, server) => {
								let meg = server === true ? 'WILL Change Server Port / Host Settings' : 'Will NOT Change Server Port / Host Settings';
								this.setState({ server, meg })
							}}
							thumbStyle={{
								backgroundColor: '#ffcccc',
							}}
						/>
						{this.state.server ? server : <span />}	
						<div className="clearfix" style={{ height: 30, width: 100 }} />
						<h4 style={{ marginBottom: 0 }} > Database </h4>
						<div className="clearfix" style={{height: 15}} />
						<Toggle
							label={this.state.dbmeg}
							toggled={this.state.db}
							labelPosition="right"
							onToggle={(e, db) => {
								let dbmeg = db === true ? 'WILL Change Server Database Settings' : 'Will NOT Change Server Database Settings';
								this.setState({ db, dbmeg })
							}}
							thumbStyle={{
								backgroundColor: '#ffcccc',
							}}
						/>
						{this.state.db ? db : <span />}	
					</Col>
					<div className="clearfix" style={{ height: 50, width: 100 }} />
					<Col xs={12}  style={{ height: 100 }} >
						<div style={{height: 50}} />
						{messages.map( (m,k) => (<div key={k} style={{ color: Styles.Colors.amber600}} children={m} />) )}
						<div style={{height: 25}} />
						{button}
						<div style={{height: 50}} />
					</Col>
					<div className="clearfix" style={{ height: 50, width: 100 }} />
				</CardText>
			</div>);
		}
	}

	export default Base


					
