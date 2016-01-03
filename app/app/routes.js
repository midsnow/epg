import Home from './pages/home';
import Settings from './pages/settings';
import Disconnect from './pages/disconnect';
import Card from './pages/component/card';
import { isObject } from 'lodash';
import Debug from 'debug';

let debug = Debug('epg:app:routes');

let routes = {
	settings: {
		index: Settings.Index,
		add: Settings.Index,
		lineup: Settings.lineup
	},
	guide: Settings.lineup,
	disconnected: Disconnect,
	home: Home,
};
routes['404'] = Home;

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
		
	} else {
		return routes['404'];
	}	
}

export default routeConfig
