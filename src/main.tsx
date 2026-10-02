import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/main.css';
import './styles/grid-lines.css';
import './styles/wp-style.css';
import 'mouse-follower/dist/mouse-follower.min.css';
import { initSvgConverter } from './utils/svgConverter';

// Automatically convert SVG image paths to inline SVGs
initSvgConverter();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
