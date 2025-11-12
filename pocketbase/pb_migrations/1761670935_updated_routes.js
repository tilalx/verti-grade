/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qr2b04qe5l99ax6")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_7kUMbzeLpY` ON `routes` (\n  `name`,\n  `difficulty`,\n  `difficulty_sign`,\n  `anchor_point`\n)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3918007031",
    "max": null,
    "min": null,
    "name": "anchor_point",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("qr2b04qe5l99ax6")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  // remove field
  collection.fields.removeById("number3918007031")

  return app.save(collection)
})
