Parse.Cloud.define("getUserByEmail", async (request) => {
  if (!request.params.email) {
    throw new Error("Email parameter is required.");
  }
  const query = new Parse.Query("_User");
  query.equalTo("email", request.params.email);
  const user = await query.first({ useMasterKey: true });
  return user ? user.toJSON() : null;
});

Parse.Cloud.define("getCurrentUser", async (request) => {
  const user = request.user;
  return user ? user.toJSON() : null;
});