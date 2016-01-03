
// end globals
import React from 'react';
import { render } from 'react-dom'
import App from './render.js'
import Debug from 'debug'

window.myDebug = Debug

render( <App />, document.getElementById('epg'));


