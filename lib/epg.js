var util = require('util');
var _ = require('lodash');
var EV = require("events");
var d = require('debug');
var path = require('path');
var xxpress = require('./express');

var debug = d('epg');
var EventEmitter = EV.EventEmitter;

const moduleRoot = (function(_rootPath) {
	let parts = _rootPath.split(path.sep);
	parts.pop()
	//parts.splice(-2, 2); //get rid of /node_modules from the end of the path
	return parts.join(path.sep);
})(module.paths[1]);

var _default = {
	name: 'epg',
	database: {
		driver     : "mysql", // mariadb
		host       : "sam",
		port       : "3306",
		username   : "epg",
		password   : "epgthegoodelephant",
		database   : "ismEpg",
	},
	auth: {
		//username: 'username',
		//password: shasum.digest('hex'),
		token: '9dfd8a7f8d0406d0e4db2b1822238395',
		ttl: ''
	},
	moduleRoot: moduleRoot
}

/**
 * EPG Class
 *
 * @api public
 */	
var EPG = function() {
	this._options = _default;
	EventEmitter.call(this);
	
	this.watchAppFiles = path.join( moduleRoot, 'epg-app' );
	
	const Server = xxpress(this);
	this.Server = new Server();
	
	return this;
}

/**
 * attach  
 * */
util.inherits(EPG, EventEmitter);
/**
 * include the prototype funtions
 *
 * @api public
 */
_.extend(EPG.prototype, require('./prototype.js')());

_.extend(EPG.prototype, require('./socket')());

/**
 * The exports object is an instance of EPG.
 *
 * @api public
 */
module.exports = function () {
	var epg = new EPG();
	epg.agent = require('./agent')(epg);
	epg.version = require('../package.json').version;
	return epg;
}
	
