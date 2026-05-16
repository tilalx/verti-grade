/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qr2b04qe5l99ax6")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("qr2b04qe5l99ax6")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && (@request.auth.is_super_admin = true || tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.is_super_admin = true || tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id)"
  }, collection)

  return app.save(collection)
})
