/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Page, Navbar, NavLeft, Link, Block, NavTitle, Icon, Row } from 'framework7-react';

import ContentCard from './ContentCard';
import CollectionPageAuthor from './CollectionPageAuthor'
import DatabaseRequest from "../frameworks/DatabaseRequest"
import CollectionUtils from "../utils/CollectionUtils"
import F7Utils from "../utils/F7Utils"

export default class UserContentAnalyticsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: null,
      contentAnalytics: null,
      user: null,
      topCollection: null
    }
  }

  async componentDidMount() {
    var userId = this.props.userId;
    if (!userId) {
      userId = DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser());
    }
    if (userId) {
      const filter = {
        include: ["user", "content", "content.collection", "content.collection.topCollection"]
      }
      if (this.props.collectionId) {
        filter.topCollectionId = this.props.collectionId;
      }
      const contentAnalytics = await CollectionUtils.FetchContentAnalyticsForUser(userId, filter);
      if (contentAnalytics.length) {
        const user = DatabaseRequest.GetValue(contentAnalytics[0], "user");
        const topCollection = DatabaseRequest.GetValue(DatabaseRequest.GetValue(contentAnalytics[0], "collection"), "topCollection");
        const content = contentAnalytics.map(function(object){return DatabaseRequest.GetValue(object, "content")});
        this.setState({ content:content, contentAnalytics:contentAnalytics, user:user, topCollection:topCollection });
        F7Utils.SetDocumentTitle("Analytics | " + DatabaseRequest.GetValue(topCollection, "title"));
      }
    }
  }

  render() {

    return (
      <Page>
        <Navbar bgColor="white">
          <NavLeft colorTheme="black" style={{ width:"40px" }}>
            <Link back animate={DatabaseRequest.GetCurrentUser() ? !DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "accessibilityReduceMotion") : false}><Icon f7="arrow_left"></Icon></Link>
          </NavLeft>
          <NavTitle colorTheme="black"><Link className="no-margin-left no-padding-left" href="/" external><img alt="" src="/static/img/look-education-sticker.png" height="50" /></Link></NavTitle>
        </Navbar>

        <div style={{ zIndex:"-10000", position:"absolute", top:0, width:"100%", height:"50%", opacity:0.1, backgroundImage:"linear-gradient(black, white)" }}></div>

        { this.state.content && this.state.contentAnalytics &&
          <>
          { this.state.topCollection &&
          <Block className="padding-horizontal-desktop-only">
            <h1 className="margin-left no-margin-bottom">User Activity</h1>
            { this.props.collectionId &&
              <a href={ "/collection/" + DatabaseRequest.GetId(this.state.topCollection) }><h3 className="margin-left no-margin-top">{ DatabaseRequest.GetValue(this.state.topCollection, "title") }</h3></a>
            }
          </Block>
          }

          <Block className="padding-horizontal-desktop-only">
            <CollectionPageAuthor user={ this.state.user } isOwner={ true } />
          </Block>

          <Row className="justify-content-flex-start">
            {this.state.content.map((content, index) => {
              const contentAnalytics = this.state.contentAnalytics.find(item => DatabaseRequest.GetId(DatabaseRequest.GetValue(item, "content")) == DatabaseRequest.GetId(content));
              return (
                <ContentCard key={ DatabaseRequest.GetId(content) } content={ content } contentAnalytics={ contentAnalytics } showCollectionTitle={ true } />
              )}
            )}
          </Row>
          </>
        }
        
      </Page>
    );
  }
}