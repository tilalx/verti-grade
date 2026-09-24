package hooks

import "github.com/pocketbase/pocketbase/core"

func Register(app core.App) {
	registerAudit(app)
	registerCaptcha(app)
	registerUserGuards(app)
	registerLocationGuards(app)
	registerRouteArchiveStamp(app)
	registerReports(app)
	registerNotifications(app)
	registerSMTPFromEnv(app)
}
