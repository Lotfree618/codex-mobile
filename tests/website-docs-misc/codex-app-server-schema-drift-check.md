### Feature: Codex app-server schema drift check

#### Prerequisites
- Node.js and pnpm are available.
- Network access to the npm registry is available.

#### Steps
1. Run `pnpm run schema:check` from the repository root.
2. Confirm the command resolves the current `@openai/codex@latest` version.
3. Run `pnpm run schema:sync`, then run `pnpm run schema:check` again.

#### Expected Results
- The check fails when committed TypeScript or JSON schemas differ from the current Codex release.
- The sync command replaces obsolete generated files and records the resolved Codex version in `documentation/app-server-schemas/manifest.json`.
- The second check succeeds without modifying tracked files.

#### Rollback/Cleanup
- Restore the generated schema directory from Git if this test was only exploratory.
