/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import React from 'react';

import CollectionListCards from './CollectionListCards';

import DatabaseRequest from "../frameworks/DatabaseRequest"
import F7Utils from "../utils/F7Utils"

export default class CollectionList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collections: [],
      searchTerm: null
    };
    this.getData = this.getData.bind(this);
  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.searchTerm != this.state.searchTerm) {
      this.getData();
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.searchTerm != prevState.searchTerm) {
      return {
        searchTerm: nextProps.searchTerm
      }
    }
    return null;
  }

  getData = async() => {
    F7Utils.SetDocumentTitle(null);
    var shouldFetchCollections = true;
    var equalTo = {};
    var containedIn = null;
    var fullText = null;
    var doesNotExist = false;
    var ascending = false;
    var descending = false;
    if (this.state.searchTerm) {
      if (!fullText) fullText = {};
      fullText.title = this.props.searchTerm;
    }
    else {
      if (this.props.userId) {
        equalTo.user = DatabaseRequest.GetPointerById("_User", this.props.userId);
      }
      if (this.props.parentCollectionId) {
        equalTo.parentCollection = DatabaseRequest.GetPointerById("Collections", this.props.parentCollectionId);
        descending = "order";
      }
      else {
        if (this.props.favorites) {
          ascending = "title";
        }
        else {
          descending = "order,updatedAt";
          doesNotExist = "parentCollection";
        }
      }
      var userCollectionsPreferences;
      if (this.props.favorites) {
        F7Utils.SetDocumentTitle("Favorites");
        userCollectionsPreferences = await DatabaseRequest.FetchObjects({
          class: "CollectionsPreferences",
          equalTo: {
            user: DatabaseRequest.GetCurrentUser(),
            favorited: true
          },
          limit: 1000
        });
        if (userCollectionsPreferences) {
          for (var object of userCollectionsPreferences) {
            if (!containedIn) containedIn = [];
            containedIn.push(DatabaseRequest.GetId(DatabaseRequest.GetValue(object, "collection")));
          }
        }
      }
      if (this.props.favorites && !containedIn) {
        shouldFetchCollections = false; // avoid fetching all collections, if there are zero favorites
      }
    }
    if (shouldFetchCollections) {
      const queryTopCollectionsNotDeleted = DatabaseRequest.CreateQuery({
        class: "Collections",
        notEqualTo: {
          deleted: true
        }
      });
      var include = ["user", "providersCount"];
      if (this.props.favorites || this.state.searchTerm) {
        include.push("parentCollection");
        include.push("topCollection");
      }
      const collections = await DatabaseRequest.FetchObjects({
        class: "Collections",
        equalTo: equalTo,
        fullText: fullText,
        containedIn: {
          objectId: containedIn
        },
        notEqualTo: {
          deleted: true
        },
        matchesQuery: {
          topCollection: queryTopCollectionsNotDeleted
        },
        doesNotExist: doesNotExist,
        include: include,
        ascending: ascending,
        descending: descending,
        limit: 1000
      });
      this.setState({ collections:collections });
      if (this.props.userId) {
        if (collections) {
          if (collections.length) {
            F7Utils.SetDocumentTitle(DatabaseRequest.GetValue(DatabaseRequest.GetValue(collections[0], "user"), "brand"));
          }
        }
        DatabaseRequest.LogUserAction({
          "action": "filter",
          "targetUser": { "__type": "Pointer", "className": "_User", "objectId": this.props.userId }
        });
      }
      if (this.state.searchTerm) {
        DatabaseRequest.LogUserAction({
          "action": "search",
          "searchTerm": this.state.searchTerm
        });
      }
    }
    // tell the parent that the collections were fetched, so it may display the videos
    if (this.props.collectionsDidFetch) {
      this.props.collectionsDidFetch();
    }
  }

  render() {
    return (
      <CollectionListCards collections={this.state.collections} parentCollectionId={ this.props.parentCollectionId } showTopCollectionTitle={ (this.props.favorites ? true : false) } />
    )
  }
}