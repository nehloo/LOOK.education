/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

//import 'framework7/css/bundle'; // ✅ Core F7 styles
//import Framework7 from 'framework7/lite-bundle'; // ✅ Lightweight core
//import Framework7React from 'framework7-react'; // ✅ React integration
//Framework7.use(Framework7React); // ✅ Register React plugin

import React from 'react';
import {
  App,
  Panel,
  View
} from 'framework7-react';

import routes from '../js/routes';

export default function (props) {

  // Framework7 parameters here
  const f7params = {
    id: 'com.nehloo.look', // App bundle ID
    name: 'LOOK.education', // App name
    theme: 'md', // Automatic theme detection
    routes,
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

  console.log("starting displaying the page");

  console.log(routes);

  return (
    <App params={f7params}>
      {/* Statusbar */}
      <div className="statusbar"></div>

      {/* Left Panel */}
      <Panel left cover themeDark>
        <View url="/panel-left/" />
      </Panel>

      {/* Right Panel */}
      <Panel right reveal themeDark>
        <View url="/panel-right/" />
      </Panel>

      {/* Main View */}
      <View
        id="main-view"
        url="/"
        main
        className="safe-areas"
        pushState={true}
        pushStateSeparator=""
        pushStateRoot=""
        router
        routerInit={true}
      />
    </App>
  );
};