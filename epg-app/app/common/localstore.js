import localforage from 'localforage';
import Debug from 'debug';

let debug = Debug('epg:app:common:localstore');

var Store = function( opts ) {
	this.store = localforage.createInstance({
		driver      : opts.driver || localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
		name        : opts.name || 'EPG',
		version     : opts.version || 1.0,
		size        : opts.size || 4980736, // Size of database, in bytes. WebSQL-only for now.
		storeName   : opts.store || 'epg', // Should be alphanumeric, with underscores.
		description : opts.desc || 'MAin store'
	});
}

Store.prototype.setItem = function( key, value ) {
	return this.store.setItem( String( key ), value, ( err, value ) => {
		//debug('set', key, '=', value);
	}); 
}

Store.prototype.getItem = function( key ) {
	return this.store.getItem( String( key ) );
}

Store.prototype.removeItem = function( key ) {
	return this.store.removeItem( String( key ) ); 
}

Store.prototype.all = function( ){

    var archive = {};

    return this.store.iterate(( value, key, iterationNumber ) => {
		archive[key] = value;
	})
	.then(() => {
		debug('done with all');
		return archive;
	})
	.catch( ( err ) => {
		debug( err );
		return {};
	});
}


export default Store;

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


