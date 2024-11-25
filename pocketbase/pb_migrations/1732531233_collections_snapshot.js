/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const snapshot = [
    {
      "createRule": "@request.auth.id != \"\"",
      "deleteRule": "@request.auth.id != \"\"",
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "2vke4qt5",
          "max": 0,
          "min": 0,
          "name": "name",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "mahzsklp",
          "max": 10,
          "min": 0,
          "name": "difficulty",
          "onlyInt": false,
          "presentable": false,
          "required": true,
          "system": false,
          "type": "number"
        },
        {
          "hidden": false,
          "id": "5bpugbxm",
          "maxSize": 2000,
          "name": "difficulty_sign",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "json"
        },
        {
          "hidden": false,
          "id": "sypedztv",
          "maxSelect": 1,
          "name": "location",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "select",
          "values": [
            "Hanau",
            "Gelnhausen"
          ]
        },
        {
          "hidden": false,
          "id": "2xr3jssh",
          "maxSelect": 1,
          "name": "type",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "select",
          "values": [
            "Route",
            "Boulder"
          ]
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "4fmli3er",
          "max": 0,
          "min": 0,
          "name": "comment",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "rwyzljau",
          "maxSize": 2000000,
          "name": "creator",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "json"
        },
        {
          "hidden": false,
          "id": "0zrmkjos",
          "name": "archived",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "bool"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "xoaebxkr",
          "max": 0,
          "min": 0,
          "name": "color",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "yh8d0mqp",
          "max": "",
          "min": "",
          "name": "screw_date",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "date"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": false,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": false,
          "type": "autodate"
        }
      ],
      "id": "qr2b04qe5l99ax6",
      "indexes": [],
      "listRule": "",
      "name": "routes",
      "system": false,
      "type": "base",
      "updateRule": "@request.auth.id != \"\"",
      "viewRule": ""
    },
    {
      "createRule": "",
      "deleteRule": "@request.auth.id != \"\"",
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "cascadeDelete": true,
          "collectionId": "qr2b04qe5l99ax6",
          "hidden": false,
          "id": "5hhk9pqj",
          "maxSelect": 1,
          "minSelect": 0,
          "name": "route_id",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "relation"
        },
        {
          "hidden": false,
          "id": "9chbziwf",
          "max": null,
          "min": null,
          "name": "rating",
          "onlyInt": false,
          "presentable": false,
          "required": false,
          "system": false,
          "type": "number"
        },
        {
          "hidden": false,
          "id": "fsavjowo",
          "max": 10,
          "min": 0,
          "name": "difficulty",
          "onlyInt": false,
          "presentable": false,
          "required": true,
          "system": false,
          "type": "number"
        },
        {
          "hidden": false,
          "id": "zsqcbufz",
          "name": "difficulty_sign",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "bool"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "1y3nqcyf",
          "max": 0,
          "min": 0,
          "name": "comment",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": false,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": false,
          "type": "autodate"
        }
      ],
      "id": "mgqsaf0qt5436zq",
      "indexes": [],
      "listRule": "",
      "name": "ratings",
      "system": false,
      "type": "base",
      "updateRule": "@request.auth.id != \"\"",
      "viewRule": ""
    },
    {
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
          "autogeneratePattern": "",
          "hidden": false,
          "id": "_clone_CFkf",
          "max": 0,
          "min": 0,
          "name": "name",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "json3997005768",
          "maxSize": 1,
          "name": "average_rating",
          "presentable": false,
          "required": false,
          "system": false,
          "type": "json"
        }
      ],
      "id": "vcfw600rzblhed3",
      "indexes": [],
      "listRule": "",
      "name": "averageRating",
      "system": false,
      "type": "view",
      "updateRule": null,
      "viewQuery": "SELECT \n    routes.id,\n    routes.name,\n    AVG(ratings.rating) AS average_rating\nFROM \n    routes\nLEFT JOIN \n    ratings ON routes.id = ratings.route_id\nGROUP BY \n    routes.id;",
      "viewRule": ""
    },
    {
      "createRule": "@request.auth.id != \"\"",
      "deleteRule": "@request.auth.id != \"\"",
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
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
          "id": "ftnklfkd",
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/webp"
          ],
          "name": "page_logo",
          "presentable": false,
          "protected": false,
          "required": false,
          "system": false,
          "thumbs": null,
          "type": "file"
        },
        {
          "hidden": false,
          "id": "etsgdhry",
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/x-icon"
          ],
          "name": "page_icon",
          "presentable": false,
          "protected": false,
          "required": false,
          "system": false,
          "thumbs": [
            "16x16",
            "32x32",
            "48x48"
          ],
          "type": "file"
        },
        {
          "hidden": false,
          "id": "ql2hwtia",
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/webp"
          ],
          "name": "sign_image",
          "presentable": false,
          "protected": false,
          "required": false,
          "system": false,
          "thumbs": null,
          "type": "file"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "5lzydgon",
          "name": "imprint_url",
          "onlyDomains": null,
          "presentable": false,
          "required": false,
          "system": false,
          "type": "url"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "xmyime3x",
          "name": "privacy_url",
          "onlyDomains": null,
          "presentable": false,
          "required": false,
          "system": false,
          "type": "url"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "mkmvju9s",
          "name": "application_url",
          "onlyDomains": null,
          "presentable": false,
          "required": false,
          "system": false,
          "type": "url"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": false,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": false,
          "type": "autodate"
        }
      ],
      "id": "68oae2zwn6jtsd4",
      "indexes": [],
      "listRule": "",
      "name": "settings",
      "system": false,
      "type": "base",
      "updateRule": "@request.auth.id != \"\"",
      "viewRule": ""
    },
    {
      "authAlert": {
        "emailTemplate": {
          "body": "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
          "subject": "Login from a new location"
        },
        "enabled": true
      },
      "authRule": "verified=true",
      "authToken": {
        "duration": 1209600
      },
      "confirmEmailChangeTemplate": {
        "body": "<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Confirm new email</a>\n</p>\n<p><i>If you didn't ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Confirm your {APP_NAME} new email address"
      },
      "createRule": null,
      "deleteRule": "id = @request.auth.id",
      "emailChangeToken": {
        "duration": 1800
      },
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "cost": 10,
          "hidden": true,
          "id": "password901924565",
          "max": 0,
          "min": 8,
          "name": "password",
          "pattern": "",
          "presentable": false,
          "required": true,
          "system": true,
          "type": "password"
        },
        {
          "autogeneratePattern": "[a-zA-Z0-9_]{50}",
          "hidden": true,
          "id": "text2504183744",
          "max": 60,
          "min": 30,
          "name": "tokenKey",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "email3885137012",
          "name": "email",
          "onlyDomains": null,
          "presentable": false,
          "required": true,
          "system": true,
          "type": "email"
        },
        {
          "hidden": false,
          "id": "bool1547992806",
          "name": "emailVisibility",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "hidden": false,
          "id": "bool256245529",
          "name": "verified",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "autogeneratePattern": "users[0-9]{6}",
          "hidden": false,
          "id": "text4166911607",
          "max": 150,
          "min": 3,
          "name": "username",
          "pattern": "^[\\w][\\w\\.\\-]*$",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": false,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "sacypvxf",
          "max": 0,
          "min": 0,
          "name": "firstname",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "users_name",
          "max": 0,
          "min": 0,
          "name": "name",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "users_avatar",
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/gif",
            "image/webp"
          ],
          "name": "avatar",
          "presentable": false,
          "protected": false,
          "required": false,
          "system": false,
          "thumbs": null,
          "type": "file"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": false,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": false,
          "type": "autodate"
        }
      ],
      "fileToken": {
        "duration": 120
      },
      "id": "_pb_users_auth_",
      "indexes": [
        "CREATE UNIQUE INDEX `__pb_users_auth__username_idx` ON `users` (username COLLATE NOCASE)",
        "CREATE UNIQUE INDEX `__pb_users_auth__email_idx` ON `users` (`email`) WHERE `email` != ''",
        "CREATE UNIQUE INDEX `__pb_users_auth__tokenKey_idx` ON `users` (`tokenKey`)"
      ],
      "listRule": "id = @request.auth.id",
      "manageRule": null,
      "mfa": {
        "duration": 1800,
        "enabled": false,
        "rule": ""
      },
      "name": "users",
      "oauth2": {
        "enabled": false,
        "mappedFields": {
          "avatarURL": "",
          "id": "",
          "name": "",
          "username": "username"
        }
      },
      "otp": {
        "duration": 180,
        "emailTemplate": {
          "body": "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
          "subject": "OTP for {APP_NAME}"
        },
        "enabled": false,
        "length": 8
      },
      "passwordAuth": {
        "enabled": true,
        "identityFields": [
          "email",
          "username"
        ]
      },
      "passwordResetToken": {
        "duration": 1800
      },
      "resetPasswordTemplate": {
        "body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password</a>\n</p>\n<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Reset your {APP_NAME} password"
      },
      "system": false,
      "type": "auth",
      "updateRule": "id = @request.auth.id",
      "verificationTemplate": {
        "body": "<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-verification/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Verify your {APP_NAME} email"
      },
      "verificationToken": {
        "duration": 604800
      },
      "viewRule": "id = @request.auth.id"
    },
    {
      "authAlert": {
        "emailTemplate": {
          "body": "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
          "subject": "Login from a new location"
        },
        "enabled": true
      },
      "authRule": "",
      "authToken": {
        "duration": 1209600
      },
      "confirmEmailChangeTemplate": {
        "body": "<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Confirm new email</a>\n</p>\n<p><i>If you didn't ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Confirm your {APP_NAME} new email address"
      },
      "createRule": null,
      "deleteRule": null,
      "emailChangeToken": {
        "duration": 1800
      },
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "cost": 0,
          "hidden": true,
          "id": "password901924565",
          "max": 0,
          "min": 8,
          "name": "password",
          "pattern": "",
          "presentable": false,
          "required": true,
          "system": true,
          "type": "password"
        },
        {
          "autogeneratePattern": "[a-zA-Z0-9]{50}",
          "hidden": true,
          "id": "text2504183744",
          "max": 60,
          "min": 30,
          "name": "tokenKey",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "email3885137012",
          "name": "email",
          "onlyDomains": null,
          "presentable": false,
          "required": true,
          "system": true,
          "type": "email"
        },
        {
          "hidden": false,
          "id": "bool1547992806",
          "name": "emailVisibility",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "hidden": false,
          "id": "bool256245529",
          "name": "verified",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": true,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": true,
          "type": "autodate"
        }
      ],
      "fileToken": {
        "duration": 120
      },
      "id": "pbc_3142635823",
      "indexes": [
        "CREATE UNIQUE INDEX `idx_tokenKey_pbc_3142635823` ON `_superusers` (`tokenKey`)",
        "CREATE UNIQUE INDEX `idx_email_pbc_3142635823` ON `_superusers` (`email`) WHERE `email` != ''"
      ],
      "listRule": null,
      "manageRule": null,
      "mfa": {
        "duration": 1800,
        "enabled": false,
        "rule": ""
      },
      "name": "_superusers",
      "oauth2": {
        "enabled": false,
        "mappedFields": {
          "avatarURL": "",
          "id": "",
          "name": "",
          "username": ""
        }
      },
      "otp": {
        "duration": 180,
        "emailTemplate": {
          "body": "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
          "subject": "OTP for {APP_NAME}"
        },
        "enabled": false,
        "length": 8
      },
      "passwordAuth": {
        "enabled": true,
        "identityFields": [
          "email"
        ]
      },
      "passwordResetToken": {
        "duration": 1800
      },
      "resetPasswordTemplate": {
        "body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password</a>\n</p>\n<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Reset your {APP_NAME} password"
      },
      "system": true,
      "type": "auth",
      "updateRule": null,
      "verificationTemplate": {
        "body": "<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-verification/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
        "subject": "Verify your {APP_NAME} email"
      },
      "verificationToken": {
        "duration": 259200
      },
      "viewRule": null
    },
    {
      "createRule": null,
      "deleteRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text455797646",
          "max": 0,
          "min": 0,
          "name": "collectionRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text127846527",
          "max": 0,
          "min": 0,
          "name": "recordRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text2462348188",
          "max": 0,
          "min": 0,
          "name": "provider",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text1044722854",
          "max": 0,
          "min": 0,
          "name": "providerId",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": true,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": true,
          "type": "autodate"
        }
      ],
      "id": "pbc_2281828961",
      "indexes": [
        "CREATE UNIQUE INDEX `idx_externalAuths_record_provider` ON `_externalAuths` (collectionRef, recordRef, provider)",
        "CREATE UNIQUE INDEX `idx_externalAuths_collection_provider` ON `_externalAuths` (collectionRef, provider, providerId)"
      ],
      "listRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "name": "_externalAuths",
      "system": true,
      "type": "base",
      "updateRule": null,
      "viewRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
    },
    {
      "createRule": null,
      "deleteRule": null,
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text455797646",
          "max": 0,
          "min": 0,
          "name": "collectionRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text127846527",
          "max": 0,
          "min": 0,
          "name": "recordRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text1582905952",
          "max": 0,
          "min": 0,
          "name": "method",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": true,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": true,
          "type": "autodate"
        }
      ],
      "id": "pbc_2279338944",
      "indexes": [
        "CREATE INDEX `idx_mfas_collectionRef_recordRef` ON `_mfas` (collectionRef,recordRef)"
      ],
      "listRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "name": "_mfas",
      "system": true,
      "type": "base",
      "updateRule": null,
      "viewRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
    },
    {
      "createRule": null,
      "deleteRule": null,
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text455797646",
          "max": 0,
          "min": 0,
          "name": "collectionRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text127846527",
          "max": 0,
          "min": 0,
          "name": "recordRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "cost": 8,
          "hidden": true,
          "id": "password901924565",
          "max": 0,
          "min": 0,
          "name": "password",
          "pattern": "",
          "presentable": false,
          "required": true,
          "system": true,
          "type": "password"
        },
        {
          "autogeneratePattern": "",
          "hidden": true,
          "id": "text3866985172",
          "max": 0,
          "min": 0,
          "name": "sentTo",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": true,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": true,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": true,
          "type": "autodate"
        }
      ],
      "id": "pbc_1638494021",
      "indexes": [
        "CREATE INDEX `idx_otps_collectionRef_recordRef` ON `_otps` (collectionRef, recordRef)"
      ],
      "listRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "name": "_otps",
      "system": true,
      "type": "base",
      "updateRule": null,
      "viewRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
    },
    {
      "createRule": null,
      "deleteRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "fields": [
        {
          "autogeneratePattern": "[a-z0-9]{15}",
          "hidden": false,
          "id": "text3208210256",
          "max": 15,
          "min": 15,
          "name": "id",
          "pattern": "^[a-z0-9]+$",
          "presentable": false,
          "primaryKey": true,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text455797646",
          "max": 0,
          "min": 0,
          "name": "collectionRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text127846527",
          "max": 0,
          "min": 0,
          "name": "recordRef",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text4228609354",
          "max": 0,
          "min": 0,
          "name": "fingerprint",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "autodate2990389176",
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": true,
          "type": "autodate"
        },
        {
          "hidden": false,
          "id": "autodate3332085495",
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": true,
          "type": "autodate"
        }
      ],
      "id": "pbc_4275539003",
      "indexes": [
        "CREATE UNIQUE INDEX `idx_authOrigins_unique_pairs` ON `_authOrigins` (collectionRef, recordRef, fingerprint)"
      ],
      "listRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId",
      "name": "_authOrigins",
      "system": true,
      "type": "base",
      "updateRule": null,
      "viewRule": "@request.auth.id != '' && recordRef = @request.auth.id && collectionRef = @request.auth.collectionId"
    }
  ];

  return app.importCollections(snapshot, false);
}, (app) => {
  return null;
})
