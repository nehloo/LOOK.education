/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';
import {
  App,
  Panel,
  View,
  Statusbar
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
    } */
  };

  return (
    <App params={f7params}>
      {/* Statusbar */}
      <Statusbar />

      {/* Left Panel */}
      <Panel left cover themeDark>
        <View url="/panel-left/" />
      </Panel>

      {/* Right Panel */}
      <Panel right reveal themeDark>
        <View url="/panel-right/" />
      </Panel>

      {/* Main View */}
      <View id="main-view" url="/" main className="safe-areas" pushState={true} pushStateSeparator="" pushStateRoot="" />
    </App>
  );
};