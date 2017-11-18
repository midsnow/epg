import React from 'react';
import Debug from 'debug';
import { Col } from 'react-bootstrap';
import { TextField, CardText, CardTitle, Divider } from 'material-ui';
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
				username: this.props.status.username,
				db_driver: this.props.status.db_driver,
				db_user: this.props.status.db_user,
				db_host: this.props.status.db_host,
				db_port: this.props.status.db_port,
				db_db: this.props.status.db_db,
				host: this.props.status.host,
				port: this.props.status.port,
			}
			this.props = props
		}
		
		componentWillReceiveProps( props ) {
			this.setState({ 
				username: this.props.status.username,
				db_driver: this.props.status.db_driver,
				db_user: this.props.status.db_user,
				db_host: this.props.status.db_host,
				db_port: this.props.status.db_port,
				db_db: this.props.status.db_db,
				host: this.props.status.host,
				port: this.props.status.port,
			})
		}
		
		render() {
			
			return (<div><Col xs={12} >
				<CardTitle 
					title="Configuration"
					subtitle={"Data will be saved in conf/epg.json"}
					titleColor={Styles.Colors.blue400}
					subtitleColor={Styles.Colors.grey500}
				/>
				</Col>
				<CardText>
				<Col xs={12} md={4}  lg={3} >
						<h4 style={{ marginBottom: 0 }} > Account Details </h4>
						<TextField
							name="username"
							ref="username"
							id="username"
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
							type="password"
							floatingLabelText="password will be hashed and saved"
							floatingLabelFixed={true}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								
							}} 
						/>
						
						<div className="clearfix" style={{ height: 30, width: 100 }} />
						<h4 style={{ marginBottom: 0 }} > Socket Connection </h4>
						<TextField
							name="host"
							ref="host"
							id="host"
							floatingLabelText="set host to connect to"
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
							floatingLabelFixed={true}
							value={this.state.port}
							floatingLabelText="set port to connect to"
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ port: e.target.value });
							}} 
						/>
					</Col>
					<Col xs={12} md={7} lg={8}  >						
						<h4 style={{ marginBottom: 0 }} > Database </h4>
						<SelectField
							value={this.state.db_driver}
							onChange={this.handleChange}
							floatingLabelText="Select a Database Driver"
							floatingLabelFixed={true}
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
							floatingLabelText="Database Port"
							floatingLabelFixed={true}
							value={this.state.db_port}
							inputStyle={{fontWeight:'normal',fontSize:'20px',color:Styles.Colors.blue200}}
							onChange={(e) => {
								this.setState({ db_port: e.target.value });
							}} 
						/>
					</Col>
					<div className="clearfix" style={{ height: 50, width: 100 }} />
					<Col xs={12}   >
						<Button 
							className={"left"} 
							ref="setconfigbutton" 
							onClick={() => {
								this.props.sockets.updateConfiguration({
									username: this.refs.username.input.value,
									password: this.refs.password.input.value,
									db_driver: this.refs.db_driver.input.value,
									db_user: this.refs.db_user.input.value,
									db_pass: this.refs.db_pass.input.value,
									db_port: this.refs.db_port.input.value,
									db_host: this.refs.db_host.input.value,
									db_db: this.refs.db_db.input.value,	
								}, ( data ) => {
									debug( 'Got data from updateConfig', data )
									this.refs.setconfigbutton.success(); 
									this.refs.password.input.value = '';
									this.refs.db_pass.input.value = '';
									this.refs.username.input.value = data.username
									
								});
							}} 
							durationSuccess={7500} 
							durationError={7500} 
						>
							Update
						</Button>
					</Col>
				</CardText>
			</div>);
		}
	}

	export default Base


					
