var Epg = require('./lib/epg');

let EPG = new Epg();

EPG.init({ env: 'development' })
.then(() => EPG.server())
.catch(console.error.bind(console));
