importScripts('/epg-app/app/common/workers/cfg.js');

System
	.import('/epg-app/config.js')
	.then(function() {
		System.config({
			 paths: {
				"github:*": "/epg-app/jspm_packages/github/*",
				"npm:*": "/epg-app/jspm_packages/npm/*",
				"dependencies": "/epg-app/bundles/dependencies"
			 },
		});
		//System.import('dependencies').catch(console.error.bind(console));
		System.import('./app.js').catch(console.error.bind(console));	

	})
	.catch(console.error.bind(console));

