/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import Parse from 'parse/dist/parse.min.js';
Parse.initialize(import.meta.env.VITE_APP_PARSE_SERVER_APP_ID);
Parse.serverURL = import.meta.env.VITE_APP_PARSE_SERVER_URL;

const DatabaseRequest = {

  /*
  |--------------------------------------------------------------------------
  | CreateObject
  |--------------------------------------------------------------------------
  |
  | Creates a new object
  |
  */
  CreateObject: (dict) => {
    var className = dict["class"];
    if (!className) return;
    if (className == "User") className = Parse.User;
    if (className == "Role") className = Parse.Role;
    const NewObjectClass = Parse.Object.extend(className);
    const object = new NewObjectClass();
    if (dict["set"])
      for (var [key, value] of Object.entries(dict["set"])) {
        if (value) object.set(key, value);
      }
    if (dict["addUnique"])
      for (var [key, value] of Object.entries(dict["addUnique"])) {
        if (value) object.addUnique(key, value);
      }
    if (dict["aclObject"])
      object.setACL(dict["aclObject"]);
    if (dict["acl"]) {
      var objectACL = new Parse.ACL();
      var acl = dict["acl"];
      if (typeof acl["publicRead"] === "boolean") {
        objectACL = DatabaseRequest.SetPublicReadAccess(objectACL, acl["publicRead"]);
      }
      if (typeof acl["publicWrite"] === "boolean") {
        objectACL = DatabaseRequest.SetPublicWriteAccess(objectACL, acl["publicWrite"]);
      }
      if (acl["userReadAccess"])
        for (var [key, user] of Object.entries(acl["userReadAccess"])) {
          if (user) objectACL = DatabaseRequest.SetUserReadAccess(objectACL, user, true);
        }
      if (acl["userWriteAccess"])
        for (var [key, user] of Object.entries(acl["userWriteAccess"])) {
          if (user) objectACL = DatabaseRequest.SetUserWriteAccess(objectACL, user, true);
        }
      if (acl["roleReadAccess"])
        for (var [key, role] of Object.entries(acl["roleReadAccess"])) {
          if (role) objectACL = DatabaseRequest.SetRoleReadAccess(objectACL, role, true);
        }
      if (acl["roleWriteAccess"])
        for (var [key, role] of Object.entries(acl["roleWriteAccess"])) {
          if (role) objectACL = DatabaseRequest.SetRoleWriteAccess(objectACL, role, true);
        }
      if (objectACL)
        object.setACL(objectACL);
    }

    return object;
  },

  /*
  |--------------------------------------------------------------------------
  | GetCurrentUser
  |--------------------------------------------------------------------------
  |
  | Returns current user
  |
  */
  GetCurrentUser: () => {
    return Parse.User.current();
  },

  /*
  |--------------------------------------------------------------------------
  | GetId
  |--------------------------------------------------------------------------
  |
  | Returns the ID of an object
  |
  */
  GetId: (object) => {
    if (!object) return null;
    return object.id;
  },

  /*
  |--------------------------------------------------------------------------
  | GetPointerById
  |--------------------------------------------------------------------------
  |
  | Returns a pointer to an object, by ID
  |
  */
  GetPointerById: (className, objectId) => {
    if (className === "User") className = "_User";
    if (className === "Role") className = "_Role";
    if (!className || !objectId) return null;
    return { "__type": "Pointer", "className": className, "objectId": objectId };
  },
  
  /*
  |--------------------------------------------------------------------------
  | GetValue
  |--------------------------------------------------------------------------
  |
  | Returns the value of a key of an object
  |
  */
  GetValue: (object, key) => {
    if (!object) return null;
    if (!object.get(key)) return null;
    return object.get(key);
  },
  
  /*
  |--------------------------------------------------------------------------
  | AddUniqueValueToArray
  |--------------------------------------------------------------------------
  |
  | Adds a unique value to an array key of an object
  |
  */
 AddUniqueValueToArray: (object, key, value) => {
    if (!object) return null;
    object.addUnique(key, value);
    return object;
  },
  
  /*
  |--------------------------------------------------------------------------
  | RemoveValueFromArray
  |--------------------------------------------------------------------------
  |
  | Remove a value from an array key of an object
  |
  */
  RemoveValueFromArray: (object, key, value) => {
    if (!object) return null;
    object.remove(key, value);
    return object;
  },
  
  /*
  |--------------------------------------------------------------------------
  | UnsetValue
  |--------------------------------------------------------------------------
  |
  | Unsets (removes) the value for a key of an object
  |
  */
  UnsetValue: (object, key) => {
    if (!object) return null;
    object.unset(key);
    return object;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetValue
  |--------------------------------------------------------------------------
  |
  | Sets the value for a key of an object
  |
  */
  SetValue: (object, key, value) => {
    if (!object) return null;
    object.set(key, value);
    return object;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetRelation
  |--------------------------------------------------------------------------
  |
  | Sets the relation of an object with another object
  |
  */
  SetRelation: (object1, key1, object2) => {
    if (!object1 || !key1 || !object2) return null;
    var relation = object1.relation(key1);
    relation.add(object2);
    return object1;
  },
  
  /*
  |--------------------------------------------------------------------------
  | GetRoleUsers
  |--------------------------------------------------------------------------
  |
  | Returns the users for a role
  |
  */
  GetRoleUsers: (role) => {
    if (!role) return;
    return role.getUsers();
  },
  
  /*
  |--------------------------------------------------------------------------
  | AddRoleUser
  |--------------------------------------------------------------------------
  |
  | Adds a user to a role
  |
  */
  AddRoleUser: (role, user) => {
    if (!role) return;
    if (!user) return;
    const roleUsers = DatabaseRequest.GetRoleUsers(role);
    roleUsers.add(user);
    return true;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetPublicReadAccess
  |--------------------------------------------------------------------------
  |
  | Sets the public read access for an object
  |
  */
  SetPublicReadAccess: (objectACL, value) => {
    if (!objectACL) return;
    objectACL.setPublicReadAccess(value);
    return objectACL;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetUserReadAccess
  |--------------------------------------------------------------------------
  |
  | Sets the user read access for an object
  |
  */
  SetUserReadAccess: (objectACL, user, value) => {
    if (!objectACL || !user) return;
    objectACL.setReadAccess(user, value);
    return objectACL;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetRoleReadAccess
  |--------------------------------------------------------------------------
  |
  | Sets the role read access for an object
  |
  */
  SetRoleReadAccess: (objectACL, role, value) => {
    if (!objectACL || !role) return;
    objectACL.setRoleReadAccess(role, value);
    return objectACL;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetPublicWriteAccess
  |--------------------------------------------------------------------------
  |
  | Sets the public write access for an object
  |
  */
  SetPublicWriteAccess: (objectACL, value) => {
    if (!objectACL) return;
    objectACL.setPublicWriteAccess(value);
    return objectACL;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetUserWriteAccess
  |--------------------------------------------------------------------------
  |
  | Sets the user write access for an object
  |
  */
  SetUserWriteAccess: (objectACL, user, value) => {
    if (!objectACL || !user) return;
    objectACL.setWriteAccess(user, value);
    return objectACL;
  },
  
  /*
  |--------------------------------------------------------------------------
  | SetRoleWriteAccess
  |--------------------------------------------------------------------------
  |
  | Sets the role write access for an object
  |
  */
  SetRoleWriteAccess: (objectACL, role, value) => {
    if (!objectACL || !role) return;
    objectACL.setRoleWriteAccess(role, value);
    return objectACL;
  },

  /*
  |--------------------------------------------------------------------------
  | DestroyRelation
  |--------------------------------------------------------------------------
  |
  | Destroys the relation of an object with another object
  |
  */
  DestroyRelation: (object1, key1, object2) => {
    if (!object1 || !key1 || !object2) return null;
    var relation = object1.relation(key1);
    relation.remove(object2);
    return true;
  },

  /*
  |--------------------------------------------------------------------------
  | SaveObject
  |--------------------------------------------------------------------------
  |
  | Saves an object
  |
  */
  SaveObject: async (object) => {
    if (!object) return null;
    await object.save();
    return object;
  },

  /*
  |--------------------------------------------------------------------------
  | HasPublicReadAccess
  |--------------------------------------------------------------------------
  |
  | Returns whether the object's ACL states that it has public access
  |
  */
  HasPublicReadAccess: (object) => {
    if (!object) return false;
    if (!object.getACL()) return false;
    return object.getACL().getPublicReadAccess();
  },

  /*
  |--------------------------------------------------------------------------
  | GetACL
  |--------------------------------------------------------------------------
  |
  | Returns the ACL of an object
  |
  */
  GetACL: (object) => {
    if (!object) return null;
    return object.getACL();
  },

  /*
  |--------------------------------------------------------------------------
  | SetACL
  |--------------------------------------------------------------------------
  |
  | Sets the ACL for an object
  |
  */
  SetACL: (object, acl) => {
    if (!object) return null;
    return object.setACL(acl);
  },

  /*
  |--------------------------------------------------------------------------
  | SetDefaultACLForCollection
  |--------------------------------------------------------------------------
  |
  | Sets the default ACL rules for a collection
  |
  */
  SetDefaultACLForCollection: async (collection) => {
    var roleACL = new Parse.ACL();
    DatabaseRequest.SetPublicReadAccess(roleACL, false);
    DatabaseRequest.SetUserReadAccess(roleACL, DatabaseRequest.GetCurrentUser(), true);
    DatabaseRequest.SetUserWriteAccess(roleACL, DatabaseRequest.GetCurrentUser(), true);
    var roleWrite = new Parse.Role("admins-" + collection.id, roleACL);
    roleWrite.getUsers().add(DatabaseRequest.GetCurrentUser());
    await roleWrite.save();
    
    var roleACL = new Parse.ACL();
    DatabaseRequest.SetPublicReadAccess(roleACL, false);
    DatabaseRequest.SetRoleReadAccess(roleACL, roleWrite, true);
    DatabaseRequest.SetRoleWriteAccess(roleACL, roleWrite, true);
    var roleRead = new Parse.Role("guests-" + collection.id, roleACL);
    roleRead.getRoles().add(roleWrite);
    await roleRead.save();

    var collectionACL = new Parse.ACL();
    DatabaseRequest.SetRoleReadAccess(collectionACL, roleRead, true);
    DatabaseRequest.SetRoleReadAccess(collectionACL, roleWrite, true);
    DatabaseRequest.SetRoleWriteAccess(collectionACL, roleWrite, true);
    collection.setACL(collectionACL);

    return collection;
  },

  /*
  |--------------------------------------------------------------------------
  | UserSignUp
  |--------------------------------------------------------------------------
  |
  | Registers a user
  |
  */
  UserSignUp: async (data) => {
    try {
      var user = new Parse.User();
      for (var [key, value] of Object.entries(data)) {
        user.set(key, value);
      }
      await user.signUp();
      return user;
    }
    catch(error) {
      return {
        error: error
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UserRequestPasswordReset
  |--------------------------------------------------------------------------
  |
  | Requests password reset for a user
  |
  */
  UserRequestPasswordReset: async (email) => {
    try {
      await Parse.User.requestPasswordReset(email);
      return true;
    }
    catch(error) {
      return {
        error: error
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UserLogIn
  |--------------------------------------------------------------------------
  |
  | Logs in a user
  |
  */
  UserLogIn: async (email, password) => {
    try {
      const user = await Parse.User.logIn(email, password);
      return user;
    }
    catch(error) {
      return {
        error: error
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UserLogOut
  |--------------------------------------------------------------------------
  |
  | Logs out a user
  |
  */
  UserLogOut: async () => {
    try {
      await Parse.User.logOut();
      return true;
    }
    catch(error) {
      return {
        error: error
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | LogUserAction
  |--------------------------------------------------------------------------
  |
  | Logs a record of a user's action
  |
  */
  LogUserAction: async (dict) => {
    const AuditLogs = Parse.Object.extend("AuditLogs");
    const auditLog = new AuditLogs();
    for (var [key, value] of Object.entries(dict))
      if (key && value) auditLog.set(key, value);
    var currentUser = Parse.User.current();
    if (!currentUser && dict["user"]) {
      currentUser = dict["user"];
    }
    if (currentUser) auditLog.set("user", currentUser);
    var auditLogACL = new Parse.ACL();
    auditLogACL.setPublicReadAccess(false);
    if (currentUser) auditLogACL.setReadAccess(currentUser, true);
    if (currentUser) auditLogACL.setRoleReadAccess("auditors-" + currentUser.id, true);
    auditLogACL.setRoleReadAccess("auditors", true);
    auditLogACL.setRoleReadAccess("master", true);
    auditLog.setACL(auditLogACL);
    const result = await auditLog.save();
    return result;
  },

  /*
  |--------------------------------------------------------------------------
  | GetRelationColumnForObject
  |--------------------------------------------------------------------------
  |
  | Returns the relation column for an object
  |
  */
  GetRelationColumnForObject: (object, column) => {
    if (!object || !column) return false;
    return object.relation(column);
  },

  /*
  |--------------------------------------------------------------------------
  | AddObjectToRelation
  |--------------------------------------------------------------------------
  |
  | Adds a new object to an existing relation
  |
  */
  AddObjectToRelation: (relation, object) => {
    if (!relation || !object) return false;
    relation.add(object);
    return true;
  },

  /*
  |--------------------------------------------------------------------------
  | IncrementColumnForObject
  |--------------------------------------------------------------------------
  |
  | Increments the value of the specified column of an object
  |
  */
  IncrementColumnForObject: (object, column) => {
    if (!object || !column) return false;
    object.increment(column);
    return true;
  },

  /*
  |--------------------------------------------------------------------------
  | CreateQuery
  |--------------------------------------------------------------------------
  |
  | Creates a query - but doesn't launch it
  | dict:
  |   class: string
  |   equalTo: objects
  |   include: array
  |   limit: number
  |
  */
  CreateQuery: (dict) => {
    var query;
    if (dict["relation"]) {
      query = dict["relation"].query();
    }
    else {
      var className = dict["class"];
      if (!className) return;
      if (className == "User") className = Parse.User;
      if (className == "Role") className = Parse.Role;
      query = new Parse.Query(className);
    }
    if (dict["fullText"]) {
      for (var [key, value] of Object.entries(dict["fullText"]))
        if (value) query.fullText(key, value);
    }
    else {
      if (dict["equalTo"])
        for (var [key, value] of Object.entries(dict["equalTo"]))
          if (value) query.equalTo(key, value);
    }
    if (dict["notEqualTo"])
      for (var [key, value] of Object.entries(dict["notEqualTo"]))
        if (value) query.notEqualTo(key, value);
    if (dict["exists"])
      for (var key of dict["exists"])
        if (key) query.exists(key);
    if (dict["containedIn"])
      for (var [key, value] of Object.entries(dict["containedIn"]))
        if (value) if (value.length) query.containedIn(key, value);
    if (dict["innerQuery"]) {
      var innerQuery;
      const innerDict = dict["innerQuery"];
      var innerClassName = innerDict["class"];
      if (innerClassName == "User") innerClassName = Parse.User;
      if (innerClassName == "Role") innerClassName = Parse.Role;
      innerQuery = new Parse.Query(innerClassName);
      if (innerDict["equalTo"])
        for (var [key, value] of Object.entries(innerDict["equalTo"]))
          if (value) innerQuery.equalTo(key, value);
      if (innerDict["notEqualTo"])
        for (var [key, value] of Object.entries(innerDict["notEqualTo"]))
          if (value) innerQuery.notEqualTo(key, value);
      if (innerDict["containedIn"])
        for (var [key, value] of Object.entries(innerDict["containedIn"]))
          if (value) innerQuery.containedIn(key, value);
      query.matchesQuery(innerDict["column"], innerQuery);
    }
    if (dict["matchesQuery"])
      for (var [key, value] of Object.entries(dict["matchesQuery"]))
        if (value) query.matchesQuery(key, value);
    if (dict["include"])
      if (dict["include"].length)
        query.include(dict["include"]);
    if (dict["select"])
      if (dict["select"].length)
        query.select(dict["select"]);
    if (dict["doesNotExist"])
      query.doesNotExist(dict["doesNotExist"]);
    if (dict["limit"] >= 1)
      query.limit(dict["limit"]);
    if (dict["ascending"])
      query.ascending(dict["ascending"]);
    if (dict["descending"])
      query.descending(dict["descending"]);
    if (dict["skip"] > 0)
      query.skip(dict["skip"]);
    return query;
  },

  /*
  |--------------------------------------------------------------------------
  | FetchObjects
  |--------------------------------------------------------------------------
  |
  | Fetches objects
  | dict:
  |   class: string
  |   equalTo: objects
  |   include: array
  |   limit: number
  |
  */
  FetchObjects: async (dict) => {
    const query = DatabaseRequest.CreateQuery(dict);
    if (dict["limit"] == 1) {
      const object = await query.first();
      return object;
    }
    else {
      const objects = await query.find();
      return objects;
    }
  }

}

export default DatabaseRequest