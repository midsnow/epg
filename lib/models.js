var caminte = require('caminte');
var Schema = caminte.Schema;
var debug = require('debug')('epg:lib:models');

exports = module.exports = function models() {
	var epg = this;	

	var schema  = new Schema(this.get('db'), {
		port: this.get('db port'),
		database: 'epg',
		host: 'localhost'
	});
	
	var Headends = schema.define('Headends', {
		name: { type: schema.String, index: true },
		lineup: { type: schema.String, "null": false, unique: true, index: true },
		uri: { type: schema.String, "null": false, unique: true, index: true },
		headend: { type: schema.String },
		location: { type: schema.String },
		transport: { type: schema.String },
		modified: { type: schema.Date },
	});
	
	/*
	var Postal = schema.define('Postal', {
		postal: { type: schema.Number, index: true,  "null": false, unique: true },
		md5: { type: schema.String },
		headends: { type: schema.JSON }
	});
	*/
	
	var Channels = schema.define('Channels', {
		channel: { type: schema.String, index: true, "null": false },
		headend: { type: schema.String, index: true, "null": false },
		uhfVhf: { type: schema.String, "null": false },
		stationID: { type: schema.Number, index: true, "null": false },
		atscMajor: { type: schema.String, "null": false },
		atscMinor: { type: schema.String, "null": false},
		providerCallsign: { type: schema.String, "null": false },
		logicalChannelNumber: { type: schema.String, "null": false },
		matchType: { type: schema.String, "null": false },
		frequencyHz: { type: schema.String, "null": false },
		serviceID: { type: schema.String, "null": false },
		networkID: { type: schema.String, "null": false },
		transportID: { type: schema.String, "null": false },
		deliverySystem: { type: schema.String, "null": false },
		symbolrate: { type: schema.String, "null": false },
		fec: { type: schema.String, "null": false },
		polarization: { type: schema.String, "null": false },
		channelMinor: { type: schema.String, "null": false },
		channelMajor: { type: schema.String , "null": false},
		virtualChannel: { type: schema.String , "null": false},
		active: { type: schema.Boolean, "null": false }
	});
	
	var Stations = schema.define('Stations', {
		stationID: { type: schema.Number, index: true,  "null": false, unique: true },
		name: { type: schema.String, index: true,  "null": false },
		headend: { type: schema.String, index: true,  "null": false },
		callsign: { type: schema.String,  "null": false },
		affiliate: { type: schema.String,  "null": false },
		broadcastLanguage: { type: schema.JSON,  "null": false },
		descriptionLanguage: { type: schema.JSON,  "null": false },
		logicalChannelNumber: { type: schema.String,  "null": false },
		broadcaster: { type: schema.JSON,  "null": false },
		logo: { type: schema.JSON,  "null": false },
		isCommercialFree: { type: schema.Boolean,  "null": false },
		active: { type: schema.Boolean, "null": false }
	});
	
	var Schedules = schema.define('Schedules', {
		stationID: { type: schema.Number, index: true,  "null": false },
		programID: { type: schema.String, index: true,  "null": false },
		headend: { type: schema.String, index: true,  "null": false },
		airDateTime: { type: schema.Date,  "null": false },
		duration: { type: schema.Number,  "null": false },
		audioProperties: { type: schema.JSON,  "null": false },
		descriptionLanguage: { type: schema.JSON,  "null": false },
		md5: { type: schema.String,  "null": false },
		broadcaster: { type: schema.JSON,  "null": false },
		videoProperties: { type: schema.JSON,  "null": false },
		new: { type: schema.Boolean,  "null": false },
		active: { type: schema.Boolean, "null": false }
	}, {
		primaryKeys: ["id","stationID","headend"]
	});
		
	Schedules.prototype.addSchedules = function(schedule, headend, callback) {
		if(!Array.isArray(schedule.programs)) {
			callback('schedule required');
		}
		schedule.programs.forEach((v) => {
			this.updateOrCreate({ headend: headend, programID: v.programID }, v, (err, newdoc) => {
				debug(err)
				callback(err);
			});
		});
	}
	
	// Headends methods
	Headends.prototype.add = function (headend, callback) {
		if(!headend) {
			callback('headend required');
		}
		this.updateOrCreate({ lineup: headend.lineup }, headend, (err, newdoc) => {
			debug(err)
			callback(err, newdoc);
		});
	};
	
	epg.Models = schema.models;
};
