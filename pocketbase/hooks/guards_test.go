package hooks

import (
	"slices"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func TestReconcileCaptchaRateLimits(t *testing.T) {
	stale := []core.RateLimitRule{
		{Label: "*:authWithPassword", Duration: 300, MaxRequests: 10},
		{Label: "reports:create", Duration: 3600, MaxRequests: 20},
		{Label: "ratings:create", Duration: 600, MaxRequests: 240},
	}

	enabled := reconcileCaptchaRateLimits(stale, true)
	wantEnabled := []core.RateLimitRule{
		{Label: "*:authWithPassword", Duration: 300, MaxRequests: 10},
		{Label: "reports:create", Audience: core.RateLimitRuleAudienceGuest, Duration: 3600, MaxRequests: 20},
		{Label: "reports:create", Duration: 3600, MaxRequests: 5},
		{Label: "ratings:create", Audience: core.RateLimitRuleAudienceGuest, Duration: 600, MaxRequests: 240},
		{Label: "ratings:create", Duration: 600, MaxRequests: 60},
	}
	if !slices.Equal(enabled, wantEnabled) {
		t.Fatalf("enabled = %v, want %v", enabled, wantEnabled)
	}
	if again := reconcileCaptchaRateLimits(enabled, true); !slices.Equal(again, enabled) {
		t.Fatalf("reconcile is not idempotent: %v", again)
	}

	disabled := reconcileCaptchaRateLimits(enabled, false)
	wantDisabled := []core.RateLimitRule{
		{Label: "*:authWithPassword", Duration: 300, MaxRequests: 10},
		{Label: "reports:create", Duration: 3600, MaxRequests: 5},
		{Label: "ratings:create", Duration: 600, MaxRequests: 60},
	}
	if !slices.Equal(disabled, wantDisabled) {
		t.Fatalf("disabled = %v, want %v", disabled, wantDisabled)
	}

	adminTuned := []core.RateLimitRule{
		{Label: "reports:create", Audience: core.RateLimitRuleAudienceGuest, Duration: 3600, MaxRequests: 3},
		{Label: "reports:create", Duration: 3600, MaxRequests: 10},
		{Label: "ratings:create", Duration: 600, MaxRequests: 100},
	}
	if kept := reconcileCaptchaRateLimits(adminTuned, false); !slices.Equal(kept, adminTuned) {
		t.Fatalf("admin-tuned limits overwritten with captcha disabled: %v", kept)
	}
	wantTunedEnabled := []core.RateLimitRule{
		{Label: "reports:create", Audience: core.RateLimitRuleAudienceGuest, Duration: 3600, MaxRequests: 3},
		{Label: "reports:create", Duration: 3600, MaxRequests: 10},
		{Label: "ratings:create", Audience: core.RateLimitRuleAudienceGuest, Duration: 600, MaxRequests: 240},
		{Label: "ratings:create", Duration: 600, MaxRequests: 100},
	}
	if tuned := reconcileCaptchaRateLimits(adminTuned, true); !slices.Equal(tuned, wantTunedEnabled) {
		t.Fatalf("admin-tuned enabled = %v, want %v", tuned, wantTunedEnabled)
	}

	limits := core.RateLimitsConfig{Rules: enabled}
	guestRule, _ := limits.FindRateLimitRule([]string{"ratings:create"}, core.RateLimitRuleAudienceAll, core.RateLimitRuleAudienceGuest)
	authRule, _ := limits.FindRateLimitRule([]string{"ratings:create"}, core.RateLimitRuleAudienceAll, core.RateLimitRuleAudienceAuth)
	if guestRule.MaxRequests != 240 || authRule.MaxRequests != 60 {
		t.Fatalf("guest limit %d, auth limit %d", guestRule.MaxRequests, authRule.MaxRequests)
	}
}

func TestAdminRoleChangeAllowed(t *testing.T) {
	permissions := []string{"p1", "p2"}
	cases := []struct {
		name                  string
		nameBefore, nameAfter string
		after                 []string
		want                  bool
	}{
		{"other role may change freely", "setter", "renamed", nil, true},
		{"admin gains a permission", "admin", "admin", []string{"p2", "p1", "p3"}, true},
		{"admin unchanged", "admin", "admin", permissions, true},
		{"admin renamed", "admin", "owner", permissions, false},
		{"admin loses a permission", "admin", "admin", []string{"p1"}, false},
	}
	for _, c := range cases {
		if got := adminRoleChangeAllowed(c.nameBefore, c.nameAfter, permissions, c.after); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

func TestPermissionSetHelpers(t *testing.T) {
	if !isSubset([]string{"p1"}, []string{"p1", "p2"}) || !isSubset(nil, []string{"p1"}) {
		t.Error("subset not recognised")
	}
	if isSubset([]string{"p1", "p3"}, []string{"p1", "p2"}) {
		t.Error("extra permission treated as subset")
	}
	if added := addedPermissions([]string{"p1"}, []string{"p1", "p2"}); !slices.Equal(added, []string{"p2"}) {
		t.Errorf("added = %v", added)
	}
}

func TestKeepServerOwnedReportFields(t *testing.T) {
	collection := core.NewBaseCollection("reports")
	for _, name := range []string{"status", "decision", "decided_by", "notifier_email"} {
		collection.Fields.Add(&core.TextField{Name: name})
	}
	original := core.NewRecord(collection)
	original.Set("status", "open")
	original.Set("notifier_email", "reporter@example.com")

	report := original.Clone()
	report.Set("status", "rejected")
	report.Set("decision", "content_kept")
	report.Set("decided_by", "someone-else")
	report.Set("notifier_email", "attacker@example.com")

	keepServerOwnedReportFields(report, original)

	if report.GetString("status") != "rejected" || report.GetString("decision") != "content_kept" {
		t.Errorf("moderator fields lost: %v", report.PublicExport())
	}
	if report.GetString("decided_by") != "" || report.GetString("notifier_email") != "reporter@example.com" {
		t.Errorf("server-owned fields changed: %v", report.PublicExport())
	}
}

func TestOnlyArchiveChanged(t *testing.T) {
	if !onlyArchiveChanged([]string{"archived"}) || !onlyArchiveChanged(nil) {
		t.Fatal("archive-only change rejected")
	}
	if onlyArchiveChanged([]string{"archived", "name"}) {
		t.Fatal("name change accepted")
	}
	if onlyArchiveChanged([]string{"archived_at"}) || onlyArchiveChanged([]string{"archived", "archived_at"}) {
		t.Fatal("archived_at change accepted")
	}
}

func TestMaskedIdentity(t *testing.T) {
	masked := maskedIdentity("Ghost@Example.test")
	if strings.Contains(strings.ToLower(masked), "ghost") || !strings.HasPrefix(masked, "unknown:") {
		t.Fatalf("maskedIdentity leaked or malformed: %q", masked)
	}
	if masked != maskedIdentity(" ghost@example.test ") {
		t.Fatal("maskedIdentity is not stable across case and whitespace")
	}
}

func TestIsReportDecisionTransition(t *testing.T) {
	collection := core.NewBaseCollection("reports")
	collection.Fields.Add(&core.TextField{Name: "status"}, &core.DateField{Name: "notified_at"})

	report := core.NewRecord(collection)
	report.Id = "report123456789"
	report.Set("status", "open")
	report.PostScan()

	report.Set("status", "actioned")
	if !isReportDecisionTransition(report) {
		t.Fatal("open to actioned should notify")
	}

	report.PostScan()
	report.Set("status", "rejected")
	if isReportDecisionTransition(report) {
		t.Fatal("editing a decided report should not notify again")
	}
	if !isReportDecisionMailPending(report) {
		t.Fatal("decision mail should be retried while notified_at is empty")
	}

	report.Set("notified_at", types.NowDateTime())
	if isReportDecisionMailPending(report) {
		t.Fatal("decision mail should not be resent once notified")
	}

	report.Set("status", "open")
	report.Set("notified_at", "")
	if isReportDecisionMailPending(report) {
		t.Fatal("open report should not get a decision mail")
	}
}
