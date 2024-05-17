/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Block, Link } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest';

export default class CollectionPageAuthor extends Component {

  render() {

    var logo = DatabaseRequest.GetValue(this.props.user, 'logo');
    if (!logo) {
      logo = '/static/img/user-logo.png';
    }

    const url = this.props.isOwner ? ("/" + DatabaseRequest.GetId(this.props.user)) : ("/" + DatabaseRequest.GetId(this.props.user) + "/analytics/" + this.props.topCollectionId);
    const isOwner = DatabaseRequest.GetId(this.props.user) == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());

    return (
      <Link noLinkClass href={ url }>
        <div className={ "margin-horizontal padding-horizontal-desktop-only" + (this.props.isOwner ? "" : " padding-vertical elevation-hover-5 elevation-transition") + ((isOwner && !this.props.isOwner) ? " elevation-3" : "") }>
          <img alt="" className="user-image rounded elevation-3 elevation-hover-5 elevation-transition" src={ logo } width="64" height="64" />
          <div className="user-info">
            <Block className="no-margin no-padding">
              <strong>{ DatabaseRequest.GetValue(this.props.user, 'brand') ? DatabaseRequest.GetValue(this.props.user, 'brand') : "[Name not set]" }</strong>
            </Block>
            { DatabaseRequest.GetValue(this.props.user, "jobTitle") &&
              <Block textColor="black" className="no-margin no-padding">
                { DatabaseRequest.GetValue(this.props.user, "jobTitle") }
              </Block>
            }
            { DatabaseRequest.GetValue(this.props.user, "jobOrganization") &&
              <Block textColor="black" className="no-margin no-padding">
                { DatabaseRequest.GetValue(this.props.user, "jobOrganization") }
              </Block>
            }
            { !this.props.isOwner &&
              <Block textColor="gray" className="no-margin no-padding">
                { DatabaseRequest.GetValue(this.props.user, "username") }
              </Block>
            }
          </div>
        </div>
      </Link>
    )
  }
}