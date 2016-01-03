// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone'),
	bone = require('bone.io'),
	async = require('async'),
	Live = require('keystone-live');
var epg = require('./lib/epg.js');
var util = require('util');

var dashes = '\n------------------------------------------------\n';
// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

	'name': 'EPG',
	'brand': 'inquisive',
	'rooms': {},
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'jade',
	'signin redirect': '/',
	'signin url': '/signin',
	'signout redirect': '/',
	'emails': 'templates/emails',
	'port':'48433',
	'socket port':'48433',
	'socket ssl': false,
	'auto update': true,
	'session': true,
	'auth': false,
	'user model': 'User',
	'cookie secret': 'sifgjs9p8g743wqhp8g79wqhg80qq'

});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'Timer' : ['timers', 'action-logs', 'rooms'],
	'users': 'users',
	'posts': ['posts', 'post-categories']
	
});

// Start Keystone to connect to your database and initialise the web server

keystone.start({
  onMount: function() {
    Live.apiRoutes();
  },
	onStart: function() {
		Live.
			live().
			list();
		epg.init();

		epg.on('ready', function() {
			console.log('ready');
			//epg.agent.headends('30082');
			//epg.agent.lineupAdd('USA-GA10428-X');
			//epg.agent.lineupMap('USA-GA10428-X');
		});

		epg.on('headends', function(status) {});

		epg.on('lineupAdd', function(status) {
			
			console.log('lineupAdd', util.inspect(status, {showHidden: false, depth: null}));
			
		});

		epg.on('token', function(update) {
			
			console.log(update);
			
		});

	
  }
});
