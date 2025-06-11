/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import DatabaseRequest from "../frameworks/DatabaseRequest"
import VideoUtils from "../utils/VideoUtils"
import JSUtils from "./JSUtils"

const CollectionUtils = {

  /*
  |--------------------------------------------------------------------------
  | GetCollectionById
  |--------------------------------------------------------------------------
  |
  | Returns the collection with the specified ID
  |
  */
  GetCollectionById: async (collectionId) => {
    if (!collectionId) return false;
    const queryTopCollectionsNotDeleted = DatabaseRequest.CreateQuery({
      class: "Collections",
      notEqualTo: {
        deleted: true
      }
    });
    const collection = await DatabaseRequest.FetchObjects({
      class: "Collections",
      equalTo: {
        objectId: collectionId
      },
      notEqualTo: {
        deleted: true
      },
      matchesQuery: {
        topCollection: queryTopCollectionsNotDeleted
      },
      include: [
        "parentCollection",
        "topCollection"
      ],
      limit: 1
    });
    if (collection) return collection;
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchSubscribersForCollection
  |--------------------------------------------------------------------------
  |
  | Returns all subscribers for a collection
  |
  */
  FetchSubscribersForCollection: async (collection) => {
    if (!collection) return false;
    const subscribers = await DatabaseRequest.FetchObjects({
      relation: DatabaseRequest.GetValue(collection, "subscribers"),
      class: "_User",
      ascending: "brand",
      limit: 1000
    });
    if (subscribers) return subscribers;
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | DefaultSelectForFetchContent
  |--------------------------------------------------------------------------
  |
  | Returns the default columns to be selected during a content query
  |
  */
  DefaultSelectForFetchContent: () => {
    return [
      "title",
      "thumbnail",
      "authorName",
      "type",
      "provider",
      "user.id",
      "duration",
      "collection.title",
      "collection.topCollection.title",
      "quizPreferences"
    ]
  },

  /*
  |--------------------------------------------------------------------------
  | FetchContentForCollection
  |--------------------------------------------------------------------------
  |
  | Returns all content for a collection
  |
  */
  FetchContentForCollection: async (collection) => {
    if (!collection) return false;
    const content = await DatabaseRequest.FetchObjects({
      class: "Content",
      equalTo: {
        collection: collection
      },
      select: CollectionUtils.DefaultSelectForFetchContent(),
      ascending: "createdAt",
      limit: 1000
    });
    if (content) return content;
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchContentAnalyticsForContentList
  |--------------------------------------------------------------------------
  |
  | Returns all content anaytics for a list/array of content objects
  |
  */
  FetchContentAnalyticsForContentList: async (content) => {
    if (!content) return false;
    var contentIds = content.map(contentObject => DatabaseRequest.GetId(contentObject));
    if (contentIds.length) {
      const contentAnalytics = await DatabaseRequest.FetchObjects({
        class: "ContentAnalytics",
        equalTo: {
          user: DatabaseRequest.GetCurrentUser()
        },
        containedIn: {
          content: contentIds
        }
      });
      for (var contentObject of content) {
        if (!contentAnalytics.find(item => DatabaseRequest.GetId(DatabaseRequest.GetValue(item, "content")) == DatabaseRequest.GetId(contentObject))) {
          contentAnalytics.push(CollectionUtils.CreateNewContentAnalytics(contentObject));
        }
      }
      if (contentAnalytics) return contentAnalytics;
    }
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | RenameContent
  |--------------------------------------------------------------------------
  |
  | Renames a content item
  |
  */
  RenameContent: async (content, newTitle) => {
    if (newTitle && newTitle != DatabaseRequest.GetValue(content, "title")) {
      DatabaseRequest.SetValue(content, "title", newTitle);
      await DatabaseRequest.SaveObject(content);
      return content;
    }
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | RenameCollection
  |--------------------------------------------------------------------------
  |
  | Renames a collection
  |
  */
  RenameCollection: async (collection, newTitle) => {
    if (newTitle && newTitle != DatabaseRequest.GetValue(collection, "title")) {
      DatabaseRequest.SetValue(collection, "title", newTitle);
      await DatabaseRequest.SaveObject(collection);
      return collection;
    }
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | DeleteCollection
  |--------------------------------------------------------------------------
  |
  | Deletes a collection
  |
  */
  DeleteCollection: async (collection) => {
    if (collection) {
      DatabaseRequest.SetValue(collection, "deleted", true);
      await DatabaseRequest.SaveObject(collection);
      return collection;
    }
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | TogglePublicPrivate
  |--------------------------------------------------------------------------
  |
  | Toggles the access status of a collection, public or private
  |
  */
  TogglePublicPrivate: async (collection) => {
    let topCollection = DatabaseRequest.GetValue(collection, "topCollection") ? DatabaseRequest.GetValue(collection, "topCollection") : collection;
    let newAccessStatus = !DatabaseRequest.HasPublicReadAccess(collection);
    let topCollectionACL = DatabaseRequest.GetACL(topCollection);
    DatabaseRequest.SetPublicReadAccess(topCollectionACL, newAccessStatus);
    DatabaseRequest.SetACL(topCollection, topCollectionACL);
    await DatabaseRequest.SaveObject(topCollection);
    DatabaseRequest.LogUserAction({
      "action": newAccessStatus ? "public" : "private",
      "collection": topCollection
    });
    // TODO: Parse.Cloud / Promise function needed to handle the following record updates
    const collections = await DatabaseRequest.FetchObjects({
      class: "Collections",
      equalTo: {
        topCollection: topCollection
      },
      limit: 100000
    });
    for (var collection of collections) {
      DatabaseRequest.SetACL(collection, topCollectionACL);
      collection.save();
    }
    collections.push(topCollection);
    const content = await DatabaseRequest.FetchObjects({
      class: "Content",
      containedIn: {
        collection: collections
      },
      limit: 100000
    });
    for (var item of content) {
      DatabaseRequest.SetACL(item, topCollectionACL);
      DatabaseRequest.SaveObject(item);
    }
    return true;
  },

  /*
  |--------------------------------------------------------------------------
  | ToggleFavorite
  |--------------------------------------------------------------------------
  |
  | Toggles the favorite status of a collection for the current user
  |
  */
  ToggleFavorite: async (collection, userCollectionsPreferences) => {
    if (!collection) return;
    let topCollection = DatabaseRequest.GetValue(collection, "topCollection") ? DatabaseRequest.GetValue(collection, "topCollection") : collection;
    var favoriteStatus = false;
    if (!userCollectionsPreferences) {
      favoriteStatus = true;
      userCollectionsPreferences = DatabaseRequest.CreateObject({
        class: "CollectionsPreferences",
        set: {
          user: DatabaseRequest.GetCurrentUser(),
          collection: collection,
          favorited: true
        },
        acl: {
          publicRead: false,
          publicWrite: false,
          userReadAccess: [
            DatabaseRequest.GetCurrentUser()
          ],
          userWriteAccess: [
            DatabaseRequest.GetCurrentUser()
          ],
          roleReadAccess: [
            "auditors-" + DatabaseRequest.GetId(DatabaseRequest.GetCurrentUser()),
            "admins-" + DatabaseRequest.GetId(DatabaseRequest.GetId(topCollection)),
            "auditors",
            "master"
          ]
        }
      });
    }
    else {
      favoriteStatus = !DatabaseRequest.GetValue(userCollectionsPreferences, "favorited");
      DatabaseRequest.SetValue(userCollectionsPreferences, "favorited", favoriteStatus);
    }
    if (!userCollectionsPreferences) return;
    await userCollectionsPreferences.save();
    DatabaseRequest.LogUserAction({
      "action": favoriteStatus ? "favorited" : "unfavorited",
      "collection": collection
    });
    return userCollectionsPreferences;
  },

  /*
  |--------------------------------------------------------------------------
  | AddNewCollection
  |--------------------------------------------------------------------------
  |
  | Adds a new collection for the current user
  |
  */
  AddNewCollection: async (title, parentCollection) => {
    if (!DatabaseRequest.GetCurrentUser()) {
      return;
    }

    var collection = DatabaseRequest.CreateObject({
      class: "Collections",
      set: {
        title: title ? title : "New Collection",
        user: DatabaseRequest.GetCurrentUser()
      }
    });

    // if this is a parent collection
    if (parentCollection) {
      DatabaseRequest.SetValue(collection, "parentCollection", parentCollection);
      DatabaseRequest.SetACL(collection, DatabaseRequest.GetACL(parentCollection));
      DatabaseRequest.IncrementColumnForObject(parentCollection, 'collectionsCount');
      DatabaseRequest.IncrementColumnForObject(parentCollection, 'totalCollectionsCount');
      var topCollection = parentCollection;
      if (DatabaseRequest.GetValue(parentCollection, 'topCollection')) {
        topCollection = DatabaseRequest.GetValue(parentCollection, 'topCollection');
        DatabaseRequest.IncrementColumnForObject(topCollection, 'totalCollectionsCount');
      }
      if (topCollection) {
        DatabaseRequest.SetValue(collection, "topCollection", topCollection);
      }
    }
    // this is top collection
    else {
      await DatabaseRequest.SaveObject(collection); // to obtain a unique ID

      // to satisfy some query limitations
      // add self as topCollection
      DatabaseRequest.SetValue(collection, "topCollection", collection);

      var subscribers = DatabaseRequest.GetRelationColumnForObject(collection, "subscribers");
      DatabaseRequest.AddObjectToRelation(subscribers, DatabaseRequest.GetCurrentUser());

      collection = await DatabaseRequest.SetDefaultACLForCollection(collection);
    }

    await DatabaseRequest.SaveObject(collection);

    return collection;
  },

  /*
  |--------------------------------------------------------------------------
  | AddSubcollection
  |--------------------------------------------------------------------------
  |
  | Adds subcollection for a collection
  |
  */
  AddSubcollection: async (title, parentCollection) => {
    var subCollection = await CollectionUtils.AddNewCollection(title, parentCollection);
    await DatabaseRequest.SaveObject(subCollection);
    if (subCollection) {
      DatabaseRequest.LogUserAction({
        "action": "create",
        "collection": subCollection,
        "parentCollection": DatabaseRequest.GetValue(subCollection, "parentCollection"),
        "topCollection": DatabaseRequest.GetValue(subCollection, "topCollection")
      });
      return subCollection;
    }
    else {
      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | AddContentToCollection
  |--------------------------------------------------------------------------
  |
  | Adds new content to a collection
  |
  */
  AddContentToCollection: async (contentUrl, collection) => {
    if (!contentUrl || !collection) return false;
    var asset = await VideoUtils.GetAsset(contentUrl);
    if (!asset) {
      return false;
    }
    if (asset.mediaType === 'video') {
      if (!DatabaseRequest.GetCurrentUser()) return false;
      const data = {
        sourceUrl: asset.sourceUrl ? asset.sourceUrl : undefined,
        sourceId: asset.id,
        provider: asset.provider,
        type: asset.mediaType,
        thumbnail: asset.thumbnail,
        authorName: asset.authorName,
        authorUrl: asset.authorUrl,
        duration: asset.duration,
        title: asset.title,
        uploadedAt: asset.uploadedAt
      };
      var content = DatabaseRequest.CreateObject({
        class: "Content",
        set: {
          user: DatabaseRequest.GetCurrentUser()
        }
      });
      for (var [key, value] of Object.entries(data)) {
        if (value) {
          DatabaseRequest.SetValue(content, key, value);
        }
      }
      DatabaseRequest.SetValue(content, "collection", collection);
      DatabaseRequest.SetACL(content, DatabaseRequest.GetACL(collection));
      DatabaseRequest.AddUniqueValueToArray(collection, "providers", DatabaseRequest.GetValue(content, "provider"));
      DatabaseRequest.SetValue(collection, "thumbnail", data["thumbnail"]);
      var providersCount = DatabaseRequest.GetValue(collection, "providersCount");
      if (!providersCount) {
        providersCount = DatabaseRequest.CreateObject({
          class: "ProvidersCount",
          set: {
            collection: collection
          }
        });
      }
      DatabaseRequest.SetACL(providersCount, DatabaseRequest.GetACL(collection));
      DatabaseRequest.SetValue(providersCount, "collection", collection);
      DatabaseRequest.IncrementColumnForObject(providersCount, DatabaseRequest.GetValue(content, "provider"));
      await DatabaseRequest.SaveObject(providersCount);
      DatabaseRequest.SetValue(collection, "providersCount", providersCount);
      DatabaseRequest.IncrementColumnForObject(collection, "contentCount");
      DatabaseRequest.IncrementColumnForObject(collection, "totalContentCount");
      let topCollection = DatabaseRequest.GetValue(collection, "topCollection");
      if (topCollection) {
        DatabaseRequest.SetValue(topCollection, "thumbnail", data["thumbnail"]);
      }

      // update all parentCollections, all the way to the topCollection
      var parentCollection = collection;
      while (parentCollection) {
        if (DatabaseRequest.GetValue(parentCollection, "parentCollection")) {
          parentCollection = await DatabaseRequest.FetchObjects({
            class: "Collections",
            equalTo: {
              objectId: DatabaseRequest.GetId(DatabaseRequest.GetValue(parentCollection, "parentCollection"))
            },
            limit: 1
          });
          if (parentCollection) {
            DatabaseRequest.IncrementColumnForObject(parentCollection, "totalContentCount");
            DatabaseRequest.AddUniqueValueToArray(parentCollection, "providers", DatabaseRequest.GetValue(content, "provider"));
            var providersCount = DatabaseRequest.GetValue(parentCollection, "providersCount");
            if (!providersCount) {
              providersCount = DatabaseRequest.CreateObject({
                class: "ProvidersCount",
                set: {
                  collection: parentCollection
                }
              });
            }
            DatabaseRequest.SetACL(providersCount, DatabaseRequest.GetACL(parentCollection));
            DatabaseRequest.SetValue(providersCount, "collection", parentCollection);
            DatabaseRequest.IncrementColumnForObject(providersCount, DatabaseRequest.GetValue(content, "provider"));
            await DatabaseRequest.SaveObject(providersCount);
            DatabaseRequest.SetValue(parentCollection, "providersCount", providersCount);
          }
        }
        else {
          parentCollection = false;
        }
      }

      await DatabaseRequest.SaveObject(content); // this should save all updated parentCollections

      return content;
    }
    return false;
  },

  /*
  |--------------------------------------------------------------------------
  | CreateNewContentAnalytics
  |--------------------------------------------------------------------------
  |
  | Creates a new object for ContentAnalytics
  |
  */
  CreateNewContentAnalytics: (content) => {
    if (!content) return false;
    var currentUser = DatabaseRequest.GetCurrentUser();
    if (!currentUser) return false;
    var topCollection = DatabaseRequest.GetValue(DatabaseRequest.GetValue(content, "collection"), "topCollection");
    var topCollectionId;
    if (topCollection) {
      topCollectionId = DatabaseRequest.GetId(topCollection);
    }
    else {
      topCollectionId = DatabaseRequest.GetId(DatabaseRequest.GetValue(content, "collection"));
    }
    var roleReadAccess = [
      "auditors-" + DatabaseRequest.GetId(currentUser),
      "auditors",
      "master"
    ];
    if (topCollectionId && DatabaseRequest.GetValue(content, "collection")) {
      roleReadAccess.push("admins-" + topCollectionId);
    }
    var contentAnalytics = DatabaseRequest.CreateObject({
      class: "ContentAnalytics",
      set: {
        user: currentUser,
        content: content,
        collection: DatabaseRequest.GetValue(content, "collection"),
        topCollection: DatabaseRequest.GetPointerById("Collections", topCollectionId)
      },
      acl: {
        publicRead: false,
        publicWrite: false,
        userReadAccess: [
          currentUser
        ],
        userWriteAccess: [
          currentUser
        ],
        roleReadAccess: roleReadAccess
      }
    });
    return contentAnalytics;
  },

  /*
  |--------------------------------------------------------------------------
  | GetUserPreferencesForCollection
  |--------------------------------------------------------------------------
  |
  | Returns user's preferences for a collection
  |
  */
  GetUserPreferencesForCollection: async (collection) => {
    const userPreferences = await DatabaseRequest.FetchObjects({
      class: "CollectionsPreferences",
      equalTo: {
        user: DatabaseRequest.GetCurrentUser(),
        collection: collection
      },
      descending: "createdAt",
      limit: 1
    });
    return userPreferences;
  },

  /*
  |--------------------------------------------------------------------------
  | CreateQueryCollectionsDeleted
  |--------------------------------------------------------------------------
  |
  | Returns a query that filters collections that are still active
  |
  */
  CreateQueryCollectionsDeleted() {
    const queryTopCollectionsNotDeleted = DatabaseRequest.CreateQuery({
      class: "Collections",
      notEqualTo: {
        deleted: true
      }
    });
    const queryCollectionsNotDeleted = DatabaseRequest.CreateQuery({
      class: "Collections",
      notEqualTo: {
        deleted: true
      },
      matchesQuery: {
        topCollection: queryTopCollectionsNotDeleted
      }
    });
    return queryCollectionsNotDeleted;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchContentAnalyticsForUser
  |--------------------------------------------------------------------------
  |
  | Returns user's content analytics, with optional filters
  |
  */
  FetchContentAnalyticsForUser: async (userId, filter) => {
    const queryCollectionsNotDeleted = CollectionUtils.CreateQueryCollectionsDeleted();
    const equalTo = {
      user: DatabaseRequest.GetPointerById("_User", userId)
    };
    var query = {
      class: "ContentAnalytics",
      equalTo: equalTo,
      matchesQuery: {
        collection: queryCollectionsNotDeleted
      },
      descending: "updatedAt",
      limit: 1000
    };
    if (filter) {
      if (filter.topCollectionId) {
        query.equalTo.topCollection = DatabaseRequest.GetPointerById("Collections", filter.topCollectionId);
      }
      if (filter.collectionId) {
        query.equalTo.collection = DatabaseRequest.GetPointerById("Collections", filter.collectionId);
      }
      if (filter.include) {
        query.include = filter.include;
      }
    }
    const userContentAnalytics = await DatabaseRequest.FetchObjects(query);
    return userContentAnalytics;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchLatestContent
  |--------------------------------------------------------------------------
  |
  | Returns all content ordered descending by creation date
  |
  */
  FetchLatestContent: async (filter, skip=0) => {
    const queryCollectionsNotDeleted = CollectionUtils.CreateQueryCollectionsDeleted();
    const query = {
      class: "Content",
      matchesQuery: {
        collection: queryCollectionsNotDeleted
      },
      select: CollectionUtils.DefaultSelectForFetchContent(),
      include: ["collection", "collection.topCollection"],
      limit: 1000,
      descending: "createdAt"
    }
    if (filter) {
      if (filter.quizzes)
        query.exists = ["quizPreferences"]
    }
    const content = await DatabaseRequest.FetchObjects(query);
    return content;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchSearchContent
  |--------------------------------------------------------------------------
  |
  | Returns all content matching a search term
  |
  */
  FetchSearchContent: async (searchTerm, skip=0) => {
    const queryCollectionsNotDeleted = CollectionUtils.CreateQueryCollectionsDeleted();
    const content = await DatabaseRequest.FetchObjects({
      class: "Content",
      fullText: {
        title: searchTerm
      },
      notEqualTo: {
        deleted: true
      },
      matchesQuery: {
        collection: queryCollectionsNotDeleted
      },
      select: CollectionUtils.DefaultSelectForFetchContent(),
      include: ["collection", "collection.topCollection"],
      limit: 1000
    });
    return content;
  },

  /*
  |--------------------------------------------------------------------------
  | CreateCollectionSlug
  |--------------------------------------------------------------------------
  |
  | Creates a slug for a collection title
  |
  */
  CreateCollectionSlug: (collection) => {
    if (!collection) return null;
    const collectionTitle = DatabaseRequest.GetValue(collection, "title");
    const slug = JSUtils.SlugifyString(collectionTitle);
    return slug;
  }

}

export default CollectionUtils