/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import Framework7
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-React Plugin
import Framework7React, { f7ready } from 'framework7-react';

// Import Framework7 Styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Init Framework7-React plugin
Framework7.use(Framework7React);

f7ready((f7) => {
  // console.log("✅ Framework7 ready with routes:", f7.views.main.router.routes);
});

// Import App component
import App from '../components/App.jsx';

// Mount React App
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);

/* function insertGoogleAnalytics() {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', import.meta.env.REACT_APP_GOOGLE_ANALYTICS, 'auto');
    ga('send', 'pageview');
} */