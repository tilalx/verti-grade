package hooks

import (
	"net/http"
	"net/url"
	"slices"
	"strings"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

var captchaGatedCollections = []string{"ratings", "reports"}

func registerBatchHeaderGuard(app core.App) {
	app.OnBatchRequest().BindFunc(func(e *core.BatchRequestEvent) error {
		if e.Auth == nil && countCaptchaGatedCreates(e.App, e.Batch) > 1 {
			return apis.NewBadRequestError("Guests must submit ratings and reports one at a time.", nil)
		}
		dropSubRequestHeaders(e.Batch)
		return e.Next()
	})
}

func dropSubRequestHeaders(batch []*core.InternalRequest) {
	for _, request := range batch {
		request.Headers = nil
	}
}

func countCaptchaGatedCreates(app core.App, batch []*core.InternalRequest) int {
	count := 0
	for _, request := range batch {
		method := strings.ToUpper(request.Method)
		if method != http.MethodPost && method != http.MethodPut {
			continue
		}
		parsed, err := url.Parse(request.URL)
		if err != nil {
			continue
		}
		trimmed, hasPrefix := strings.CutPrefix(parsed.Path, "/api/collections/")
		collectionRef, hasSuffix := strings.CutSuffix(trimmed, "/records")
		if !hasPrefix || !hasSuffix {
			continue
		}
		collection, err := app.FindCachedCollectionByNameOrId(collectionRef)
		if err == nil && slices.Contains(captchaGatedCollections, collection.Name) {
			count++
		}
	}
	return count
}
