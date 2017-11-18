import electron from './electron'; 
import Gab from './gab';

const Menu = electron.remote.require('menu');
const MenuItem = electron.remote.require('menu-item');

const currentWindow = electron.remote.getCurrentWindow();

let rightClickPosition = null;

const menu = new Menu();
menu.append(new MenuItem({ label: 'Add File', click: () => {
	Gab.ipc.send('open-file-dialog');
} }));
menu.append(new MenuItem({ label: 'Fullscreen', click: () => {
	if(currentWindow.isFullScreen()) {
	  currentWindow.setFullScreen(false);
	} else {
	  currentWindow.setFullScreen(true);
	}
} }));
menu.append(new MenuItem({ label: 'Inspect Element', click: () => {
	currentWindow.inspectElement(rightClickPosition.x, rightClickPosition.y);
} }));
menu.append(new MenuItem({ label: 'Reload', click: () => {
	currentWindow.reload();
} }));


window.addEventListener('contextmenu', function(e) {
	  e.preventDefault();
	  rightClickPosition = {x: e.x, y: e.y};
	  menu.popup(currentWindow);
}, false);
