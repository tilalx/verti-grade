package hooks

import (
	"slices"
	"testing"
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
