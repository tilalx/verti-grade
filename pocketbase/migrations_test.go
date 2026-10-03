package main

import (
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/tests"
)

func TestAverageRatingView(t *testing.T) {
	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()

	jsvm.MustRegister(app, jsvm.Config{MigrationsDir: "pb_migrations"})
	if err := app.RunAllMigrations(); err != nil {
		t.Fatal(err)
	}

	routes, err := app.FindCollectionByNameOrId("routes")
	if err != nil {
		t.Fatal(err)
	}
	ratings, err := app.FindCollectionByNameOrId("ratings")
	if err != nil {
		t.Fatal(err)
	}

	saveRoute := func(location string, archived bool) *core.Record {
		route := core.NewRecord(routes)
		route.Set("name", "route")
		route.Set("location", location)
		route.Set("archived", archived)
		if err := app.SaveNoValidate(route); err != nil {
			t.Fatal(err)
		}
		return route
	}
	rated := saveRoute("gym", false)
	unrated := saveRoute("gym", false)
	saveRoute("gym", true)
	saveRoute("crag", false)

	for _, stars := range []int{2, 4, 0} {
		rating := core.NewRecord(ratings)
		rating.Set("route_id", rated.Id)
		rating.Set("rating", stars)
		if err := app.SaveNoValidate(rating); err != nil {
			t.Fatal(err)
		}
	}

	view, err := app.FindCollectionByNameOrId("vcfw600rzblhed3")
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"average_rating", "ratings_count"} {
		if field := view.Fields.GetByName(name); field == nil || field.Type() != core.FieldTypeNumber {
			t.Fatalf("%s is not a number field", name)
		}
	}

	records, err := app.FindRecordsByFilter(view, "archived = false && location = 'gym'", "", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(records) != 2 {
		t.Fatalf("got %d records, want 2", len(records))
	}

	byId := map[string]*core.Record{}
	for _, record := range records {
		byId[record.Id] = record
	}
	if got := byId[rated.Id].GetFloat("average_rating"); got != 3 {
		t.Errorf("average_rating = %v, want 3", got)
	}
	if got := byId[rated.Id].GetInt("ratings_count"); got != 2 {
		t.Errorf("ratings_count = %v, want 2", got)
	}
	if got := byId[unrated.Id].GetInt("ratings_count"); got != 0 {
		t.Errorf("unrated ratings_count = %v, want 0", got)
	}
}

func TestCompetitionCollections(t *testing.T) {
	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()

	jsvm.MustRegister(app, jsvm.Config{MigrationsDir: "pb_migrations"})
	if err := app.RunAllMigrations(); err != nil {
		t.Fatal(err)
	}

	for _, name := range []string{"competitions", "competition_categories", "competition_routes", "competition_entries", "competition_scores"} {
		if _, err := app.FindCollectionByNameOrId(name); err != nil {
			t.Errorf("collection %s missing: %v", name, err)
		}
	}
	for _, permission := range []string{"manage_competitions", "judge_competitions"} {
		if _, err := app.FindFirstRecordByData("permissions", "name", permission); err != nil {
			t.Errorf("%s permission missing: %v", permission, err)
		}
	}
	scores, err := app.FindCollectionByNameOrId("competition_scores")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := app.FindCollectionByNameOrId("competition_standings"); err != nil {
		t.Errorf("competition_standings view missing: %v", err)
	}
	for _, field := range []string{"comp_route", "style", "height", "height_plus"} {
		if scores.Fields.GetByName(field) == nil {
			t.Errorf("competition_scores.%s missing", field)
		}
	}
	competitions, err := app.FindCollectionByNameOrId("competitions")
	if err != nil {
		t.Fatal(err)
	}
	if competitions.Fields.GetByName("requires_payment") == nil {
		t.Error("competitions.requires_payment missing")
	}
}
