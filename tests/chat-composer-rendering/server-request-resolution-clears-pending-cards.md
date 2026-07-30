### Feature: Server request resolution clears pending cards

#### Prerequisites
- App is running with a Codex CLI that emits `serverRequest/resolved`.
- A thread can trigger an approval or user-input request.

#### Steps
1. Trigger a pending approval or user-input request and confirm its card appears.
2. Complete or interrupt the active turn so app-server resolves the request without using the card action.
3. Reconnect the browser notification stream.

#### Expected Results
- The pending card disappears when `serverRequest/resolved` arrives.
- The bridge pending-request endpoint no longer returns the resolved request.
- Reconnect does not restore the stale card.

#### Rollback/Cleanup
- None.
