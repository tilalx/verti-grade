package hooks

import (
	"encoding/json"
	"slices"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

const (
	openDefectsTopic = "open_route_defects"
	ownTicksTopic    = "own_ticks"
)

type openDefect struct {
	ID       string `json:"id"`
	Route    string `json:"route"`
	Category string `json:"category"`
	Created  string `json:"created"`
}

type openDefectsChange struct {
	Routes  []string     `json:"routes"`
	Defects []openDefect `json:"defects"`
}

type tickChange struct {
	Action string         `json:"action"`
	Record map[string]any `json:"record"`
}

func registerLive(app core.App) {
	onDefectChange := func(e *core.RecordEvent) error {
		if routes := defectRoutes(e.Record); len(routes) > 0 {
			broadcastOpenDefects(e.App, routes)
		}
		return e.Next()
	}
	app.OnRecordAfterCreateSuccess("tasks").BindFunc(onDefectChange)
	app.OnRecordAfterUpdateSuccess("tasks").BindFunc(onDefectChange)
	app.OnRecordAfterDeleteSuccess("tasks").BindFunc(onDefectChange)

	onTickChange := func(action string) func(e *core.RecordEvent) error {
		return func(e *core.RecordEvent) error {
			userID := e.Record.GetString("user")
			broadcast(e.App, ownTicksTopic, tickChange{Action: action, Record: e.Record.PublicExport()}, func(auth *core.Record) bool {
				return auth != nil && auth.Id == userID
			})
			return e.Next()
		}
	}
	app.OnRecordAfterCreateSuccess("ticks").BindFunc(onTickChange("create"))
	app.OnRecordAfterUpdateSuccess("ticks").BindFunc(onTickChange("update"))
	app.OnRecordAfterDeleteSuccess("ticks").BindFunc(onTickChange("delete"))
}

func defectRoutes(task *core.Record) []string {
	if task.GetString("kind") != "defect" {
		return nil
	}
	routes := []string{}
	for _, route := range []string{task.GetString("route"), task.Original().GetString("route")} {
		if route != "" && !slices.Contains(routes, route) {
			routes = append(routes, route)
		}
	}
	return routes
}

func broadcastOpenDefects(app core.App, routes []string) {
	defects := []openDefect{}
	for _, route := range routes {
		records, err := app.FindRecordsByFilter(openDefectsTopic, "route = {:route}", "", 0, 0, dbx.Params{"route": route})
		if err != nil {
			app.Logger().Error("live: failed to load open defects", "route", route, "error", err)
			return
		}
		for _, record := range records {
			defects = append(defects, openDefect{
				ID:       record.Id,
				Route:    record.GetString("route"),
				Category: record.GetString("category"),
				Created:  record.GetString("created"),
			})
		}
	}
	broadcast(app, openDefectsTopic, openDefectsChange{Routes: routes, Defects: defects}, nil)
}

func broadcast(app core.App, topic string, data any, accept func(auth *core.Record) bool) {
	payload, err := json.Marshal(data)
	if err != nil {
		app.Logger().Error("live: failed to encode message", "topic", topic, "error", err)
		return
	}
	message := subscriptions.Message{Name: topic, Data: payload}
	go sendToSubscribers(app.SubscriptionsBroker().Clients(), topic, message, accept)
}

func sendToSubscribers(clients map[string]subscriptions.Client, topic string, message subscriptions.Message, accept func(auth *core.Record) bool) {
	for _, client := range clients {
		if !client.HasSubscription(topic) {
			continue
		}
		if accept != nil {
			auth, _ := client.Get(apis.RealtimeClientAuthKey).(*core.Record)
			if !accept(auth) {
				continue
			}
		}
		client.Send(message)
	}
}
