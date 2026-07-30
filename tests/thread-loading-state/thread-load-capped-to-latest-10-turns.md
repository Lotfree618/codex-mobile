### Feature: Thread load capped to latest 10 turns

#### Prerequisites
- App is running from this repository.
- At least one thread exists with more than 10 turns/messages.

#### Steps
1. Open a long thread that previously caused UI lag during initial load.
2. While the thread is loading, immediately click another thread in the sidebar.
3. Return to the long thread.
4. Count visible loaded history blocks and confirm only the newest portion is shown.
5. Inspect the initial `thread/resume` request and confirm it sets `excludeTurns: true` with an `initialTurnsPage` limit of 10.
6. Click Load earlier messages and confirm subsequent requests use `thread/turns/list` with an opaque cursor.

#### Expected Results
- Initial thread load renders only the most recent 10 turns.
- UI remains responsive during thread load.
- You can switch to another thread without the UI freezing.
- Initial resume returns at most 10 turns through `initialTurnsPage`; older turns are fetched only through official cursor pagination.

#### Rollback/Cleanup
- No cleanup required.
