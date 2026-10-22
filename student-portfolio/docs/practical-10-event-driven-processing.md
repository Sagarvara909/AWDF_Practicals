# Practical 10: Asynchronous Processing with Event-Driven Architecture

## Objective

Demonstrate how a task-creation event can trigger independent processing
without making the HTTP response wait for activity logging and notification.

## Event flow

1. An authenticated client sends `POST /tasks`.
2. The server saves the task and emits `task:created`.
3. The API returns `201 Created` without waiting for the event listener.
4. The listener records the activity and sends the notification asynchronously.
5. `GET /debug/events` reports event processing counters.

The event bus is process-local and in-memory. Events are not durable: a server
crash can lose work that is still pending. A production system that must
guarantee delivery should use a persistent message broker or job queue.

## Postman demonstration

Use the same JWT obtained from `POST /login`. Set **Authorization → Bearer
Token** separately on each request. Do not include the token in screenshots.

### 1. Create a task

- Method: `POST`
- URL: `http://localhost:5000/tasks`
- Body → raw → JSON:

```json
{
  "title": "Event-driven practical test"
}
```

Capture a screenshot showing `201 Created` and the returned task.

### 2. Verify that the event was emitted and processed

- Method: `GET`
- URL: `http://localhost:5000/debug/events`

Capture a screenshot showing `event: "task:created"` and the `emitted`,
`processed`, `pending`, and `failed` counters. `processed` may update just
after the POST response because the listener runs asynchronously; send GET
again if it is still pending.

### 3. Capture the server-side event

Keep the backend terminal visible while creating a task. Capture the
`[event] task:created received` log and the subsequent activity/notification
log. Hide personal email addresses in any screenshot shared outside the lab.

## Analysis

- **Why use events?** The task route emits an event instead of directly waiting
  for unrelated activity logging and notification work. Listeners can be
  changed or extended independently of the route.
- **What does asynchronous processing improve?** It lets the client receive
  the task response without waiting for the event listener's work to finish.
- **What is the trade-off?** The listener runs in the same Node.js process.
  Failures are logged and counted, but pending events are not persisted across
  a server restart. A durable queue is appropriate when guaranteed delivery
  or multi-instance processing is required.
