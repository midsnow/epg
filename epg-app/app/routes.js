import Home from './pages/home';
import Settings from './pages/settings';
import Disconnect from './pages/disconnect';
import Guide from './pages/guide';
import Status from './pages/status';
import Card from './pages/component/card';
import { isObject } from 'lodash';
import Debug from 'debug';
import FourZeroFour from './pages/404.js';
import Config from './pages/config';
import EPG from './pages/epg';
import EPGs from './pages/epg/index';
let debug = Debug('epg:app:routes');
import App from './render.js';
let Routes = [];

// add each page

Routes.push({ path: '404', component: FourZeroFour });
// redirects
function sendTo404(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/404')
}
Routes.push({ path: 'lost', onEnter: sendTo404 });

function sendToSettings(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/epg')
}
Routes.push({ path: 'settings', onEnter: sendToSettings })


function sendToAdd(nextState, replaceState) {
	replaceState({ nextPathname: nextState.location.pathname }, '/epg/add-lineup')
}
Routes.push({ path: 'add', onEnter: sendToAdd })

Routes =  [ ...Routes, 
		{ path: 'home', component: Home }, 
		{ path: 'configuration', component: Config }, 
		{ path: 'lineup', component: Settings.lineup },
		{ path: 'lineup/:station', component: Settings.lineup },
		{ path: 'lineup/:station/:action', component: Settings.lineup },
		{ path: 'disconnected', component: Disconnect },
		{ path: 'add-lineup', component: Settings.Index },
		{ path: 'status', component: Status },
		{ path: 'guide', component: Guide },
		//{ path: 'guide', component: EPGs.Home },
		//{ path: 'guide/:group', component: EPGs.Home },
		//{ path: 'channels', component: EPGs.Channels },
		//{ path: 'channels/:group', component: EPGs.Channels },
		//{ path: 'channels/:group/', component: EPGs.Channels },
		//{ path: 'channel/:channel', component: EPGs.Home },
		//{ path: 'channel/:channel/:episode', component: EPGs.Home },
		//{ path: 'scheduled', component: EPGs.Timers },
		//{ path: 'series', component: EPGs.Series },
		//{ path: 'season-passes', component: EPGs.Series },
		//{ path: 'recordings', component: EPGs.Recordings },
    ];

const tv = {
    path: '/tv',
    component: EPG,
    indexRoute: { component: EPGs.Home },
    catchAll: { component: EPGs.Home },
    childRoutes: [
		{ path: 'guide', component: EPGs.Home },
		{ path: 'guide/:group', component: EPGs.Home },
		{ path: 'channels', component: EPGs.Channels },
		{ path: 'channels/:group', component: EPGs.Channels },
		{ path: 'channels/:group/', component: EPGs.Channels },
		{ path: 'channel/:channel', component: EPGs.Home },
		{ path: 'channel/:channel/:episode', component: EPGs.Home },
		{ path: 'scheduled', component: EPGs.Timers },
		{ path: 'series', component: EPGs.Series },
		{ path: 'season-passes', component: EPGs.Series },
		{ path: 'recordings', component: EPGs.Recordings },
    ]
};

Routes.push( tv )
Routes.push({ path: '*', component: FourZeroFour })

// export
export const routeConfig = [
  { path: '/epg',
    component: App,
    indexRoute: { component: Home },
    catchAll: { component: FourZeroFour },
    childRoutes: Routes
  },
  { path: '/',
    component: App,
    indexRoute: { component: Home },
    catchAll: { component: FourZeroFour },
    childRoutes: Routes
  }
]

export const staticConfig = [
  { path: '/noscript/',
    component: App,
    indexRoute: { component: Home },
    catchAll: { component: FourZeroFour },
    childRoutes: Routes
  }
]

export default routeConfig
