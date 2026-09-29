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
			if !e.HasSuperuserAuth() && !callerMayAssignRole(e.App, e.Auth, e.Record.GetString("role")) {
				return apis.NewForbiddenError("You cannot assign a role with permissions you do not hold.", nil)
			}
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
		if !callerMayAssignRole(e.App, e.Auth, e.Record.GetString("role")) {
			return apis.NewForbiddenError("You cannot assign a role with permissions you do not hold.", nil)
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
	app.OnRecordCreateRequest("roles").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.HasSuperuserAuth() {
			return e.Next()
		}
		if !isSubset(e.Record.GetStringSlice("permissions"), callerPermissionIDs(e.App, e.Auth)) {
			return apis.NewForbiddenError("You cannot grant permissions you do not hold.", nil)
		}
		return e.Next()
	})

	app.OnRecordUpdateRequest("roles").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.HasSuperuserAuth() {
			return e.Next()
		}
		original := e.Record.Original()
		if !adminRoleChangeAllowed(original.GetString("name"), e.Record.GetString("name"), original.GetStringSlice("permissions"), e.Record.GetStringSlice("permissions")) {
			return apis.NewForbiddenError("The admin role cannot be renamed or lose permissions.", nil)
		}
		added := addedPermissions(original.GetStringSlice("permissions"), e.Record.GetStringSlice("permissions"))
		if !isSubset(added, callerPermissionIDs(e.App, e.Auth)) {
			return apis.NewForbiddenError("You cannot grant permissions you do not hold.", nil)
		}
		return e.Next()
	})
}

func callerMayAssignRole(app core.App, caller *core.Record, roleID string) bool {
	if caller == nil {
		return false
	}
	role, err := app.FindRecordById("roles", roleID)
	if err != nil {
		return false
	}
	callerRole, err := app.FindRecordById("roles", caller.GetString("role"))
	if err != nil {
		return false
	}
	if role.GetString("name") == adminRoleName && callerRole.GetString("name") != adminRoleName {
		return false
	}
	return isSubset(role.GetStringSlice("permissions"), callerRole.GetStringSlice("permissions"))
}

func callerPermissionIDs(app core.App, caller *core.Record) []string {
	if caller == nil {
		return nil
	}
	role, err := app.FindRecordById("roles", caller.GetString("role"))
	if err != nil {
		return nil
	}
	return role.GetStringSlice("permissions")
}

func addedPermissions(before, after []string) []string {
	return slices.DeleteFunc(slices.Clone(after), func(permission string) bool {
		return slices.Contains(before, permission)
	})
}

func isSubset(subset, superset []string) bool {
	return !slices.ContainsFunc(subset, func(item string) bool {
		return !slices.Contains(superset, item)
	})
}

func adminRoleChangeAllowed(nameBefore, nameAfter string, permissionsBefore, permissionsAfter []string) bool {
	if nameBefore != adminRoleName {
		return true
	}
	if nameAfter != adminRoleName {
		return false
	}
	return isSubset(permissionsBefore, permissionsAfter)
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
