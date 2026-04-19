package main

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func registerHooks(app core.App) {
	registerRoutes(app)
	registerSideEffectHooks(app)
	registerTenantEnforcement(app)
}

// ── Custom API routes ─────────────────────────────────────────────────────────

func registerRoutes(app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Resolve a tenant from a domain name.
		// Steps: (1) exact domain match, (2) slug-as-first-subdomain, (3) single-tenant fallback.
		se.Router.GET("/api/tenant-by-domain", func(e *core.RequestEvent) error {
			domain := e.Request.URL.Query().Get("domain")
			if domain == "" {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "domain required"})
			}

			var tenant *core.Record

			// 1. Exact custom domain match (JSON array field contains the domain)
			tenant, _ = e.App.FindFirstRecordByFilter(
				"tenants",
				"domains ~ {:domain} && active = true",
				dbx.Params{"domain": domain},
			)

			// 2. Slug matches the first subdomain segment (e.g. "acme" in acme.example.com)
			if tenant == nil {
				slug := strings.SplitN(domain, ".", 2)[0]
				tenant, _ = e.App.FindFirstRecordByFilter(
					"tenants",
					"slug = {:slug} && active = true",
					dbx.Params{"slug": slug},
				)
			}

			// 3. Single-tenant fallback: return the only active tenant regardless of domain
			if tenant == nil {
				tenants, err := e.App.FindRecordsByFilter("tenants", "active = true", "", 2, 0)
				if err == nil && len(tenants) == 1 {
					tenant = tenants[0]
				}
			}

			if tenant == nil {
				return e.JSON(http.StatusNotFound, map[string]string{"error": "tenant not found"})
			}

			return e.JSON(http.StatusOK, map[string]string{
				"id":   tenant.Id,
				"name": tenant.GetString("name"),
				"slug": tenant.GetString("slug"),
			})
		})

		return se.Next()
	})
}

// ── Side-effect hooks ─────────────────────────────────────────────────────────

func registerSideEffectHooks(app core.App) {
	// Auto-create a settings record whenever a new tenant is created.
	app.OnRecordAfterCreateSuccess("tenants").BindFunc(func(e *core.RecordEvent) error {
		settingsCol, err := e.App.FindCollectionByNameOrId("settings")
		if err != nil {
			return e.Next()
		}
		newSettings := core.NewRecord(settingsCol)
		newSettings.Set("tenant_id", e.Record.Id)
		if err := e.App.SaveNoValidate(newSettings); err != nil {
			slog.Error("failed to auto-create settings for tenant", "tenant_id", e.Record.Id, "error", err)
		}
		return e.Next()
	})

	// Auto-assign a newly created user to the tenant indicated by the X-Tenant-Id header.
	// Uses post-next pattern: capture header before save, create tenant_users after save
	// (e.Record.Id is only available once e.Next() has returned successfully).
	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		tenantId := e.Request.Header.Get("X-Tenant-Id")

		if err := e.Next(); err != nil {
			return err
		}

		if tenantId == "" {
			return nil
		}

		tuCol, err := e.App.FindCollectionByNameOrId("tenant_users")
		if err != nil {
			return nil
		}
		tu := core.NewRecord(tuCol)
		tu.Set("tenant_id", tenantId)
		tu.Set("user_id", e.Record.Id)
		if err := e.App.SaveNoValidate(tu); err != nil {
			slog.Error("failed to auto-assign user to tenant", "tenant_id", tenantId, "user_id", e.Record.Id, "error", err)
		}
		return nil
	})
}

// ── Tenant enforcement: auto-inject tenant_id on record create ────────────────

func registerTenantEnforcement(app core.App) {
	// The client sends X-Tenant-Id header (set globally via pb.beforeSend in the
	// Nuxt frontend). The hook verifies the authenticated user is a member of the
	// claimed tenant, then sets tenant_id on the record — ignoring whatever value
	// the client body may have included.
	app.OnRecordCreateRequest("routes", "ratings", "locations").BindFunc(
		func(e *core.RecordRequestEvent) error {
			tenantId := e.Request.Header.Get("X-Tenant-Id")
			if tenantId == "" {
				return apis.NewBadRequestError("X-Tenant-Id header is required", nil)
			}

			if e.Auth == nil {
				return apis.NewUnauthorizedError("authentication required", nil)
			}

			// Verify user is a member of the claimed tenant
			_, err := e.App.FindFirstRecordByFilter(
				"tenant_users",
				"tenant_id = {:tenantId} && user_id = {:userId}",
				dbx.Params{"tenantId": tenantId, "userId": e.Auth.Id},
			)
			if err != nil {
				// Super-admins bypass tenant membership check
				if !e.Auth.GetBool("is_super_admin") {
					return apis.NewApiError(http.StatusForbidden, "not a member of this tenant", nil)
				}
			}

			// Server authority: set tenant_id, overriding any client-supplied value
			e.Record.Set("tenant_id", tenantId)

			return e.Next()
		},
	)
}
