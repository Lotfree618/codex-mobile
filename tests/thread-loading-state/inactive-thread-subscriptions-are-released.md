### Feature: Inactive thread subscriptions are released

#### Prerequisites
- App is running with a recent Codex CLI/app-server build.
- At least two idle threads exist.

#### Steps
1. Open the first thread and wait for its messages to finish loading.
2. Open the second thread.
3. Confirm `thread/unsubscribe` returns `unsubscribed`, `notSubscribed`, or `notLoaded`.
4. If the result is `notLoaded`, query `thread/loaded/list` and confirm the first thread is absent.
5. Repeat while the first thread has an active turn or pending request.

#### Expected Results
- Switching away from an idle thread calls `thread/unsubscribe` for the previous thread.
- `unsubscribed` and `notSubscribed` are accepted even if the thread remains in `thread/loaded/list` during app-server's no-subscriber grace period.
- A `notLoaded` result is checked against `thread/loaded/list`; contradictory state is reported as a protocol failure.
- Threads with an active turn or pending request remain subscribed until they are safe to release.

#### Rollback/Cleanup
- None.
