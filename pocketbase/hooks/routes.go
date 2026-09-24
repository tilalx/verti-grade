package hooks

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func registerRouteArchiveStamp(app core.App) {
	stamp := func(e *core.RecordEvent) error {
		e.Record.Set("archived_at", archivedAt(
			e.Record.Original().GetBool("archived"),
			e.Record.GetBool("archived"),
			e.Record.GetDateTime("archived_at"),
			types.NowDateTime(),
		))
		return e.Next()
	}
	app.OnRecordCreate("routes").BindFunc(stamp)
	app.OnRecordUpdate("routes").BindFunc(stamp)
}

func archivedAt(wasArchived, isArchived bool, current, now types.DateTime) types.DateTime {
	if !isArchived {
		return types.DateTime{}
	}
	if !wasArchived || current.IsZero() {
		return now
	}
	return current
}
