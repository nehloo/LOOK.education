/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Chip, Icon, Link } from 'framework7-react';

import CollectionUtils from '../utils/CollectionUtils';
import DatabaseRequest from '../frameworks/DatabaseRequest';
import F7Utils from '../utils/F7Utils';

export default class HomePageMenuLinks extends Component {

  addCollection = async () => {
    if (!DatabaseRequest.GetCurrentUser()) {
      return;
    }
    let app = this.$f7;
    app.dialog.prompt('', "New Collection Title:", async(newTitle) => {
      let router = this.$f7.views.main.router; // $f7router is not available in sub-components
      const collection = await CollectionUtils.AddNewCollection(newTitle);
      if (collection) {
        DatabaseRequest.LogUserAction({
          "action": "create",
          "collection": collection
        });
        router.navigate('/collection/' + DatabaseRequest.GetId(collection));
      }
    }, function(cancel) {}, "");
    F7Utils.FocusPromptInput(this);
  }

  render() {

    return (
      <>
      <Link animate={false} noLinkClass href={ this.props.latest ? "/" : "/latest" }><Chip className="elevation-hover-3 elevation-transition margin-left" text={ this.props.latest ? "All Collections" : "Latest Content" } mediaBgColor="teal">
        <Icon slot="media" f7={ this.props.latest ? "layers_alt_fill" : "timer" }></Icon>
      </Chip></Link>
      { this.props.onePerLine &&
        <br />
      }
      <Chip className="elevation-hover-3 elevation-transition margin-left" text="New Collection" mediaBgColor="blue" onClick={ this.addCollection } style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:add_round" aurora="f7:add_round" md="material:add_circle"></Icon>
      </Chip>
      { this.props.onePerLine &&
        <br />
      }
      <Link animate={false} noLinkClass href={ "/" + (this.props.userId ? "" : (DatabaseRequest.GetCurrentUser() ? DatabaseRequest.GetCurrentUser().id : "")) }><Chip className="elevation-hover-3 elevation-transition margin-left" text={ this.props.userId ? "All Collections" : "My Collections" } mediaBgColor="red" style={{ cursor:"pointer" }}>
        <Icon slot="media" f7={ this.props.userId ? "layers_alt_fill" : "person" }></Icon>
      </Chip></Link>
      { this.props.onePerLine &&
        <br />
      }
      <Link noLinkClass href="/activity"><Chip className="elevation-hover-3 elevation-transition margin-left" text="My Activity" mediaBgColor="orange">
        <Icon slot="media" f7="eye"></Icon>
      </Chip></Link>
      { this.props.onePerLine &&
        <br />
      }
      <Link animate={false} noLinkClass href={ this.props.favorites ? "/" : "/favorites" }><Chip className="elevation-hover-3 elevation-transition margin-left" text={ this.props.favorites ? "All Collections" : "Favorites" } mediaBgColor="orange" style={{ cursor:"pointer" }}>
        <Icon slot="media" f7={ this.props.favorites ? "layers_alt_fill" : "star_fill" }></Icon>
      </Chip></Link>
      { this.props.onePerLine &&
        <br />
      }
      <Link animate={false} noLinkClass href={ this.props.quizzes ? "/" : "/quizzes" }><Chip className="elevation-hover-3 elevation-transition margin-left" text={ this.props.quizzes ? "All Collections" : "Quizzes" } mediaBgColor="purple" style={{ cursor:"pointer" }}>
        <Icon slot="media" f7={ this.props.quizzes ? "layers_alt_fill" : "check" }></Icon>
      </Chip></Link>
      {/* { this.props.onePerLine &&
        <br />
      }
      <Chip className="margin-left" text="Courses" mediaBgColor="orange" style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:bookmark" aurora="f7:bookmark" md="f7:book_fill"></Icon>
      </Chip>
      { this.props.onePerLine &&
        <br />
      }
      <Chip className="margin-left" text="Friends" mediaBgColor="yellow" style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:people" aurora="f7:people" md="material:people"></Icon>
      </Chip>
      { this.props.onePerLine &&
        <br />
      }
      <Chip className="margin-left" text="Recent" mediaBgColor="yellow" style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:layers_alt_fill" aurora="f7:layers_alt_fill" md="f7:layers_alt_fill"></Icon>
      </Chip>
      { this.props.onePerLine &&
        <br />
      }
      <Chip className="margin-left" text="Public" mediaBgColor="green" style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:cloud" aurora="f7:cloud" md="material:cloud"></Icon>
      </Chip>
      { this.props.onePerLine &&
        <br />
      }
      <Chip className="margin-left" text="Search" mediaBgColor="gray" style={{ cursor:"pointer" }}>
        <Icon slot="media" ios="f7:search" aurora="f7:search" md="material:search"></Icon>
      </Chip> */}
      </>
    )
  }
}