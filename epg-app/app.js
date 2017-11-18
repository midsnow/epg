System.baseURL = "/epg-app";
System
	.import('config.js')
	.then(function() {
		
		System.trace = true;
		return System.import('systemjs-hot-reloader')
		.then( HotReloader => {
			new HotReloader.default('10.2.2.12:3888', path => {
				return path.replace('/home/snow/projects/github/ism-epg-sd/epg-app/', '');
			})  // chokidar-socket-emitter port
		});
	})
	.then(() => System.import('dependencies'))
	.then(() => System.import('app/app'))
	.catch(console.error.bind(console));
	

