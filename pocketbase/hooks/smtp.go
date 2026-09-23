package hooks

import (
	"os"
	"strconv"

	"github.com/pocketbase/pocketbase/core"
)

func registerSMTPFromEnv(app core.App) {
	app.OnBootstrap().BindFunc(func(e *core.BootstrapEvent) error {
		if err := e.Next(); err != nil {
			return err
		}

		host := os.Getenv("PB_SMTP_HOST")
		if host == "" {
			return nil
		}

		port, err := strconv.Atoi(firstNonEmpty(os.Getenv("PB_SMTP_PORT"), "587"))
		if err != nil {
			port = 587
		}

		settings := e.App.Settings()
		settings.SMTP.Enabled = true
		settings.SMTP.Host = host
		settings.SMTP.Port = port
		settings.SMTP.Username = os.Getenv("PB_SMTP_USERNAME")
		settings.SMTP.Password = os.Getenv("PB_SMTP_PASSWORD")
		settings.SMTP.TLS = os.Getenv("PB_SMTP_TLS") != "false"

		if value := os.Getenv("PB_APP_URL"); value != "" {
			settings.Meta.AppURL = value
		}
		if value := os.Getenv("PB_SENDER_ADDRESS"); value != "" {
			settings.Meta.SenderAddress = value
		}
		if value := os.Getenv("PB_SENDER_NAME"); value != "" {
			settings.Meta.SenderName = value
		}
		if value := os.Getenv("PB_APP_NAME"); value != "" {
			settings.Meta.AppName = value
		}

		if err := e.App.Save(settings); err != nil {
			e.App.Logger().Error("smtp: env configuration failed", "error", err)
			return nil
		}
		e.App.Logger().Info("smtp: configured from environment", "host", host)
		return nil
	})
}
