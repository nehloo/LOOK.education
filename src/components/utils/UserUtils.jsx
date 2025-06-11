/**
 * @package    look-education
 * @copyright  Copyright Nehloo Foundation, Inc.
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import DatabaseRequest from "../frameworks/DatabaseRequest"
import JSUtils from "./JSUtils"

const UserUtils = {

  /*
  |--------------------------------------------------------------------------
  | GetUserByEmail
  |--------------------------------------------------------------------------
  |
  | Returns the user with the specified email address
  |
  */
  GetUserByEmail: async (email) => {
    const user = await DatabaseRequest.FetchObjects({
      class: "User",
      equalTo: {
        email: email
      },
      limit: 1
    });
    return user;
  },

  /*
  |--------------------------------------------------------------------------
  | GetRoleByName
  |--------------------------------------------------------------------------
  |
  | Returns the role with the specified name
  |
  */
  GetRoleByName: async (name) => {
    const role = await DatabaseRequest.FetchObjects({
      class: "Role",
      equalTo: {
        name: name
      },
      limit: 1
    });
    return role;
  },

  /*
  |--------------------------------------------------------------------------
  | AddUserToRoleForCollection
  |--------------------------------------------------------------------------
  |
  | Adds a user to a role for the specified collection
  |
  */
  AddUserToRoleForCollection: async (user, role, collection) => {
    if (!collection || !user || !role) return false;
    DatabaseRequest.AddRoleUser(role, user);
    await DatabaseRequest.SaveObject(role);
    var subscribers = DatabaseRequest.GetRelationColumnForObject(collection, "subscribers");
    DatabaseRequest.AddObjectToRelation(subscribers, user);
    DatabaseRequest.IncrementColumnForObject(collection, "subscribersCount");
    await DatabaseRequest.SaveObject(collection);
    return true;
  },

  /*
  |--------------------------------------------------------------------------
  | CreateUserSlug
  |--------------------------------------------------------------------------
  |
  | Creates a slug for current user
  |
  */
  CreateUserSlug: () => {
    if (!DatabaseRequest.GetCurrentUser()) return null;
    const userBrand = DatabaseRequest.GetValue(DatabaseRequest.GetCurrentUser(), "brand");
    const slug = JSUtils.SlugifyString(userBrand);
    return slug;
  }

}

export default UserUtils