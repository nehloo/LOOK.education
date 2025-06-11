/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { BlockTitle, Icon, Chip, Link } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest';
import CollectionUtils from '../utils/CollectionUtils';
import F7Utils from '../utils/F7Utils';

export default class CollectionPageTitle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: this.props.collection,
      userCollectionsPreferences: this.props.userCollectionsPreferences
    }
    this.toggleFavorite = this.toggleFavorite.bind(this);
  }

  async componentDidMount() {
    if (!this.state.userCollectionsPreferences && this.state.collection) {
      var userCollectionsPreferences = await CollectionUtils.GetUserPreferencesForCollection(this.state.collection);
      this.setState({ userCollectionsPreferences:userCollectionsPreferences });
    }
  }

  renameCurrentCollection = async () => {
    let app = this.$f7;
    app.dialog.prompt('', "Rename Collection:", async(newTitle) => {
      if (await CollectionUtils.RenameCollection(this.state.collection, newTitle)) {
        this.setState({ collection:this.state.collection });
      }
    }, function(cancel) {}, DatabaseRequest.GetValue(this.state.collection, "title"));
    F7Utils.FocusPromptInput(this);
  }

  toggleFavorite = async (event) => {
    //const eventCurrentTarget = event.currentTarget;
    //const originalIcon = F7Utils.GetChipIconTextFromTarget(eventCurrentTarget);
    //F7Utils.SetChipIconTextForTarget(eventCurrentTarget, "reload");
    var userCollectionsPreferences = await CollectionUtils.ToggleFavorite(this.state.collection, this.state.userCollectionsPreferences);
    //F7Utils.SetChipIconTextForTarget(eventCurrentTarget, String(originalIcon));
    if (userCollectionsPreferences) {
      this.setState({ userCollectionsPreferences:userCollectionsPreferences });
    }
  }
  
  render() {

    const title = DatabaseRequest.GetValue(this.state.collection, 'title');
    const isOwner = DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.collection, "user")) == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());

    return (
      <BlockTitle large className="padding-horizontal-desktop-only">
        <h1 className="no-margin-vertical margin-right wrap">
        { title &&
          title
        }
        { !title &&
          <span className="skeleton-text skeleton-effect-blink">Collection Title</span>
        }
        { !this.props.titleOnly &&
        <>
        &nbsp;
        { isOwner &&
          <Chip className="elevation-hover-3 elevation-transition margin-right" text="Rename" mediaBgColor="gray" style={{ cursor:"pointer" }} onClick={ this.renameCurrentCollection }>
            <Icon slot="media" ios="f7:edit" aurora="f7:edit" md="f7:edit"></Icon>
          </Chip>
        }
        { DatabaseRequest.GetCurrentUser() &&
          <Chip className="elevation-hover-3 elevation-transition margin-right" text="Favorite" mediaBgColor={ DatabaseRequest.GetValue(this.state.userCollectionsPreferences, "favorited") ? "orange" : "gray" } style={{ cursor:"pointer" }} onClick={ this.toggleFavorite }>
            <Icon slot="media" ios="f7:star_fill" aurora="f7:star_fill" md="f7:star_fill"></Icon>
          </Chip>
        }
        <Link noLinkClass href={ "/" + DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser()) + "/analytics/" + DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.collection, "topCollection")) } collectionId={ DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.collection, "topCollection")) }><Chip className="elevation-hover-3 elevation-transition margin-right" text="My Activity" mediaBgColor="orange">
          <Icon slot="media" f7="eye"></Icon>
        </Chip></Link>
        </>
        }
        </h1>
      </BlockTitle>
    )
  }
}