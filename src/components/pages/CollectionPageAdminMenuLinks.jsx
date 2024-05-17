/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Chip, Icon, Link, Popover, List, ListItem, ListInput, Button } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest'
import CollectionUtils from '../utils/CollectionUtils'
import UserUtils from '../utils/UserUtils'
import F7Utils from "../utils/F7Utils"

export default class CollectionPageAdminMenuLinks extends Component {
  constructor(props) {
    super(props);
    this.contentUrl;
    this.emailInvitee;
    this.titleSubcollection;
    this.chipElement;
    this.handleAddSubcollection = this.handleAddSubcollection.bind(this);
    this.handleSendInvite = this.handleSendInvite.bind(this);
    this.handleAddContent = this.handleAddContent.bind(this);
    this.deleteTopCollection = this.deleteTopCollection.bind(this);
    this.togglePublicPrivate = this.togglePublicPrivate.bind(this);
    this.toggleFormDisplay = this.toggleFormDisplay.bind(this);
  }

  handleAddSubcollection = async (event) => {
    event.preventDefault();
    let app = this.$f7;
    let router = this.$f7.views.main.router; // $f7router is not available in sub-components
    var subCollection = await CollectionUtils.AddSubcollection(this.titleSubcollection, this.props.collection);
    if (subCollection) {
      router.navigate('/collection/' + DatabaseRequest.GetId(subCollection));
    }
    else {
      app.dialog.alert(error.message, () => {
      });
    };
  }

  handleSendInvite = async (event) => {
    event.preventDefault();
    if (!this.emailInvitee) {
      let app = this.$f7;
      app.dialog.alert("", "Please enter an email address.", () => {
        return;
      });
      return;
    }
    const user = await UserUtils.GetUserByEmail(this.emailInvitee);
    if (user) {
      if (this.props.collection) {
        const role = await UserUtils.GetRoleByName("guests-" + DatabaseRequest.GetId(this.props.collection));
        if (role) {
          if (await UserUtils.AddUserToRoleForCollection(user, role, this.props.collection)) {
            DatabaseRequest.LogUserAction({
              "action": "invite",
              "collection": this.props.collection,
              "userInvited": user,
              "emailInvited": this.emailInvitee
            });
            window.location.reload();
          }
        }
      }
    }
    else {
      let app = this.$f7;
      app.dialog.alert(this.emailInvitee, "User not found:", () => {
      });
    }
  }

  handleAddContent = async (event) => {
    event.preventDefault();
    F7Utils.SetChipIconTextForTarget(this.chipElement, "reload");
    let app = this.$f7;
    try {
      const content = await CollectionUtils.AddContentToCollection(this.contentUrl, this.props.collection);
      if (content) {
        DatabaseRequest.LogUserAction({
          "action": "create",
          "collection": this.props.collection,
          "content": content
        });
        window.location.reload();
      }
    } catch(error) {
      app.dialog.alert(error.message, () => {
      });
    }
  }

  deleteTopCollection = async () => {
    if (!this.props.collection) {
      return;
    }
    let app = this.$f7;
    app.dialog.confirm("If you archive this collection, you won't be able to find it listed on your main page, and you'll no longer have access to any of its content.", "Archive this collection?", () => {
      app.dialog.confirm("", "Are you sure you want to archive this collection?", async() => {
        if (await CollectionUtils.DeleteCollection(this.props.collection)) {
          window.location.assign('/');
        }
      });
    });
  }

  togglePublicPrivate = async () => {
    if (DatabaseRequest.HasPublicReadAccess(this.props.collection)) {
      let app = this.$f7;
      app.dialog.confirm("The entire content in this collection, including all content in all subcollections, will only be accessible privately to its subscribers, including yourself.", "Make this collection private?", () => {
        app.dialog.confirm("", "Are you sure you want to make this collection private?", async() => {
          await CollectionUtils.TogglePublicPrivate(this.props.collection);
          this.setState({ collection: this.props.collection });
        });
      });
    }
    else {
      let app = this.$f7;
      app.dialog.confirm("The entire content in this collection, including all content in all subcollections, will be accessible publicly for anyone to view (read-only access).", "Enable public access for this collection?", () => {
        app.dialog.confirm("", "Are you sure you want to make this collection public for anyone to see?", async() => {
          await CollectionUtils.TogglePublicPrivate(this.props.collection);
          this.setState({ collection: this.props.collection });
        });
      });
    }
  }

  toggleFormDisplay = (element, event) => {
    let $$ = this.$$;
    if (element !== "formAddSubcollection") $$(".formAddSubcollection").addClass("display-none");
    if (element !== "formAddContent") $$(".formAddContent").addClass("display-none");
    if (element !== "formSendInvite") $$(".formSendInvite").addClass("display-none");
    if ($$("." + element).hasClass("display-none")) {
      $$("." + element).removeClass("display-none");
    }
    else {
      $$("." + element).addClass("display-none");
    }
    try {
      this.chipElement = event.currentTarget;
    } catch(e) {}
  }

  render() {

    let app = this.$f7;

    const isOwner = DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "user")) == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());
    var subscribersCount = DatabaseRequest.GetValue(this.props.collection, "subscribersCount");
    if (!subscribersCount || subscribersCount === undefined) {
      subscribersCount = 0;
    }

    return (
      <>
      { !this.props.subscribers && DatabaseRequest.GetCurrentUser() &&
        <>
        { isOwner &&
          <>
          <div className="margin-bottom">
          <Chip className="elevation-hover-3 elevation-transition margin-left" text="Add Subcollection" mediaBgColor="blue" onClick={ () => this.toggleFormDisplay('formAddSubcollection') } style={{ cursor:"pointer" }}>
            <Icon slot="media" ios="f7:add_round" aurora="f7:add_round" md="f7:add_round"></Icon>
          </Chip>
          <Chip className="elevation-hover-3 elevation-transition margin-left" text="Add Content" mediaBgColor="red" onClick={ (event) => this.toggleFormDisplay('formAddContent', event) } style={{ cursor:"pointer" }}>
            <Icon slot="media" ios="f7:add_round" aurora="f7:add_round" md="f7:add_round"></Icon>
          </Chip>
          { !DatabaseRequest.GetValue(this.props.collection, "parentCollection") &&
            <>
            <Chip className="elevation-hover-3 elevation-transition margin-left" text="Invite People" mediaBgColor="orange" onClick={ () => this.toggleFormDisplay('formSendInvite') } style={{ cursor:"pointer" }}>
              <Icon slot="media" ios="f7:people" aurora="f7:people" md="material:people"></Icon>
            </Chip>

            { F7Utils.IsLargeScreen(app) && isOwner &&
              <a href={ "/subscribers/" + DatabaseRequest.GetId(this.props.collection) }><Chip className="elevation-hover-3 elevation-transition margin-left" text={ subscribersCount + " " + ((subscribersCount == 1) ? "member" : "members") } mediaBgColor="gray">
                <Icon slot="media" ios="f7:people" aurora="f7:people" md="material:people"></Icon>
              </Chip></a>
            }

            <Chip className="elevation-hover-3 elevation-transition margin-left" text={ DatabaseRequest.HasPublicReadAccess(this.props.collection) ? "Public" : "Private" } mediaBgColor={ DatabaseRequest.HasPublicReadAccess(this.props.collection) ? "purple" : "gray" } onClick={ () => { this.toggleFormDisplay('formNULL'); this.togglePublicPrivate(); } } style={{ cursor:"pointer" }}>
              <Icon slot="media" f7={ DatabaseRequest.HasPublicReadAccess(this.props.collection) ? "world" : "lock" }></Icon>
            </Chip>
            
            <Link popoverOpen=".popover-menu" noLinkClass><Chip outline className="elevation-hover-3 elevation-transition margin-left" text="Settings" mediaTextColor="gray" style={{ cursor:"pointer" }}>
              <Icon slot="media" ios="f7:settings_fill" aurora="f7:settings_fill" md="f7:settings_fill"></Icon>
            </Chip></Link>
            <Popover className="popover-menu">
              <List>
                <ListItem link="#" popoverClose title="Archive collection" className="text-color-red" onClick={ this.deleteTopCollection } />
              </List>
            </Popover>
            </>
          }
          </div>

          <List form className="formAddSubcollection display-none">
            <ListInput
              outline
              label="Create a subcollection"
              type="text"
              placeholder="Enter a title for your subcollection..."
              className="text"
              onInput={(e) => {
                this.titleSubcollection = e.target.value;
              }}
              onChange={(e) => {
              }}
            />
            <Button raised large fill color="blue" onClick={ this.handleAddSubcollection }>Create a Subcollection</Button>
          </List>
          
          <List form className="formAddContent display-none">
            <ListInput
              outline
              label="URL to content"
              type="text"
              placeholder="Enter a link to YouTube, Vimeo, DailyMotion, Facebook..."
              className="text"
              onInput={(e) => {
                this.contentUrl = e.target.value;
              }}
              onChange={(e) => {
              }}
            />
            <Button raised large fill color="red" onClick={ this.handleAddContent }>Add To My Collection</Button>
          </List>
          
          { !DatabaseRequest.GetValue(this.props.collection, "parentCollection") &&
            <List form className="formSendInvite display-none">
              <ListInput
                outline
                label="Invite others to access this collection"
                type="email"
                placeholder="Enter an email address..."
                className="text"
                onInput={(e) => {
                  this.emailInvitee = e.target.value.toLowerCase();
                }}
                onChange={(e) => {
                }}
              />
              <Button raised large fill color="orange" onClick={ this.handleSendInvite }>Send Invite</Button>
            </List>
          }
          </>
        }
        </>
      }
      </>
    )
  }
}