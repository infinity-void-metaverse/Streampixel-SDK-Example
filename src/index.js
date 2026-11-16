import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
// StrictMode stays on: in development React then runs every effect twice, which
// is exactly the case the AbortSignal passed to StreamPixel.create() covers (see
// the effect "Start a stream" in App.js). Without the signal, two sessions start.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
