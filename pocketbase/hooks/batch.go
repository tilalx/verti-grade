package hooks

import "github.com/pocketbase/pocketbase/core"

func registerBatchHeaderGuard(app core.App) {
	app.OnBatchRequest().BindFunc(func(e *core.BatchRequestEvent) error {
		dropSubRequestHeaders(e.Batch)
		return e.Next()
	})
}

func dropSubRequestHeaders(batch []*core.InternalRequest) {
	for _, request := range batch {
		request.Headers = nil
	}
}
