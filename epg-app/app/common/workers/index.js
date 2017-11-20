importScripts('/epg-app/jspm_packages/system.js');

System
	.import('/epg-app/config.js')
	.then(function() {
		System.import('dependencies').catch(console.error.bind(console));
		System.import('app/common/workers/guideData').catch(console.error.bind(console));	

	})
	.catch(console.error.bind(console));

