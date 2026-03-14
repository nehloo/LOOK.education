/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';
import { Page, Navbar, List, ListItem, Icon } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest';

export default () => {
  const currentUser = DatabaseRequest.GetCurrentUser();
  return (
    <Page>
      <Navbar title="Navigation" />
      <List>
        <ListItem link="/" view="#main-view" panelClose title="Home" after={<Icon f7="house_fill" />} />
        { currentUser &&
          <ListItem link={ "/" + DatabaseRequest.GetId(currentUser) } view="#main-view" panelClose title="My Collections" after={<Icon f7="layers_alt_fill" />} />
        }
        { currentUser &&
          <ListItem link="/favorites" view="#main-view" panelClose title="My Favorites" after={<Icon f7="star_fill" />} />
        }
        <ListItem link="/latest" view="#main-view" panelClose title="Latest Content" after={<Icon f7="timer" />} />
        <ListItem link="/quizzes" view="#main-view" panelClose title="Quizzes &amp; Surveys" after={<Icon f7="checkmark_seal_fill" />} />
      </List>
    </Page>
  );
};
