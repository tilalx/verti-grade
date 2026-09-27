package hooks

import (
	"testing"

	"github.com/pocketbase/pocketbase/tools/types"
)

func TestParseGymMap(t *testing.T) {
	cases := map[string]bool{
		`null`: true,
		`{"width":40,"height":30,"shapes":[{"kind":"floor","points":[[0,0],[40,0],[40,30]]}]}`: true,
		`{"width":40,"height":30,"shapes":[{"kind":"floor","points":[[0,0],[41,0],[40,30]]}]}`: false,
		`{"width":40,"height":30,"shapes":[{"kind":"lava","points":[[0,0],[1,0],[1,1]]}]}`:     false,
		`{"width":40,"height":30,"shapes":[{"kind":"mat","points":[[0,0],[1,0]]}]}`:            false,
		`{"width":1,"height":30,"shapes":[]}`:                                                  false,
		`"not a map"`:                                                                          false,
	}
	for raw, valid := range cases {
		_, err := parseGymMap(types.JSONRaw(raw))
		if (err == nil) != valid {
			t.Errorf("parseGymMap(%s) error = %v, want valid %v", raw, err, valid)
		}
	}
}

func TestPathLength(t *testing.T) {
	if got := pathLength([]mapPoint{{0, 0}, {3, 4}, {3, 10}}); got != 11 {
		t.Fatalf("pathLength() = %v, want 11", got)
	}
	if got := pathLength([]mapPoint{{2, 2}, {2, 2}}); got != 0 {
		t.Fatalf("pathLength() = %v, want 0", got)
	}
}

func TestClampUnit(t *testing.T) {
	for value, want := range map[float64]float64{-1: 0, 0.4: 0.4, 3: 1} {
		if got := clampUnit(value); got != want {
			t.Errorf("clampUnit(%v) = %v, want %v", value, got, want)
		}
	}
}
