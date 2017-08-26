
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import Main from './fetch.js';

import React from 'react';
import ReactDOM from 'react-dom';


ReactDOM.render(<Main />, document.getElementById('app'));

