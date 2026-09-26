package hooks

import (
	"fmt"
	"html"
	"net/http"
	"net/mail"
	"slices"
	"strings"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
	"github.com/pocketbase/pocketbase/tools/types"
)

var reportReasonLabels = map[string]string{
	"hate_speech":     "Hate speech",
	"harassment":      "Harassment",
	"violence_threat": "Threat of violence",
	"sexual_content":  "Sexual content",
	"personal_data":   "Personal data",
	"ip_infringement": "Intellectual property infringement",
	"spam_fraud":      "Spam or fraud",
	"other":           "Other",
}

func registerReports(app core.App) {
	app.OnRecordCreateRequest("reports").BindFunc(func(e *core.RecordRequestEvent) error {
		e.Record.Set("status", "open")
		e.Record.Set("decision", "")
		e.Record.Set("decision_reason", "")
		e.Record.Set("decided_at", "")
		e.Record.Set("decided_by", "")
		e.Record.Set("receipt_sent", false)
		e.Record.Set("notified_at", "")
		e.Record.Set("content_snapshot", truncateRunes(reportedContentSnapshot(e.App, e.Record), 5000))
		return e.Next()
	})

	app.OnRecordAfterCreateSuccess("reports").BindFunc(func(e *core.RecordEvent) error {
		pushNotification(e.App, notification{
			Users:  usersByPermission(e.App, "manage_reports"),
			Type:   "report_filed",
			Params: map[string]any{"snippet": truncateRunes(e.Record.GetString("content_snapshot"), 140)},
			URL:    "/manage/reports",
		})

		if err := sendReportReceipt(e.App, e.Record); err != nil {
			e.App.Logger().Error("reports: receipt/alert mail failed", "report", e.Record.Id, "error", err)
		}
		return e.Next()
	})

	app.OnRecordAfterUpdateSuccess("reports").BindFunc(func(e *core.RecordEvent) error {
		notifyReportDecided(e.App, e.Record)

		if err := sendReportDecision(e.App, e.Record); err != nil {
			e.App.Logger().Error("reports: decision mail failed", "report", e.Record.Id, "error", err)
		}
		return e.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/mail-status", func(e *core.RequestEvent) error {
			return e.JSON(http.StatusOK, map[string]bool{"configured": e.App.Settings().SMTP.Enabled})
		}).Bind(apis.RequireAuth())
		return se.Next()
	})
}

func reportedContentSnapshot(app core.App, report *core.Record) string {
	contentID := report.GetString("content_id")
	if report.GetString("content_type") == "route" {
		route, err := app.FindRecordById("routes", contentID)
		if err != nil {
			return ""
		}
		parts := slices.DeleteFunc(
			[]string{route.GetString("name"), route.GetString("comment")},
			func(part string) bool { return part == "" },
		)
		return strings.Join(parts, " - ")
	}
	rating, err := app.FindRecordById("ratings", contentID)
	if err != nil {
		return ""
	}
	return rating.GetString("comment")
}

func notifyReportDecided(app core.App, report *core.Record) {
	status := report.GetString("status")
	wasOpen := report.Original().GetString("status") == "open"
	if !wasOpen || status == "" || status == "open" || !report.GetDateTime("notified_at").IsZero() {
		return
	}

	decider := ""
	if decidedBy := report.GetStringSlice("decided_by"); len(decidedBy) > 0 {
		decider = decidedBy[0]
	}
	recipients := slices.DeleteFunc(usersByPermission(app, "manage_reports"), func(user *core.Record) bool {
		return user.Id == decider
	})

	notificationType := "report_decided_kept"
	if report.GetString("decision") == "content_removed" {
		notificationType = "report_decided_removed"
	}

	pushNotification(app, notification{Users: recipients, Type: notificationType, URL: "/manage/reports"})
}

func sendReportReceipt(app core.App, report *core.Record) error {
	if !app.Settings().SMTP.Enabled {
		app.Logger().Warn("reports: SMTP disabled, Art. 16(4) receipt not sent", "report", report.Id)
		return nil
	}

	appName := app.Settings().Meta.AppName
	summary := reportSummaryHTML(app, report)

	receiptSent, err := sendMail(
		app,
		[]string{report.GetString("notifier_email")},
		"We received your report - "+appName,
		reportReceiptHTML(report),
	)
	if err != nil {
		return err
	}

	if _, err := sendMail(
		app,
		reportAlertRecipients(app),
		"New content report - "+appName,
		fmt.Sprintf(`<p>A new report was submitted and is awaiting review.</p>
             %s
             <p><strong>Reported by:</strong> %s
             (%s)</p>
             <p><a href="%s/manage/reports">Open the moderation queue</a></p>`,
			summary,
			html.EscapeString(report.GetString("notifier_name")),
			html.EscapeString(report.GetString("notifier_email")),
			html.EscapeString(appURL(app)),
		),
	); err != nil {
		return err
	}

	if !receiptSent {
		return nil
	}
	report.Set("receipt_sent", true)
	return app.Save(report)
}

func reportReceiptHTML(report *core.Record) string {
	return fmt.Sprintf(`<p>Hello,</p>
             <p>We have received your report and will review it without undue delay.
             You will be informed of the decision and of the ways to challenge it.</p>
             <p><strong>Reason:</strong> %s</p>
             <p>Reference: %s</p>`,
		html.EscapeString(reportReasonLabel(report.GetString("reason"))),
		html.EscapeString(report.Id),
	)
}

func sendReportDecision(app core.App, report *core.Record) error {
	if report.GetString("status") == "open" || !report.GetDateTime("notified_at").IsZero() {
		return nil
	}
	if !app.Settings().SMTP.Enabled {
		app.Logger().Warn("reports: SMTP disabled, Art. 16(5) decision notice not sent", "report", report.Id)
		return nil
	}

	outcome := "The reported content has been kept online."
	if report.GetString("decision") == "content_removed" {
		outcome = "The reported content has been removed."
	}
	reasoning := ""
	if reason := report.GetString("decision_reason"); reason != "" {
		reasoning = fmt.Sprintf("<p><strong>Reasoning:</strong><br>%s</p>", html.EscapeString(reason))
	}

	if _, err := sendMail(
		app,
		[]string{report.GetString("notifier_email")},
		"Decision on your report - "+app.Settings().Meta.AppName,
		fmt.Sprintf(`<p>Hello %s,</p>
             <p>We have reviewed your report (reference %s).</p>
             <p><strong>Decision:</strong> %s</p>
             %s
             %s`,
			html.EscapeString(report.GetString("notifier_name")),
			html.EscapeString(report.Id),
			html.EscapeString(outcome),
			reasoning,
			reportRedressHTML(app),
		),
	); err != nil {
		return err
	}

	report.Set("notified_at", types.NowDateTime())
	return app.Save(report)
}

func sendMail(app core.App, recipients []string, subject string, body string) (bool, error) {
	to := []mail.Address{}
	for _, address := range recipients {
		if address != "" {
			to = append(to, mail.Address{Address: address})
		}
	}
	if len(to) == 0 {
		return false, nil
	}

	meta := app.Settings().Meta
	message := &mailer.Message{
		From:    mail.Address{Address: meta.SenderAddress, Name: meta.SenderName},
		To:      to,
		Subject: subject,
		HTML:    body,
	}
	if err := app.NewMailClient().Send(message); err != nil {
		return false, err
	}
	return true, nil
}

func reportAlertRecipients(app core.App) []string {
	addresses := []string{}
	for _, user := range usersByPermission(app, "manage_reports") {
		if address := user.GetString("email"); address != "" && !slices.Contains(addresses, address) {
			addresses = append(addresses, address)
		}
	}
	if contact := contactEmail(app); contact != "" && !slices.Contains(addresses, contact) {
		addresses = append(addresses, contact)
	}
	return addresses
}

func reportSummaryHTML(app core.App, report *core.Record) string {
	contentURL := report.GetString("content_url")
	if !strings.HasPrefix(contentURL, "http") {
		contentURL = appURL(app) + contentURL
	}

	snapshot := html.EscapeString(report.GetString("content_snapshot"))
	if snapshot == "" {
		snapshot = "<em>unavailable</em>"
	}

	return fmt.Sprintf(`
        <p><strong>Reason:</strong> %s</p>
        <p><strong>Reported content:</strong> <a href="%s">%s</a></p>
        <p><strong>Explanation:</strong><br>%s</p>
        <p><strong>Content at the time of the report:</strong><br>%s</p>
    `,
		html.EscapeString(reportReasonLabel(report.GetString("reason"))),
		html.EscapeString(contentURL),
		html.EscapeString(contentURL),
		html.EscapeString(report.GetString("explanation")),
		snapshot,
	)
}

func reportRedressHTML(app core.App) string {
	contactLine := ""
	if contact := contactEmail(app); contact != "" {
		escaped := html.EscapeString(contact)
		contactLine = fmt.Sprintf(`<li>Contacting the operator directly at <a href="mailto:%s">%s</a>.</li>`, escaped, escaped)
	}

	return fmt.Sprintf(`
        <p><strong>How to challenge this decision</strong></p>
        <ul>
            <li>Out-of-court dispute settlement before a certified body under Article 21 of the Digital Services Act.</li>
            <li>Judicial remedy before the competent court.</li>
            %s
        </ul>
    `, contactLine)
}

func reportReasonLabel(reason string) string {
	if label, ok := reportReasonLabels[reason]; ok {
		return label
	}
	return firstNonEmpty(reason, "Other")
}

func appURL(app core.App) string {
	return strings.TrimRight(app.Settings().Meta.AppURL, "/")
}

func contactEmail(app core.App) string {
	settings, err := app.FindRecordById("settings", "settings_123456")
	if err != nil {
		return ""
	}
	return settings.GetString("contact_email")
}
