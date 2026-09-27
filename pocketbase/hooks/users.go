package hooks

import (
	"slices"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
)

const (
	defaultRoleName = "user"
	adminRoleName   = "admin"
)

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

	app.OnRecordDeleteExecute("users").Bind(&hook.Handler[*core.RecordEvent]{
		Priority: 100,
		Func: func(e *core.RecordEvent) error {
			if _, err := e.App.DB().NewQuery("UPDATE audit_logs SET actor = '' WHERE actor = {:id}").
				Bind(dbx.Params{"id": e.Record.Id}).Execute(); err != nil {
				return err
			}
			return e.Next()
		},
	})
}

func registerAdminRoleGuard(app core.App) {
	app.OnRecordUpdateRequest("roles").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.HasSuperuserAuth() {
			return e.Next()
		}
		original := e.Record.Original()
		if !adminRoleChangeAllowed(original.GetString("name"), e.Record.GetString("name"), original.GetStringSlice("permissions"), e.Record.GetStringSlice("permissions")) {
			return apis.NewForbiddenError("The admin role cannot be renamed or lose permissions.", nil)
		}
		return e.Next()
	})
}

func adminRoleChangeAllowed(nameBefore, nameAfter string, permissionsBefore, permissionsAfter []string) bool {
	if nameBefore != adminRoleName {
		return true
	}
	if nameAfter != adminRoleName {
		return false
	}
	return !slices.ContainsFunc(permissionsBefore, func(permission string) bool {
		return !slices.Contains(permissionsAfter, permission)
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
