package hooks

import "github.com/pocketbase/pocketbase/core"

func Register(app core.App) {
	registerAudit(app)
	registerBatchHeaderGuard(app)
	registerCaptcha(app)
	registerUserGuards(app)
	registerAdminRoleGuard(app)
	registerLocationGuards(app)
	registerMapGuards(app)
	registerRouteArchiveStamp(app)
	registerRatingImport(app)
	registerTicks(app)
	registerReports(app)
	registerTasks(app)
	registerNotifications(app)
	registerSMTPFromEnv(app)
}
