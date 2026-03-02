# {PROJECT_NAME} - Claude Context

## Quick Stack Reference

- **Backend**: {BACKEND}
- **Frontend**: {FRONTENDS}
- **Database**: PostgreSQL
- **Deployment**: Docker

## Project Structure

```
{PROJECT_NAME}/
├── backend/                    # {BACKEND} API (port 3000)
[if react]
├── frontend/                   # React Web (port 5173)
[endif]
[if dashboard]
├── dashboard/                  # Admin Dashboard (port 5174)
[endif]
[if dashboard-admin]
├── dashboard-admin/            # Admin Dashboard (port 5174)
[endif]
[if dashboard-ops]
├── dashboard-ops/              # Ops Dashboard (port 5175)
[endif]
[if dashboard-organizer]
├── dashboard-organizer/        # Organizer Dashboard (port 5176)
[endif]
[if react-native]
├── mobile/                     # React Native App
[endif]
├── .claude/                    # Framework-specific skills & agents
└── docker-compose.yml          # Service orchestration
```

## Core BASH Tools (MANDATORY)

**Pattern Search - USE 'rg' ONLY:**
```bash
rg -n "pattern" --glob '!node_modules/*'  # Search with line numbers
rg -l "pattern"                            # List matching files
rg -t py "pattern"                         # Search Python files only
```

**File Finding - USE 'fd' ONLY:**
```bash
fd filename                  # Find by name
fd -e py                     # Find Python files
fd -H .env                   # Include hidden files
```

**Bulk Operations - ONE command > many edits:**
```bash
rg -l "old" | xargs sed -i '' 's/old/new/g'
```

**Preview - USE 'bat':**
```bash
bat -n filepath              # With line numbers
bat -r 10:50 file            # Lines 10-50
```

**JSON - USE 'jq':**
```bash
jq '.dependencies | keys[]' package.json
```

## Essential Commands

| Category | Command | Purpose |
|----------|---------|---------|
| **Git** | /commit | Commit main project, create PR to dev |
| | /commit-all | Commit all including submodules |
| | /pull | Pull latest from dev |
| **Dev** | /new-project | Create new project with boilerplate |
| | /fix-ticket | Analyze and fix Notion ticket |
| | /fullstack | Run autonomous dev loops |
| **Design** | /prd-to-design-prompts | Convert PRD to Aura prompts |
| | /prompts-to-aura | Execute prompts on Aura.build |

## Active Agents

| Agent | Location | Trigger Condition |
|-------|----------|-------------------|
| backend-developer | .claude/agents/ | Backend code changes |
| frontend-developer | .claude/agents/ | Frontend code changes |
[if react-native]
| mobile-developer | .claude/agents/ | Mobile code changes |
[endif]
| database-designer | .claude/agents/ | Schema design needed |
| design-qa-agent | .claude/react/agents/ | UI component work |

## Documentation Reference

| Document | Path | Purpose |
|----------|------|---------|
| Knowledge | .claude-project/docs/PROJECT_KNOWLEDGE.md | Full architecture & tech stack |
| API | .claude-project/docs/PROJECT_API.md | Endpoint specifications |
| Database | .claude-project/docs/PROJECT_DATABASE.md | Schema & ERD |
| Integration | .claude-project/docs/PROJECT_API_INTEGRATION.md | Frontend-API mapping |
| Design System | .claude-project/docs/PROJECT_DESIGN_GUIDELINES.md | Component styling |
| PRD | .claude-project/prd/prd.pdf | Original requirements |
| HTML Screens | .claude-project/resources/HTML/ | Prototype screens |

## Framework Resources

| Framework | Path | Description |
|-----------|------|-------------|
| {BACKEND} | .claude/{BACKEND}/guides/ | 20+ development guides |
| React | .claude/react/guides/ | 22 React guides |
| React Native | .claude/react-native/guides/ | 20 mobile guides |

## Plan Mode Reference

When planning implementation, ALWAYS consult these resources:

[if react]
### Frontend Planning (React)
1. `.claude/react/guides/file-organization.md` — Directory structure, naming, imports
2. `.claude/react/guides/best-practices.md` — Coding standards
3. `.claude/react/guides/crud-operations.md` — Service/slice/mutation patterns
4. `.claude/agents/frontend-developer.md` — Full agent spec with quality checklist
[endif]

[if react-native]
### Mobile Planning (React Native)
1. `.claude/react-native/guides/file-organization.md` — Directory structure, naming
2. `.claude/react-native/guides/best-practices.md` — Coding standards
3. `.claude/agents/mobile-developer.md` — Full agent spec
[endif]

### Backend Planning ({BACKEND})
1. `.claude/{BACKEND}/guides/best-practices.md` — Critical rules, architecture
2. `.claude/{BACKEND}/guides/database-patterns.md` — ORM patterns
3. `.claude/{BACKEND}/guides/routing-and-controllers.md` — Controller patterns
4. `.claude/agents/backend-developer.md` — Full agent spec

### Always Reference
- `.claude-project/docs/PROJECT_API.md` — API endpoints
- `.claude-project/docs/PROJECT_API_INTEGRATION.md` — Frontend-API mapping
- `.claude-project/docs/PROJECT_DESIGN_GUIDELINES.md` — Design system
- `.claude-project/docs/PROJECT_DATABASE.md` — Database schema & ERD
- `.claude-project/docs/PROJECT_KNOWLEDGE.md` — Architecture & tech stack
- `.claude-project/prd/prd.pdf` — Source of truth

---

**Last Updated:** {DATE}
