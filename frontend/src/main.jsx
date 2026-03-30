import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import SigningPage from './components/SigningPage.jsx';

const isSigningRoute = window.location.pathname.startsWith('/sign/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSigningRoute ? <SigningPage /> : <App />}
  </React.StrictMode>
);
