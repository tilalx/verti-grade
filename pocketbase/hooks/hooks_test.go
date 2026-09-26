package hooks

import (
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func TestChangedFieldNames(t *testing.T) {
	before := map[string]any{"name": "a", "tags": []string{"x"}, "updated": "1", "tokenKey": "k", "same": 1}
	after := map[string]any{"name": "b", "tags": []string{"x", "y"}, "updated": "2", "tokenKey": "z", "same": 1, "added": true}

	got := changedFieldNames(before, after)
	want := []string{"added", "name", "tags"}
	if !slices.Equal(got, want) {
		t.Fatalf("changedFieldNames() = %v, want %v", got, want)
	}
}

func TestReportReasonLabel(t *testing.T) {
	cases := map[string]string{"spam_fraud": "Spam or fraud", "unknown": "unknown", "": "Other"}
	for reason, want := range cases {
		if got := reportReasonLabel(reason); got != want {
			t.Errorf("reportReasonLabel(%q) = %q, want %q", reason, got, want)
		}
	}
}

func TestReportReceiptOmitsNotifierText(t *testing.T) {
	collection := core.NewBaseCollection("reports")
	report := core.NewRecord(collection)
	report.Id = "ref123"
	report.Set("reason", "spam_fraud")
	report.Set("notifier_name", "Buy cheap pills")
	report.Set("explanation", "visit spam.example")
	report.Set("content_snapshot", "more spam")

	body := reportReceiptHTML(report)
	for _, injected := range []string{"Buy cheap pills", "spam.example", "more spam"} {
		if strings.Contains(body, injected) {
			t.Errorf("receipt contains notifier-controlled text %q", injected)
		}
	}
	if !strings.Contains(body, "ref123") || !strings.Contains(body, "Spam or fraud") {
		t.Errorf("receipt lacks reference or reason: %s", body)
	}
}

func TestTruncateRunes(t *testing.T) {
	if got := truncateRunes("äöü", 2); got != "äö" {
		t.Fatalf("truncateRunes() = %q, want %q", got, "äö")
	}
	if got := truncateRunes("ab", 5); got != "ab" {
		t.Fatalf("truncateRunes() = %q, want %q", got, "ab")
	}
}

func TestClaimString(t *testing.T) {
	claims := map[string]any{"scope": "login", "jti": 42}
	if claimString(claims, "scope") != "login" || claimString(claims, "jti") != "" || claimString(claims, "missing") != "" {
		t.Fatalf("claimString() returned unexpected values")
	}
}

func TestArchivedAt(t *testing.T) {
	now := types.NowDateTime()
	earlier := now.Add(-time.Hour)
	cases := []struct {
		name                    string
		wasArchived, isArchived bool
		current, want           types.DateTime
	}{
		{"archiving stamps now", false, true, types.DateTime{}, now},
		{"stays archived keeps stamp", true, true, earlier, earlier},
		{"archived without stamp gets now", true, true, types.DateTime{}, now},
		{"restoring clears stamp", true, false, earlier, types.DateTime{}},
		{"active stays empty", false, false, types.DateTime{}, types.DateTime{}},
	}
	for _, c := range cases {
		if got := archivedAt(c.wasArchived, c.isArchived, c.current, now); !got.Equal(c.want) {
			t.Errorf("%s: archivedAt() = %v, want %v", c.name, got, c.want)
		}
	}
}

func TestDropSubRequestHeaders(t *testing.T) {
	batch := []*core.InternalRequest{
		{Method: "POST", URL: "/api/collections/reports/records", Headers: map[string]string{"X-Real-IP": "127.0.0.1"}},
		{Method: "POST", URL: "/api/collections/ratings/records", Headers: map[string]string{"x-forwarded-for": "10.0.0.1"}},
	}
	dropSubRequestHeaders(batch)
	for _, request := range batch {
		if len(request.Headers) != 0 {
			t.Fatalf("headers kept on %s: %v", request.URL, request.Headers)
		}
	}
}

func TestNormalizeFlashAttempts(t *testing.T) {
	tick := core.NewRecord(core.NewBaseCollection("ticks"))
	tick.Set("type", "flash")
	tick.Set("attempts", 4)
	normalizeFlashAttempts(tick)
	if tick.GetInt("attempts") != 1 {
		t.Fatalf("flash attempts = %d, want 1", tick.GetInt("attempts"))
	}

	tick.Set("type", "top")
	tick.Set("attempts", 4)
	normalizeFlashAttempts(tick)
	if tick.GetInt("attempts") != 4 {
		t.Fatalf("top attempts = %d, want 4", tick.GetInt("attempts"))
	}
}

func TestTickDateInFuture(t *testing.T) {
	now := time.Date(2026, 9, 26, 23, 30, 0, 0, time.UTC)
	cases := map[time.Time]bool{
		time.Date(2026, 9, 26, 12, 0, 0, 0, time.UTC): false,
		time.Date(2026, 9, 27, 12, 0, 0, 0, time.UTC): false,
		time.Date(2026, 9, 29, 12, 0, 0, 0, time.UTC): true,
	}
	for date, want := range cases {
		if got := tickDateInFuture(date, now); got != want {
			t.Fatalf("tickDateInFuture(%s) = %v, want %v", date, got, want)
		}
	}
}
