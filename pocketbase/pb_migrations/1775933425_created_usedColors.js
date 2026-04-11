/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json1716930793",
        "maxSize": 1,
        "name": "color",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "id": "pbc_1744051461",
    "indexes": [],
    "listRule": "",
    "name": "usedColors",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT id, color\nFROM (\n    SELECT id, color,\n           ROW_NUMBER() OVER (PARTITION BY color ORDER BY id) AS rn\n    FROM routes\n)\nWHERE rn = 1;",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1744051461");

  return app.delete(collection);
})
