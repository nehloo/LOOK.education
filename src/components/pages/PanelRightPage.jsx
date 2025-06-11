/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';
import { Block, Page, Navbar, Link, List, ListItem } from 'framework7-react';

import DatabaseRequest from "../frameworks/DatabaseRequest";
import F7Utils from '../utils/F7Utils';

export default class extends React.Component {

  logOut = () => {
    let app = this.$f7;
    app.dialog.confirm('', 'Log out?', async() => {
      const user = DatabaseRequest.GetCurrentUser();
      await DatabaseRequest.UserLogOut();
      DatabaseRequest.LogUserAction({
        "action": "logout",
        "user": user
      });
      window.location.reload();
    });
  }

  setUserInfo = (prompt, field) => {
    let app = this.$f7;
    app.dialog.prompt('', prompt, async(newValue) => {
      if (newValue && newValue != DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), field)) {
        DatabaseRequest.SetValue(DatabaseRequest.GetCurrentUser(), field, newValue);
        await DatabaseRequest.SaveObject(DatabaseRequest.GetCurrentUser());
        window.location.reload();
      }
    }, function() {}, DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), field) : '');
    F7Utils.FocusPromptInput(this);
  }

  setUserName = () => {
    this.setUserInfo("Your Name or Organization Name:", "brand");
  }
  setUserLogo = () => {
    this.setUserInfo("URL/Link To Your Photo or Logo:", "logo");
  }
  setUserJobTitle = () => {
    this.setUserInfo("Your Job Title or Headline:", "jobTitle");
  }
  setUserJobOrganization = () => {
    this.setUserInfo("Your Company or Organization (or location or slogan, for brands):", "jobOrganization");
  }

  componentDidMount() {
    if (DatabaseRequest.GetCurrentUser()) {
      if (!DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "brand"))
        this.setUserName();
      if (!DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "jobTitle"))
        this.setUserJobTitle();
      if (!DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "jobOrganization"))
        this.setUserJobOrganization();
      if (!DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "logo"))
        this.setUserLogo();
    }
  }

  render() {
    return (
      <Page>
        <Navbar title={ DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "brand") : 'Unknown User' } />
        <span className="margin-left">{ DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "email") : 'unknown email' }</span>
        <List>
          <ListItem title="Edit Your Name / Brand..." link="#" view="#main-view" onClick={ () => this.setUserName() }></ListItem>
          <ListItem title="Change Your Photo..." link="#" view="#main-view" onClick={ () => this.setUserLogo() }></ListItem>
        </List>
        <List>
          <ListItem title="Your Job Title / Headline..." link="#" view="#main-view" onClick={ () => this.setUserJobTitle() } footer={ DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "jobTitle") : '' }></ListItem>
          <ListItem title="Organization / Location..." link="#" view="#main-view" onClick={ () => this.setUserJobOrganization() } footer={ DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "jobOrganization") : '' }></ListItem>
        </List>
        <List>
          <ListItem title="Log Out" link="#" view="#main-view" onClick={ this.logOut }></ListItem>
        </List>
        { DatabaseRequest.GetCurrentUser() &&
          <Block>
            <Link color="blue" href="https://github.com/nehloo/look-education" external target="_blank"><b>LOOK.education</b></Link>
            <Link color="blue" href="https://github.com/nehloo/look-education" external target="_blank">Open-source Visual LMS</Link>
            <br />
            2019 &copy; Nehloo Foundation, Inc.
            <br /><br />
          </Block>
        }
      </Page>
    );
  }
}
