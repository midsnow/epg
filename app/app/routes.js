import Home from './pages/home';
import Settings from './pages/settings';
import Disconnect from './pages/disconnect';
import Guide from './pages/guide';
import Status from './pages/status';
import Card from './pages/component/card';
import { isObject } from 'lodash';
import Debug from 'debug';
import fourofour from './pages/404.js';

let debug = Debug('epg:app:routes');

let routes = {
	'add-lineup': Settings.Index,
	lineup: Settings.lineup,
	guide: Settings.lineup,
	disconnected: Disconnect,
	status: Status,
	settings: Home,
	guide: Guide,
	redirect: {
		add: 'add-lineup',
		home: 'settings'
	}
};
routes['404'] = fourofour;

const routeConfig = function(route, child) {
	debug(route, child, isObject(routes[route]));
	if(routes[route]) {
		if(isObject(routes[route]) && 'function' !== typeof routes[route]) {
			if(routes[route][child]) {
				return routes[route][child];
			} else {
				return routes['404'];
			}
		} else {
			return routes[route];
		}
		
	} else if(routes.redirect[route]) {
		return routes[routes.redirect[route]]	
	} else {
		return routes['404'];
	}	
}

export default routeConfig
