import React, { PureComponent } from "react";
import Debug from 'debug';

let debug = Debug('epg:app:pages:epg:components:images');

export default class ImageBank extends PureComponent {
	constructor(props) {
		super(props);
		
	}
	
	render() {
		return this.props.images.map( ( i, k ) => {
			if ( !i.uri ) {
				return
			}
			let bgimage = i.uri.search('http') > -1 ? i.uri : 'https://json.schedulesdirect.org/20141201/image/' + i.uri
			bgimage = "url('"+bgimage+"')";
			
			return (<div className="col-xs-4 col-sm-3 col-md-3" >
				<div style={{
					margin: 5,
					height: 75,
					backgroundImage: bgimage,
					backgroundSize: 'contain',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					cursor: 'pointer'
				}} onClick={e => this.props.switchImage(e, k)} />
			</div>);
		});
	}
}
