import React from 'react';
import Debug from 'debug'

let debug = Debug('snowelectric:app:pages:base');


	class Base extends React.Component {
		constructor(props) {
			super(props)
			this.displayName = 'Base'
			this.state = { html: props.response }
			this.props = props
		}
		render() {
			
			const menu = '';
			return (<div>
				<div className="page-header page-header">
					
				</div>
				<div className="container">
					<div className="row">
						<div className="col-sm-3">
							<div dangerouslySetInnerHTML={{ __html: menu }} />
						</div>
						<div className="col-sm-9">
							<div className="docs-content">{this.props.children}</div>
						</div>
					</div>
				</div>
			</div>)
		}
	}

	export default Base
