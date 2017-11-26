var	_ = require('lodash');
var	debug = require('debug')('epg:lib:core:listeners');
var epg = require('./listeners/epg.js');
var base = require('./listeners/base.js');
var sd = require('./listeners/schedules-direct.js');

var Listeners = function Listeners( opts ) {
	
	if ( !( this instanceof Listeners ) ) return new Listeners( opts );
	
	this.epg = opts.epg;
	
	_.extend( Listeners.prototype , sd );
	_.extend( Listeners.prototype , epg );
	
	if ( opts.extend ) {
		_.extend( Listeners.prototype , opts.listeners || {} );
	}
	
	_.extend( Listeners.prototype , base );
	
	debug('done laoding listeners');

	return this;
}

module.exports = Listeners;
