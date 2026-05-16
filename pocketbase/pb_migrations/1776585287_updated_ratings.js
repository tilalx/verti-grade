/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("mgqsaf0qt5436zq")

  // update collection data
  unmarshal({
    "createRule": "",
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("mgqsaf0qt5436zq")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role.permissions.name ?= \"manage_comments\" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id",
    "listRule": "@request.auth.id != \"\" && (@request.auth.is_super_admin = true || tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.is_super_admin = true || tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id)"
  }, collection)

  return app.save(collection)
})
