package hooks

import (
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func cutoff(age time.Duration) string {
	return types.NowDateTime().Add(-age).String()
}

func days(n int) time.Duration {
	return time.Duration(n) * 24 * time.Hour
}

func pruneRows(app core.App, query string, params dbx.Params) (int64, error) {
	result, err := app.DB().NewQuery(query).Bind(params).Execute()
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
