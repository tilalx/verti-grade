package hooks

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

const defaultRoleName = "user"

func registerUserGuards(app core.App) {
	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Record.GetString("role") != "" {
			return e.Next()
		}
		role, err := e.App.FindFirstRecordByData("roles", "name", defaultRoleName)
		if err == nil {
			e.Record.Set("role", role.Id)
		}
		return e.Next()
	})

	app.OnRecordUpdateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.HasSuperuserAuth() {
			return e.Next()
		}
		if e.Record.Original().GetString("role") == e.Record.GetString("role") {
			return e.Next()
		}
		if e.Auth == nil || !hasPermission(e.App, e.Auth.Id, "manage_users") {
			return apis.NewForbiddenError("Changing a role requires manage_users.", nil)
		}
		return e.Next()
	})
}

func hasPermission(app core.App, userID string, permission string) bool {
	holders, err := app.FindRecordsByFilter(
		"users",
		"id = {:id} && role.permissions.name ?= {:permission}",
		"",
		1,
		0,
		dbx.Params{"id": userID, "permission": permission},
	)
	return err == nil && len(holders) > 0
}
