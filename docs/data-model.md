# Data model

PostgreSQL is the source of truth. Core relationships are stored as tables. Type-specific node fields use JSONB.

## Time model

Every system model uses **days from a model origin**. Durations, lead times, and order due dates are numeric day offsets, not calendar dates. The application does not mix time zones.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Account identity and password hashes |
| `workspaces` | Owned collections of models |
| `system_models` | Named graphs with a time unit |
| `model_nodes` | Typed nodes and canvas positions |
| `model_dependencies` | Directed edges with quantity and timing |
| `audit_events` | Create, update, delete, and graph-save records |

A node `config` JSON object is validated against the node type. It is not a substitute for the `type`, `name`, or relationship columns.

Later simulation runs will snapshot the graph they used. Editing a live model must not silently rewrite a completed simulation.

## Ownership

A workspace belongs to one user. Models belong to a workspace. API methods load the workspace owner and treat another user's records as not found.
