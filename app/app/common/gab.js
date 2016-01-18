import {EventEmitter} from 'events';

class Gab extends EventEmitter {
	constructor(props) {
		super(props)
	
		this.guideUpdates = [];
		
	}
	reset() {
		this.guideUpdates = [];
	}
}

export default new Gab()
