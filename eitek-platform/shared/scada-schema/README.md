# SCADA Shared Schema

Canonical schema definitions for SCADA widgets, bindings, events, and actions.

Both the **Web Frontend** (TypeScript/React) and **Mobile** (Dart/Flutter) renderers
must conform to these schemas. The JSON format is the single source of truth.

## Architecture

```
Web Editor (design) → JSON Schema → Web Preview (runtime)
                                   → Mobile Runtime (runtime)
```

Both renderers read the same JSON. Both resolve bindings, dispatch events,
and execute actions using the same semantic model.

## Contents

- `widget.schema.json` — Widget instance schema
- `binding.schema.json` — Binding definition schema
- `event.schema.json` — Event definition schema
- `action.schema.json` — Action definition schema
- `project.schema.json` — Full project schema
- `examples/` — Example JSON configurations
