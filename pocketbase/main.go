package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"pocketbase/hooks"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/ghupdate"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// ---------------------------------------------------------------
	// Optional plugin flags:
	// ---------------------------------------------------------------

	var migrationsDir string
	app.RootCmd.PersistentFlags().StringVar(
		&migrationsDir,
		"migrationsDir",
		"",
		"the directory with the user defined migrations",
	)

	var automigrate bool
	app.RootCmd.PersistentFlags().BoolVar(
		&automigrate,
		"automigrate",
		true,
		"enable/disable auto migrations",
	)

	var publicDir string
	app.RootCmd.PersistentFlags().StringVar(
		&publicDir,
		"publicDir",
		defaultPublicDir(),
		"the directory to serve static files",
	)

	var indexFallback bool
	app.RootCmd.PersistentFlags().BoolVar(
		&indexFallback,
		"indexFallback",
		true,
		"fallback the request to index.html on missing static path (e.g., when pretty URLs are used with SPA)",
	)

	app.RootCmd.ParseFlags(os.Args[1:])

	// ---------------------------------------------------------------
	// Plugins and hooks:
	// ---------------------------------------------------------------

	// Load JSVM (migrations)
	jsvm.MustRegister(app, jsvm.Config{
		MigrationsDir: migrationsDir,
	})

	// Migrate command (with JS templates)
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
		Automigrate:  automigrate,
		Dir:          migrationsDir,
	})

	// GitHub self-update
	ghupdate.MustRegister(app, app.RootCmd, ghupdate.Config{})

	// ---------------------------------------------------------------

	hooks.Register(app)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Serve static files from the provided public directory (if exists)
		se.Router.GET("/{$}", func(e *core.RequestEvent) error {
			return e.JSON(http.StatusOK, map[string]string{
				"message": "This is only the pocketbase server. Please visit https://pocketbase.io for more information.",
			})
		})
		se.Router.GET("/*", apis.Static(os.DirFS(publicDir), indexFallback))
		se.Router.GET("/api/online", func(e *core.RequestEvent) error {
			count := 0
			clients := app.SubscriptionsBroker().Clients()
			for range clients {
				count++
			}
			return e.JSON(http.StatusOK, map[string]int{"clients": count})
		})
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// The default pb_public directory location is relative to the executable
func defaultPublicDir() string {
	if strings.HasPrefix(os.Args[0], os.TempDir()) {
		// Most likely ran with go run
		return "./pb_public"
	}
	return filepath.Join(os.Args[0], "../pb_public")
}
