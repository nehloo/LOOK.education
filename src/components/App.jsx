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

import {
  App,
  Panel,
  View
} from 'framework7-react';

import routes from '../js/routes';

export default function (props) {
  const f7params = {
    id: 'com.nehloo.look', // App bundle ID
    name: 'LOOK.education', // App name
    theme: 'md', // Automatic theme detection
    routes,
    pushState: true,
    pushStateSeparator: '',
    pushStateRoot: '',
    /* on: {
      pageAfterIn: function (page) {
        if (page.direction == undefined || page.direction == 'forward') {
          ga('send', {
             'hitType': 'event',
             'eventCategory': 'Navigation',
             'eventAction': 'Open Page',
             'eventLabel': page.name,
             'page': window.location.pathname
         });
        }
      },
      pageInit: function (e, page) {
        // This will run when the page is initialized
        console.log('HomePage initialized!');
      },
    } */
  };

  return (
    <App params={f7params}>
      <div className="statusbar"></div>

      <Panel left cover themeDark>
        <View url="/panel-left/" />
      </Panel>

      <Panel right reveal themeDark>
        <View url="/panel-right/" />
      </Panel>

      <View
        id="main-view"
        url="/"
        main
        name="main"
        className="safe-areas"
        router
        routerInit={true}
        routes={routes}
      />
    </App>
  );
};