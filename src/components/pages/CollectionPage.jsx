/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React, { Component } from 'react';
import { Page, Navbar, NavLeft, Link, Block, NavTitle, Icon, Progressbar, BlockHeader } from 'framework7-react';

import CollectionList from './CollectionList';
import ContentCard from './ContentCard';
import CollectionPageAccessDenied from './CollectionPageAccessDenied'
import CollectionPageTitle from './CollectionPageTitle'
import CollectionPageAuthor from './CollectionPageAuthor'
import CollectionPageBreadcrumbs from './CollectionPageBreadcrumbs'
import CollectionPageAdminMenu from './CollectionPageAdminMenu'
import DatabaseRequest from "../frameworks/DatabaseRequest"
import CollectionUtils from "../utils/CollectionUtils"
import F7Utils from "../utils/F7Utils"
import UserUtils from '../utils/UserUtils';

export default class CollectionPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: null,
      accessDenied: false,
      collectionsDidFetch: false,
      content: null,
      contentAnalytics: null,
      contentUrl: '',
      emailInvitee: '',
      titleSubcollection: '',
      subscribers: null,
      userCollectionsPreferences: null,
      showProgressBar: false
    };
    this.timeout = null;
    this.collectionsDidFetch = this.collectionsDidFetch.bind(this);
  }

  collectionsDidFetch() {
    this.setState({ collectionsDidFetch:true });
  }

  getContentForCollection = async (collection) => {
    if (collection) {
      const content = await CollectionUtils.FetchContentForCollection(collection);
      if (content) {
        const contentAnalytics = await CollectionUtils.FetchContentAnalyticsForContentList(content);
        if (contentAnalytics) {
          this.setState({ contentAnalytics:contentAnalytics });
        }
        F7Utils.SetDocumentTitle(DatabaseRequest.GetValue(collection, "title") + " | " + DatabaseRequest.GetValue(DatabaseRequest.GetValue(collection, "topCollection"), "title"));
      }
      clearTimeout(this.timeout);
      this.setState({ showProgressBar:false, collection:collection, content:content });
    }
    else {
      clearTimeout(this.timeout);
      this.setState({ showProgressBar:false });
    }
  }

  async componentDidMount() {
    // TODO: don't reload when returning back from higher level page
    var collection;
    if (this.props.collection) {
      collection = this.props.collection;
    }
    else if (this.props.collectionId) {
      collection = await CollectionUtils.GetCollectionById(this.props.collectionId);
    }
    if (collection) {
      const _this = this;
      this.timeout = setTimeout(function () {
        _this.setState({ showProgressBar:true });
      }, 3000);
      if (!this.state.userCollectionsPreferences) {
        var userCollectionsPreferences = await CollectionUtils.GetUserPreferencesForCollection(collection);
        if (userCollectionsPreferences) {
          this.setState({ userCollectionsPreferences:userCollectionsPreferences });
        }
      }
      if (this.props.subscribers) {
        clearTimeout(this.timeout);
        const subscribers = await CollectionUtils.FetchSubscribersForCollection(collection);
        this.setState({ showProgressBar:false, collection:collection, subscribers:subscribers });
        F7Utils.SetDocumentTitle("Members of " + DatabaseRequest.GetValue(collection, "title"));
      }
      else {
        _this.getContentForCollection(collection);
      }
    }
    else {
      clearTimeout(this.timeout);
      this.setState({ accessDenied:true, showProgressBar:false });
    }
    DatabaseRequest.LogUserAction({
      "action": "visit",
      "collection": collection
    });
  }

  render() {

    return (
      <Page>
        <Navbar bgColor="white">
          <NavLeft colorTheme="black" style={{ width:"40px" }}>
            <Link back animate={DatabaseRequest.GetCurrentUser() ? !DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "accessibilityReduceMotion") : false}><Icon f7="arrow_left"></Icon></Link>
          </NavLeft>
          <NavTitle colorTheme="black"><Link className="no-margin-left no-padding-left" href="/" external><img alt="" src="./img/look-education-sticker.png" height="50" /></Link></NavTitle>
        </Navbar>

        <div style={{ zIndex:"-10000", position:"absolute", top:0, width:"100%", height:"50%", opacity:0.1, backgroundImage:"linear-gradient(black, white)" }}></div>

        { this.state.accessDenied &&
          <CollectionPageAccessDenied collection={ this.state.collection } collectionId={ this.props.collectionId } />
        }

        { !this.state.accessDenied && this.state.collection &&
          <>

          { this.props.subscribers &&
            <Block className="padding-horizontal-desktop-only">
              <h1 className="margin-left no-margin-bottom">{ this.state.subscribers.length - 1 } members</h1>
              <a href={ "/collection/" + DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.collection, "topCollection")) }><h3 className="margin-left no-margin-top">{ DatabaseRequest.GetValue(DatabaseRequest.GetValue(this.state.collection, "topCollection"), "title") }</h3></a>
            </Block>
          }

          { !this.props.subscribers &&
            <>
            <CollectionPageTitle collection={ this.state.collection } userCollectionsPreferences={ this.state.userCollectionsPreferences } />
            
            <CollectionPageBreadcrumbs title={ DatabaseRequest.GetValue(this.state.collection, 'title') } collection={ this.state.collection } />
            
            { !this.props.subscribers &&
              <CollectionPageAuthor user={ DatabaseRequest.GetValue(this.state.collection, "user") } isOwner={ true } hideEmail={ true } />
            }
            </>
          }

          <Block className="no-padding-top">

            { !this.props.subscribers &&
              <CollectionPageAdminMenu collection={ this.state.collection } subscribers={ this.state.subscribers } />
            }

            { this.props.subscribers &&
              <div className="justify-content-flex-start">
                {this.state.subscribers.map((subscriber) =>
                  <div key={ DatabaseRequest.GetId(subscriber) } tabletWidth="33" className="col-100 padding-bottom">
                    <CollectionPageAuthor user={ subscriber } topCollectionId={ DatabaseRequest.GetId(DatabaseRequest.GetValue(this.state.collection, "topCollection")) } />
                  </div>
                )}
              </div>
            }

          </Block>

          { this.state.showProgressBar && !this.props.subscribers && !this.state.collectionsDidFetch &&
          <Block inset>
            <BlockHeader>
              <Progressbar className="skeleton-effect-blink skeleton-text margin-vertical" progress={0} />
            </BlockHeader>
          </Block>
          }

          { !this.props.subscribers &&
            <CollectionList className="collectionList" parentCollectionId={ DatabaseRequest.GetId(this.state.collection) } collectionsDidFetch={ this.collectionsDidFetch } />
          }
          
          { this.state.showProgressBar && !this.state.content && !this.props.subscribers &&
          <Block inset>
            <BlockHeader>
              <Progressbar className="skeleton-effect-blink skeleton-text margin-vertical" progress={0} />
            </BlockHeader>
          </Block>
          }

          { !this.props.subscribers && this.state.collectionsDidFetch && this.state.contentAnalytics && this.state.content &&
            <div className="justify-content-flex-start">
              {this.state.content.map((content, index) => {
                const contentAnalytics = this.state.contentAnalytics.find(item => DatabaseRequest.GetId(DatabaseRequest.GetValue(item, "content")) == DatabaseRequest.GetId(content));
                return (
                  <ContentCard key={ DatabaseRequest.GetId(content) } content={ content } contentAnalytics={ contentAnalytics } />
                )}
              )}
            </div>
          }

          </>
        }
        
      </Page>
    );
  }
}