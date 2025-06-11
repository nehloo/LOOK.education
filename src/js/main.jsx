/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

// Import React and ReactDOM
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import Framework7
import Framework7 from 'framework7/bundle';

// Import Framework7-React Plugin
import Framework7React from 'framework7-react';

// Import Framework7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import App component
import App from '../components/App.jsx';

// Init Framework7-React plugin
Framework7.use(Framework7React);

// Mount React App
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
  console.log("created root");
} else {
  console.error("❌ Could not find #root div");
}

/* function insertGoogleAnalytics() {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', import.meta.env.REACT_APP_GOOGLE_ANALYTICS, 'auto');
    ga('send', 'pageview');
} */