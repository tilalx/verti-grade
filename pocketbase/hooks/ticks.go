package hooks

import (
	"github.com/pocketbase/pocketbase/core"
)

var tickGradeFields = []string{"grade", "grade_system", "grade_index"}

func registerTicks(app core.App) {
	app.OnRecordCreate("ticks").BindFunc(func(e *core.RecordEvent) error {
		if route, err := e.App.FindRecordById("routes", e.Record.GetString("route")); err == nil {
			for _, field := range tickGradeFields {
				e.Record.Set(field, route.Get(field))
			}
		}
		normalizeFlashAttempts(e.Record)
		return e.Next()
	})

	app.OnRecordUpdate("ticks").BindFunc(func(e *core.RecordEvent) error {
		normalizeFlashAttempts(e.Record)
		return e.Next()
	})
}

func normalizeFlashAttempts(tick *core.Record) {
	if tick.GetString("type") == "flash" {
		tick.Set("attempts", 1)
	}
}
