package hooks

import (
	"os"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

const captchaHeader = "x_cap_token"

var captchaRateLimits = map[string]int{"ratings:create": 240, "reports:create": 20}

func registerCaptcha(app core.App) {
	app.OnRecordCreateRequest("ratings").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			if err := enforceCaptcha(e.RequestEvent, "rating"); err != nil {
				return err
			}
		}
		return e.Next()
	})

	app.OnRecordCreateRequest("reports").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			if err := enforceCaptcha(e.RequestEvent, "report"); err != nil {
				return err
			}
		}
		return e.Next()
	})

	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil && !isOAuth2Request(e.RequestEvent) {
			if err := enforceCaptcha(e.RequestEvent, "register"); err != nil {
				return err
			}
		}
		return e.Next()
	})

	app.OnRecordAuthWithPasswordRequest("users").BindFunc(func(e *core.RecordAuthWithPasswordRequestEvent) error {
		if err := enforceCaptcha(e.RequestEvent, "login"); err != nil {
			return err
		}
		return e.Next()
	})

	app.OnRecordRequestPasswordResetRequest("users").BindFunc(func(e *core.RecordRequestPasswordResetRequestEvent) error {
		if e.Auth == nil {
			if err := enforceCaptcha(e.RequestEvent, "password-reset"); err != nil {
				return err
			}
		}
		return e.Next()
	})

	app.Cron().MustAdd("capNoncePrune", "41 * * * *", func() {
		if _, err := pruneRows(app, "DELETE FROM cap_nonces WHERE created < {:cutoff}", dbx.Params{"cutoff": cutoff(time.Hour)}); err != nil {
			app.Logger().Error("cap: nonce prune failed", "error", err)
		}
	})

	app.OnBootstrap().BindFunc(func(e *core.BootstrapEvent) error {
		if err := e.Next(); err != nil {
			return err
		}
		if os.Getenv("CAP_SECRET") == "" {
			return nil
		}

		settings := e.App.Settings()
		changed := false
		for i, rule := range settings.RateLimits.Rules {
			target, ok := captchaRateLimits[rule.Label]
			if ok && rule.MaxRequests != target {
				settings.RateLimits.Rules[i].MaxRequests = target
				changed = true
			}
		}
		if !changed {
			return nil
		}
		if err := e.App.Save(settings); err != nil {
			e.App.Logger().Error("cap: could not adjust rate limits", "error", err)
			return nil
		}
		e.App.Logger().Info("cap: raised captcha-gated rate limits")
		return nil
	})
}

func enforceCaptcha(e *core.RequestEvent, scope string) error {
	secret := os.Getenv("CAP_SECRET")
	if secret == "" {
		return nil
	}

	token := ""
	if info, err := e.RequestInfo(); err == nil {
		token = info.Headers[captchaHeader]
	}
	if token == "" {
		return apis.NewBadRequestError("Captcha verification required.", nil)
	}

	claims, err := security.ParseJWT(token, secret)
	if err != nil {
		return apis.NewBadRequestError("Captcha verification failed.", nil)
	}
	if claimString(claims, "scope") != scope {
		return apis.NewBadRequestError("Captcha verification failed.", nil)
	}
	jti := claimString(claims, "jti")
	if jti == "" {
		return apis.NewBadRequestError("Captcha verification failed.", nil)
	}

	collection, err := e.App.FindCollectionByNameOrId("cap_nonces")
	if err != nil {
		return apis.NewBadRequestError("Captcha token already used.", nil)
	}
	nonce := core.NewRecord(collection)
	nonce.Set("jti", jti)
	if err := e.App.Save(nonce); err != nil {
		return apis.NewBadRequestError("Captcha token already used.", nil)
	}
	return nil
}

func isOAuth2Request(e *core.RequestEvent) bool {
	info, err := e.RequestInfo()
	return err == nil && info.Context == core.RequestInfoContextOAuth2
}

func claimString(claims map[string]any, key string) string {
	value, _ := claims[key].(string)
	return value
}
