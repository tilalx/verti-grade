package hooks

import (
	"slices"
	"testing"
	"time"

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
