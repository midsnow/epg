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
		postal: { type: schema.Number, index: true, unique: true },
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
		stationID: { type: schema.Number, index: true, unique: true },
		name: { type: schema.String, index: true },
		headend: { type: schema.String, index: true },
		callsign: { type: schema.String },
		affiliate: { type: schema.String },
		broadcastLanguage: { type: schema.JSON },
		descriptionLanguage: { type: schema.JSON },
		logicalChannelNumber: { type: schema.String },
		broadcaster: { type: schema.JSON },
		logo: { type: schema.JSON },
		isCommercialFree: { type: schema.Boolean },
		active: { type: schema.Boolean }
	});
	
	var Schedules = schema.define('Schedules', {
		stationID: { type: schema.Number, index: true },
		programID: { type: schema.String, index: true },
		headend: { type: schema.String, index: true },
		airDateTime: { type: schema.Date },
		duration: { type: schema.Number },
		audioProperties: { type: schema.JSON },
		descriptionLanguage: { type: schema.JSON },
		md5: { type: schema.String },
		broadcaster: { type: schema.JSON },
		videoProperties: { type: schema.JSON },
		new: { type: schema.Boolean },
		active: { type: schema.Boolean },
		cableInTheClassroom: { type: schema.Boolean },
		catchup: { type: schema.Boolean },
		continued: { type: schema.Boolean },
		educational: { type: schema.Boolean },
		joinedInProgress: { type: schema.Boolean },
		leftInProgress: { type: schema.Boolean },
		premiere: { type: schema.Boolean },
		programBreak: { type: schema.Boolean },
		ratings: { type: schema.JSON },
		repeat: { type: schema.Boolean },
		signed: { type: schema.Boolean },
		subjectToBlackout: { type: schema.Boolean },
		timeApproximate: { type: schema.Boolean },
		liveTapeDelay: { type: schema.Boolean },
		isPremiereOrFinale: { type: schema.Boolean },
	}, {
		primaryKeys: ["id","stationID","headend"]
	});
	
	var Programs = schema.define('Programs', {
		programID: { type: schema.String, index: true },
		eventDetails: { type: schema.JSON },
		originalAirDate: { type: schema.Date },
		titles: { type: schema.JSON },
		descriptions: { type: schema.JSON },
		genres: { type: schema.JSON },
		md5: { type: schema.String },
		episodeTitle150: { type: schema.String },
		metadata: { type: schema.JSON },
		cast: { type: schema.JSON },
		crew: { type: schema.JSON },
		showType: { type: schema.String },
		hasImageArtwork: { type: schema.Boolean, "null": false },
		
	}, {
		primaryKeys: ["programID"]
	});
	
	epg.Models = schema.models;
};
