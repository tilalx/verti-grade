package hooks

import (
	"encoding/json"
	"math"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

const (
	minMapSize        = 5.0
	maxMapSize        = 500.0
	maxMapShapes      = 300
	maxShapePoints    = 200
	mapShapeMinPoints = 3
	wallEdgeMinPoints = 2
)

var mapShapeKinds = map[string]bool{"floor": true, "mat": true, "structure": true}

type mapPoint [2]float64

type mapShape struct {
	Kind   string     `json:"kind"`
	Points []mapPoint `json:"points"`
}

type gymMap struct {
	Width  float64    `json:"width"`
	Height float64    `json:"height"`
	Shapes []mapShape `json:"shapes"`
}

func registerMapGuards(app core.App) {
	app.OnRecordCreate("locations").BindFunc(validateLocationMap)
	app.OnRecordUpdate("locations").BindFunc(validateLocationMap)
	app.OnRecordCreate("walls").BindFunc(validateWall)
	app.OnRecordUpdate("walls").BindFunc(validateWall)
	app.OnRecordCreate("routes").BindFunc(validateRouteWall)
	app.OnRecordUpdate("routes").BindFunc(validateRouteWall)

	app.OnRecordDeleteRequest("walls").BindFunc(func(e *core.RecordRequestEvent) error {
		activeRoutes, err := e.App.CountRecords("routes", dbx.HashExp{"wall": e.Record.Id, "archived": false})
		if err != nil {
			return err
		}
		if activeRoutes > 0 {
			return apis.NewBadRequestError("Wall still has routes.", map[string]any{"routeCount": activeRoutes})
		}
		return e.Next()
	})
}

func validateLocationMap(e *core.RecordEvent) error {
	if _, err := parseGymMap(e.Record.Get("map")); err != nil {
		return err
	}
	return e.Next()
}

func validateWall(e *core.RecordEvent) error {
	location, err := e.App.FindRecordById("locations", e.Record.GetString("location"))
	if err != nil {
		return apis.NewBadRequestError("Unknown location.", nil)
	}
	floorPlan, err := parseGymMap(location.Get("map"))
	if err != nil {
		return err
	}
	if floorPlan == nil {
		return apis.NewBadRequestError("Draw the floor plan before adding walls.", nil)
	}

	var outline, edge []mapPoint
	if !decodeJSON(e.Record.Get("outline"), &outline) || !validPath(outline, mapShapeMinPoints, floorPlan) {
		return apis.NewBadRequestError("Invalid wall outline.", nil)
	}
	if !decodeJSON(e.Record.Get("edge"), &edge) || !validPath(edge, wallEdgeMinPoints, floorPlan) || pathLength(edge) == 0 {
		return apis.NewBadRequestError("Invalid wall edge.", nil)
	}
	if label := e.Record.Get("label"); !isEmptyJSON(label) {
		var point mapPoint
		if !decodeJSON(label, &point) || !pointInMap(point, floorPlan) {
			return apis.NewBadRequestError("Invalid wall label.", nil)
		}
	}
	return e.Next()
}

func validateRouteWall(e *core.RecordEvent) error {
	wallID := e.Record.GetString("wall")
	if wallID == "" {
		e.Record.Set("wall_position", nil)
		return e.Next()
	}
	wall, err := e.App.FindRecordById("walls", wallID)
	if err != nil {
		return apis.NewBadRequestError("Unknown wall.", nil)
	}
	if wall.GetString("location") != e.Record.GetString("location") {
		if locationMoved(e.Record) {
			e.Record.Set("wall", "")
			e.Record.Set("wall_position", nil)
			return e.Next()
		}
		return apis.NewBadRequestError("The wall belongs to another location.", nil)
	}
	e.Record.Set("wall_position", clampUnit(e.Record.GetFloat("wall_position")))
	return e.Next()
}

func locationMoved(route *core.Record) bool {
	original := route.Original()
	return !route.IsNew() &&
		original.GetString("location") != route.GetString("location") &&
		original.GetString("wall") == route.GetString("wall")
}

func parseGymMap(raw any) (*gymMap, error) {
	if isEmptyJSON(raw) {
		return nil, nil
	}
	var floorPlan gymMap
	if !decodeJSON(raw, &floorPlan) || !validGymMap(&floorPlan) {
		return nil, apis.NewBadRequestError("Invalid floor plan.", nil)
	}
	return &floorPlan, nil
}

func validGymMap(floorPlan *gymMap) bool {
	if !inRange(floorPlan.Width, minMapSize, maxMapSize) || !inRange(floorPlan.Height, minMapSize, maxMapSize) {
		return false
	}
	if len(floorPlan.Shapes) > maxMapShapes {
		return false
	}
	for _, shape := range floorPlan.Shapes {
		if !mapShapeKinds[shape.Kind] || !validPath(shape.Points, mapShapeMinPoints, floorPlan) {
			return false
		}
	}
	return true
}

func validPath(points []mapPoint, minPoints int, floorPlan *gymMap) bool {
	if len(points) < minPoints || len(points) > maxShapePoints {
		return false
	}
	for _, point := range points {
		if !pointInMap(point, floorPlan) {
			return false
		}
	}
	return true
}

func pointInMap(point mapPoint, floorPlan *gymMap) bool {
	return inRange(point[0], 0, floorPlan.Width) && inRange(point[1], 0, floorPlan.Height)
}

func pathLength(points []mapPoint) float64 {
	length := 0.0
	for index := 1; index < len(points); index++ {
		length += math.Hypot(points[index][0]-points[index-1][0], points[index][1]-points[index-1][1])
	}
	return length
}

func inRange(value, min, max float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0) && value >= min && value <= max
}

func clampUnit(value float64) float64 {
	if math.IsNaN(value) {
		return 0
	}
	return math.Min(1, math.Max(0, value))
}

func isEmptyJSON(raw any) bool {
	encoded, err := json.Marshal(raw)
	if err != nil {
		return true
	}
	switch string(encoded) {
	case "null", `""`, "{}", "[]":
		return true
	}
	return false
}

func decodeJSON(raw any, target any) bool {
	encoded, err := json.Marshal(raw)
	if err != nil {
		return false
	}
	return json.Unmarshal(encoded, target) == nil
}
