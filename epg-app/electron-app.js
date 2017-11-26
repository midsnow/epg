System
	.import('./config.js')
	.then(() => {
		return {}
		//return System.import('dependencies')
	})
	.then(() => System.import('app/app'))
	.catch(console.error.bind(console));
	

