/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { AccordionItem, AccordionContent, AccordionToggle, Chip, Icon } from 'framework7-react';

import CollectionPageAdminMenuLinks from "./CollectionPageAdminMenuLinks";
import DatabaseRequest from '../frameworks/DatabaseRequest'
import F7Utils from "../utils/F7Utils";

export default class CollectionPageAdminMenu extends Component {

  render() {

    let app = this.$f7;

    const isOwner = DatabaseRequest.GetId(DatabaseRequest.GetValue(this.props.collection, "user")) == DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());
    var subscribersCount = DatabaseRequest.GetValue(this.props.collection, "subscribersCount");
    if (!subscribersCount || subscribersCount === undefined) {
      subscribersCount = 0;
    }

    return (
      <>
      { !F7Utils.IsLargeScreen(app) &&
        <>
          { !F7Utils.IsLargeScreen(app) && isOwner && !DatabaseRequest.GetValue(this.props.collection, "parentCollection") &&
            <a href={ "/subscribers/" + DatabaseRequest.GetId(this.props.collection) }><Chip className="float-right margin-right" text={ subscribersCount + " " + ((subscribersCount == 1) ? "subscriber" : "subcribers") } mediaBgColor="gray">
              <Icon slot="media" ios="f7:people" aurora="f7:people" md="material:people"></Icon>
            </Chip></a>
          }
          { isOwner &&
            <AccordionItem key={0}>
              <AccordionToggle>
                <Chip className="margin-left" text="Action Menu" color="yellow" textColor="black" mediaBgColor="black" style={{ cursor:"pointer" }}>
                  <Icon slot="media" ios="f7:menu" aurora="f7:menu" md="f7:bars"></Icon>
                </Chip>
              </AccordionToggle>
              <AccordionContent>
                <br />
                <CollectionPageAdminMenuLinks collection={ this.props.collection } subscribers={ this.props.subscribers } />
              </AccordionContent>
            </AccordionItem>
          }
        </>
      }
      { F7Utils.IsLargeScreen(app) &&
        <CollectionPageAdminMenuLinks collection={ this.props.collection } subscribers={ this.props.subscribers } />
      }
      </>
    )
  }
}