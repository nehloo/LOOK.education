/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { BlockTitle } from 'framework7-react';

import DatabaseRequest from '../frameworks/DatabaseRequest';

export default class CollectionPageBreadcrumbs extends Component {

  render() {

    return (
      <>
      { DatabaseRequest.GetValue(this.props.collection, "parentCollection") &&
        <BlockTitle className="padding-horizontal-desktop-only no-margin-top wrap line-height-breadcrumbs">
          <a href={ "/collection/" + DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "topCollection")) }><b>{ DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.props.collection, "topCollection"), "title") }</b></a>
          { DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "parentCollection")) != DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "topCollection")) &&
            <>
              &nbsp; > ... > &nbsp;
              <a href={ "/collection/" + DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "parentCollection")) }>{ DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.props.collection, "parentCollection"), "title") }</a>
            </>
          }
          &nbsp; > &nbsp;
          <a href={ "/collection/" + DatabaseRequest.GetId(this.props.collection) }>{ this.props.title }</a>
        </BlockTitle>
      }
      </>
    )
  }
}