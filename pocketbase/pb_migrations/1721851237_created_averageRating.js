/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "vcfw600rzblhed3",
    "created": "2024-07-24 20:00:37.316Z",
    "updated": "2024-07-24 20:00:37.316Z",
    "name": "averageRating",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "sbhu7duh",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "pu5d5ac0",
        "name": "average_rating",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "SELECT \n    routes.id,\n    routes.name,\n    AVG(ratings.rating) AS average_rating\nFROM \n    routes\nLEFT JOIN \n    ratings ON routes.id = ratings.route_id\nGROUP BY \n    routes.id;"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("vcfw600rzblhed3");

  return dao.deleteCollection(collection);
})
