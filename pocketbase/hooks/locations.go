package hooks

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func registerLocationGuards(app core.App) {
	app.OnRecordDeleteRequest("locations").BindFunc(func(e *core.RecordRequestEvent) error {
		routeCount, err := e.App.CountRecords("routes", dbx.HashExp{"location": e.Record.Id})
		if err != nil {
			return err
		}
		if routeCount > 0 {
			return apis.NewBadRequestError("Location is still used by routes.", map[string]any{"routeCount": routeCount})
		}
		return e.Next()
	})
}
