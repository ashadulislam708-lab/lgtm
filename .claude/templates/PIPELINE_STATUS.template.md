# Fullstack Pipeline Status - {PROJECT_NAME}

## Progress

| Phase | Skill | Tier | Status | Prerequisites | Output | Notes |
|-------|-------|------|--------|---------------|--------|-------|
| init | project-init.md | base | :clipboard: | - | - | - |
| prd | convert-prd-to-knowledge.md | $BACKEND | :clipboard: | init | - | - |
| frontend | (user choice) | $FRONTEND | :clipboard: | prd | - | - |
| database | database-schema-designer.md | $BACKEND | :clipboard: | frontend | - | - |
| backend | (composite) | $BACKEND | :clipboard: | database | - | - |
| dashboard | dashboard-builder.md | $FRONTEND | :clipboard: | backend, frontend | - | - |
| integrate | api-integration.md | $FRONTEND | :clipboard: | dashboard | - | - |
| test | e2e-test-generator.md | $STACK | :clipboard: | integrate | - | - |
| qa | design-qa-patterns.md | $FRONTEND | :clipboard: | test | - | - |
| ship | deployment.md | base | :clipboard: | qa | - | - |

## Skill Paths by Tier

| Tier | Base Path | Description |
|------|-----------|-------------|
| base | `.claude/base/skills/fullstack/` | Generic orchestration (init, ship) |
| $BACKEND | `.claude/$BACKEND/skills/` | Backend skills (prd, database, backend) |
| $FRONTEND | `.claude/$FRONTEND/skills/` + `guides/` | Frontend skills (frontend, dashboard, integrate, qa) |
| $STACK | `.claude/{context}/skills/` | Context-dependent (backend or frontend) |

## Execution Log

| Date | Phase | Duration | Result | Notes |
|------|-------|----------|--------|-------|

## Configuration

```yaml
project: {PROJECT_NAME}
created: {DATE}
last_run: null
tech_stack:
  backend: null          # nestjs | django
  frontends: []          # [react] | [react-native] | [react, react-native]
  dashboards: []         # [admin] | [coach] | [admin, coach]
```

## Tech Stack Resolution

The `$BACKEND`, `$FRONTEND`, and `$STACK` variables are resolved from the `tech_stack` configuration above:

- `$BACKEND` = tech_stack.backend (e.g., "nestjs", "django")
- `$FRONTEND` = tech_stack.frontends[0] (primary frontend, e.g., "react")
- `$STACK` = Resolved based on phase context (backend phases use $BACKEND, frontend phases use $FRONTEND)

**Supported Tech Stacks:**

| Category | Options | Submodule URL |
|----------|---------|---------------|
| Backend | nestjs, django | github.com/potentialInc/claude-{backend} |
| Frontend | react, react-native | github.com/potentialInc/claude-{frontend} |
