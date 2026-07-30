### Feature: Inactive thread subscriptions are released

#### Prerequisites
- App is running with a recent Codex CLI/app-server build.
- At least two idle threads exist.

#### Steps
1. Open the first thread and wait for its messages to finish loading.
2. Open the second thread.
3. Query `thread/loaded/list` through the API methods panel.
4. Repeat while the first thread has an active turn or pending request.

#### Expected Results
- Switching away from an idle thread calls `thread/unsubscribe` for the previous thread.
- The client immediately verifies `thread/loaded/list`; a still-loaded thread is treated as an unsubscribe failure.
- Threads with an active turn or pending request remain subscribed until they are safe to release.

#### Rollback/Cleanup
- None.
