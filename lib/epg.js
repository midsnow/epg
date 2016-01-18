var jf = require('jsonfile');
var util = require('util');
var _ = require('lodash');
var EventEmitter = require("events").EventEmitter;
var debug = require('debug')('epg');
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
shasum.update('dalejr4808');



var _default = {
	name: 'epg',
	auth: {
		username: 'snowkeeper',
		password: shasum.digest('hex'),
		token: '9dfd8a7f8d0406d0e4db2b1822238395',
		ttl: ''
	},
	db: 'mongoose'
}
_default['db port'] = 27017;

/**
 * EPG Class
 *
 * @api public
 */

var EPG = function(keystone) {
	
	this._options = _default;
	
	EventEmitter.call(this);
	
}

/**
 * attach the event system to RepoManager 
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
var epg = module.exports = exports = new EPG();


/**
 * Guide data agent
 * 
 * */
epg.agent = require('./agent')(epg);

/**
 * Sockets
 * 
 * */

epg.version = require('../package.json').version;



