import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';
import './styles.css';
import axios from 'axios';


axios.defaults.withCredentials = true;

var mountNode = document.getElementById('app');
ReactDOM.render(<App />, mountNode);
