import localforage from 'localforage';
import Debug from 'debug';

let debug = Debug('epg:app:common:localstore');

var store = function() {

}

store.prototype.setItem = function(key, value, callback) {
	let cb = isCallback(callback);
	localforage.setItem(String(key), value, function(err, value) {
		debug('set', key, '=', value);
		cb(err, value);
	}); 
}

store.prototype.getItem = function(key, callback) {
	let cb = isCallback(callback);
	localforage.getItem(String(key), cb);
}

store.prototype.removeItem = function(key, callback) {
	let cb = isCallback(callback);
	localStorage.removeItem(String(key), cb); 
}

store.prototype.getStation = function(id, callback) {
	let cb = isCallback(callback);
	this.getItem(id, cb);
}

store.prototype.getStations = function(stations, callback){

    var archive = {};

    localforage.iterate(function(value, key, iterationNumber) {
		if(stations.indexOf(key)) {
			archive[key] = value;
		}
	}, function(err) {
		callback(err, archive);
	});
}

store.prototype.allStorage = function(callback){

    var archive = {};

    localforage.iterate(function(value, key, iterationNumber) {
		archive[key] = value;
	}, function(err) {
		callback(err, archive);
	});
}


export default new store();

function haveProgram(program) {
	if(program === Object(program)) {
		return true;
	} else {
		return false;
	}
}

function isCallback(callback) {
	if(typeof callback === 'function') {
		return callback;
	} else {
		return function(err, data) {};
	}
}


