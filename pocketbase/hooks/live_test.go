package hooks

import (
	"slices"
	"testing"
	"time"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

func TestDefectRoutes(t *testing.T) {
	task := newTaskRecord()
	task.Set("kind", "reset")
	task.Set("route", "r1")
	if routes := defectRoutes(task); routes != nil {
		t.Errorf("non-defect task broadcast routes %v", routes)
	}

	task.Set("kind", "defect")
	task.Id = "t1"
	if err := task.PostScan(); err != nil {
		t.Fatal(err)
	}
	task.Set("route", "r2")
	if routes := defectRoutes(task); !slices.Equal(routes, []string{"r2", "r1"}) {
		t.Errorf("moved defect routes = %v, want [r2 r1]", routes)
	}

	unrouted := newTaskRecord()
	unrouted.Set("kind", "defect")
	if routes := defectRoutes(unrouted); len(routes) != 0 {
		t.Errorf("defect without route broadcast routes %v", routes)
	}
}

func subscribedClient(topic string, auth *core.Record) *subscriptions.DefaultClient {
	client := subscriptions.NewDefaultClient()
	client.Subscribe(topic)
	if auth != nil {
		client.Set(apis.RealtimeClientAuthKey, auth)
	}
	return client
}

func received(client *subscriptions.DefaultClient) bool {
	select {
	case <-client.Channel():
		return true
	case <-time.After(50 * time.Millisecond):
		return false
	}
}

func TestSendToSubscribersOnlyReachesAcceptedSubscribers(t *testing.T) {
	users := core.NewAuthCollection("users")
	owner := core.NewRecord(users)
	owner.Id = "owner"
	stranger := core.NewRecord(users)
	stranger.Id = "stranger"

	ownerClient := subscribedClient(ownTicksTopic, owner)
	strangerClient := subscribedClient(ownTicksTopic, stranger)
	guestClient := subscribedClient(ownTicksTopic, nil)
	unsubscribedClient := subscribedClient("routes", owner)

	clients := map[string]subscriptions.Client{
		"a": ownerClient, "b": strangerClient, "c": guestClient, "d": unsubscribedClient,
	}
	go sendToSubscribers(clients, ownTicksTopic, subscriptions.Message{Name: ownTicksTopic}, func(auth *core.Record) bool {
		return auth != nil && auth.Id == "owner"
	})

	if !received(ownerClient) {
		t.Error("owner did not receive own tick")
	}
	for name, client := range map[string]*subscriptions.DefaultClient{"stranger": strangerClient, "guest": guestClient, "unsubscribed": unsubscribedClient} {
		if received(client) {
			t.Errorf("%s received another user's tick", name)
		}
	}
}
