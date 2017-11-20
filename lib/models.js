var caminte = require('caminte');
var Schema = caminte.Schema;
var debug = require('debug')('epg:lib:models');
var Promise = require('bluebird');

exports = module.exports = function models() {
	var epg = this;	
	
	var db = this.get('database');
	
	debug('start db', db);
	
	try {
		var schema  = new Schema( db.driver, db );
	} catch( e ) {
		debug('Error Caminte', e );
		this._connected.db = false;
	}
	
	var Headends = schema.define('Headends', {
		name: { type: schema.String, index: true },
		lineup: { type: schema.String, "null": false, unique: true, },
		uri: { type: schema.String, "null": false, unique: true },
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
	var Groups = schema.define('Groups', {
		name: { type: schema.String, index: true },
	});
	
	
	var ChannelGroupMap = schema.define('ChannelGroupMap', {
		group: { type: schema.Number, index: true, "null": false },
		channel: { type: schema.Number, index: true, "null": false },
	});
	
	// relationships
	//ChannelGroupMap.belongsTo(Groups, {as: 'group', foreignKey: 'id'});
	Groups.hasMany(ChannelGroupMap,   {as: 'group',  foreignKey: 'group'});
	
	
	var Channels = schema.define('Channels', {
		channel: { type: schema.String, index: true, "null": false },
		headend: { type: schema.String, index: true, "null": false },
		uhfVhf: { type: schema.String, "null": false },
		stationID: { type: schema.Number, index: true },
		atscMajor: { type: schema.String, "null": false },
		atscMinor: { type: schema.String, "null": false},
		providerCallsign: { type: schema.String, "null": false },
		logicalChannelNumber: { type: schema.String, "null": false },
		matchType: { type: schema.String, "null": false },
		frequencyHz: { type: schema.String, "null": false },
		serviceID: { type: schema.String, "null": false  },
		networkID: { type: schema.String, "null": false },
		transportID: { type: schema.String, "null": false },
		deliverySystem: { type: schema.String, "null": false },
		symbolrate: { type: schema.String, "null": false },
		fec: { type: schema.String, "null": false },
		polarization: { type: schema.String, "null": false },
		channelMinor: { type: schema.String, "null": false },
		channelMajor: { type: schema.String, "null": false },
		virtualChannel: { type: schema.String, "null": false },
		active: { type: schema.Boolean, default: 0 }
	});
	
	Channels.belongsTo(ChannelGroupMap, {as: 'group', foreignKey: 'channel'});
	
	Channels.scope('active', { active : true });
	
	Channels.afterSave = function (next) {
		//debug('after save channel');
		Channels.activate({
			on: this.active,
			id: this.id
		})
		.then( () => {
			// Pass control to the next
			next();
		});
		
	};
	Channels.afterUpdate = function (next) {
		//debug('after update channel');
		/*Channels.activate({
			on: this.active,
			id: this.id
		})
		.then( () => {
			// Pass control to the next
			next();
		});
		* */
	};
	
	Channels.activate = function( params ) {
		return new Promise( ( resolve, reject ) => {
			if ( params.on ) {
				//activate
				Channels.update({ where: { id: params.id } }, { active: 1 }, ( err, doc ) => {
					debug(doc)
					Groups.findOne({ where: { name: 'All Channels' } }, ( err, doc2 ) => {
						//debug(doc2)
						if( doc2 ) {
							try {
								let cmap = new ChannelGroupMap({
									channel: params.id,
									group: doc2.id
								});
								if ( cmap ) {
									//debug(cmap)
									cmap.save( ( e, doc3 ) => {
										if ( e ) {
											debug('error adding to group', e);
										}
										resolve({
											success: true
										});
									});
								} else {
									resolve({
										success: true
									});
								}
							} catch(e) {
								resolve({
									success: true
								});
							}
						} else {
							resolve({
								success: true
							});
						}
						
					});
				});
			} else {
				// deactivate
				Channels.update({ where: { id: params.id } }, { active: 0 }, ( err, doc ) => {
					Groups.find({ where: { name: 'All Channels' } }, ( err, doc2 ) => {
						if( doc2 ) {
							try {
								ChannelGroupMap.remove({ 
									where: { 
										channel: doc.id, 
										group: doc2.id
									}								
								},( err ) => {
									resolve({
										success: true
									});	
								});
							} catch(e) {
								//debug(e);
								resolve({
									success: true
								});
							}
						} else {
							resolve({
								success: true
							});
						}
					});
				});
			}
		});
	}
	
	// relationships
	Channels.belongsTo(ChannelGroupMap, {as: 'group', foreignKey: 'channel'});
	
	var Stations = schema.define('Stations', {
		stationID: { type: schema.Number, unique: true },
		name: { type: schema.String, index: true, "null": false },
		headend: { type: schema.String, index: true, "null": false },
		callsign: { type: schema.String , "null": false},
		affiliate: { type: schema.String, "null": false },
		broadcastLanguage: { type: schema.JSON, "null": false },
		descriptionLanguage: { type: schema.JSON, "null": false },
		logicalChannelNumber: { type: schema.String, "null": false },
		broadcaster: { type: schema.JSON, "null": false },
		logo: { type: schema.JSON, "null": false },
		isCommercialFree: { type: schema.Boolean, "null": false },
		active: { type: schema.Boolean, default: 0 }
	});
	
	Stations.scope('active', { active : true });
	
	var Schedules = schema.define('Schedules', {
		stationID: { type: schema.Number, index: true  },
		programID: { type: schema.String, index: true  },
		headend: { type: schema.String, index: true  },
		airDateTime: { type: schema.Number, "null": false },
		airDateEndTime: { type: schema.Number, "null": false },
		duration: { type: schema.Number, "null": false },
		audioProperties: { type: schema.JSON, "null": false },
		descriptionLanguage: { type: schema.JSON, "null": false },
		md5: { type: schema.String, "null": false },
		broadcaster: { type: schema.JSON, "null": false },
		videoProperties: { type: schema.JSON, "null": false },
		"new": { type: schema.Boolean, "null": false },
		active: { type: schema.Boolean, "null": false },
		cableInTheClassroom: { type: schema.Boolean, "null": false },
		catchup: { type: schema.Boolean , "null": false},
		continued: { type: schema.Boolean, "null": false },
		educational: { type: schema.Boolean, "null": false },
		joinedInProgress: { type: schema.Boolean, "null": false },
		leftInProgress: { type: schema.Boolean, "null": false },
		premiere: { type: schema.Boolean, "null": false },
		programBreak: { type: schema.Boolean , "null": false},
		ratings: { type: schema.JSON , "null": false},
		repeat: { type: schema.Boolean, "null": false },
		signed: { type: schema.Boolean, "null": false },
		subjectToBlackout: { type: schema.Boolean, "null": false },
		timeApproximate: { type: schema.Boolean, "null": false },
		liveTapeDelay: { type: schema.Boolean , "null": false},
		isPremiereOrFinale: { type: schema.Boolean, "null": false },
		/* from program requests */
		eventDetails: { type: schema.JSON, "null": false, default: {}   },
		originalAirDate: { type: schema.Number, "null": false  },
		title: { type: schema.String, "null": false, default: 'Not Available'  },
		titles: { type: schema.JSON, "null": false , default: {}  },
		descriptions: { type: schema.JSON, "null": false , default: {}  },
		genres: { type: schema.JSON, "null": false , default: {}  },
		md5Program: { type: schema.String, "null": false  },
		episodeTitle150: { type: schema.String, "null": false  },
		metadata: { type: schema.JSON, "null": false, default: {}   },
		contentAdvisory: { type: schema.JSON, "null": false, default: {}   },
		contentRating: { type: schema.JSON, "null": false, default: {}   },
		recommendations: { type: schema.JSON, "null": false, default: {}   },
		cast: { type: schema.JSON, "null": false, default: {}   },
		movie: { type: schema.JSON, "null": false, default: {}   },
		crew: { type: schema.JSON, "null": false, default: {}  },
		showType: { type: schema.String, "null": false  },
		entityType: { type: schema.String, "null": false  },
		hasImageArtwork: { type: schema.Boolean, "null": false  },
		episodeImage: { type: schema.JSON, default: {}  },
		
	});
	
	var Programs = schema.define('Programs', {
		programID: { type: schema.String },
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
		hasImageArtwork: { type: schema.Boolean },
		
	}, {
		primaryKeys: ["programID"]
	});
	
	epg.Models = schema.models;
	this._connected.db = true;
	
	schema.adapter.autoupdate(function() {
		debug('end db');
	})
	
	
};
