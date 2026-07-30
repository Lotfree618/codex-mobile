### Feature: Thread status events update locally

#### Prerequisites
- App is running with at least one thread visible in the sidebar.

#### Steps
1. Start and complete a turn while monitoring network requests.
2. Rename the thread.
3. Observe `thread/status/changed` and `thread/name/updated` notifications.

#### Expected Results
- Status and name notifications update local sidebar state directly.
- These notifications do not force a complete `thread/list` reload.
- Topology events such as thread creation, archive, delete, unarchive, and close still refresh the list.

#### Rollback/Cleanup
- Restore the original thread name if needed.
