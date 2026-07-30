### Feature: Steer appends to the active turn

#### Prerequisites
- App is running with a recent Codex CLI/app-server build.
- In-progress send mode is set to Steer.

#### Steps
1. Start a turn that runs long enough to accept another instruction.
2. While it is active, send a second instruction in Steer mode.
3. Repeat with Queue mode.

#### Expected Results
- Steer sends `turn/steer` with the current `expectedTurnId`; it does not start a second turn.
- A missing active turn id is shown as an error instead of silently falling back to `turn/start`.
- Queue keeps the existing behavior and starts its message only after the active turn completes.

#### Rollback/Cleanup
- Clear any queued test message.
