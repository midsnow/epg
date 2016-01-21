importScripts('/epg-files/jspm_packages/system.js');

System
	.import('/epg-files/config.js')
	.then(function() {
		//System.import('live-reload').catch(console.error.bind(console));
		System.import('dependencies').catch(console.error.bind(console));
		System.import('app/common/workers/guideData').catch(console.error.bind(console));	

	})
	.catch(console.error.bind(console));

