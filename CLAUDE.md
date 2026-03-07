# LGTM - Claude Context

## Quick Stack Reference

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL (TypeORM)
- **Queue**: BullMQ (Redis)
- **Observability**: OpenTelemetry -> LGTM Stack
- **Deployment**: Docker

## Project Structure

```
LGTM/
├── backend/                    # NestJS API (port 3000)
├── .claude/                    # Framework-specific skills & agents
└── docker-compose.yml          # Service orchestration
```

## Core BASH Tools (MANDATORY)

**Pattern Search - USE 'rg' ONLY:**
```bash
rg -n "pattern" --glob '!node_modules/*'  # Search with line numbers
rg -l "pattern"                            # List matching files
rg -t ts "pattern"                         # Search TypeScript files only
```

**File Finding - USE 'fd' ONLY:**
```bash
fd filename                  # Find by name
fd -e ts                     # Find TypeScript files
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

## Active Agents

| Agent | Location | Trigger Condition |
|-------|----------|-------------------|
| backend-developer | .claude/agents/ | Backend code changes |
| database-designer | .claude/agents/ | Schema design needed |

## Documentation Reference

| Document | Path | Purpose |
|----------|------|---------|
| Knowledge | .claude-project/docs/PROJECT_KNOWLEDGE.md | Full architecture & tech stack |
| API | .claude-project/docs/PROJECT_API.md | Endpoint specifications |
| Database | .claude-project/docs/PROJECT_DATABASE.md | Schema & ERD |
| PRD | .claude-project/prd/OrderFlow_PRD_260302.md | Original requirements |

## Framework Resources

| Framework | Path | Description |
|-----------|------|-------------|
| NestJS | .claude/nestjs/guides/ | 20+ development guides |

## Plan Mode Reference

When planning implementation, ALWAYS consult these resources:

### Backend Planning (NestJS)
1. `.claude/nestjs/guides/best-practices.md` - Critical rules, architecture
2. `.claude/nestjs/guides/database-patterns.md` - ORM patterns
3. `.claude/nestjs/guides/routing-and-controllers.md` - Controller patterns
4. `.claude/agents/backend-developer.md` - Full agent spec

### Always Reference
- `.claude-project/docs/PROJECT_API.md` - API endpoints
- `.claude-project/docs/PROJECT_DATABASE.md` - Database schema & ERD
- `.claude-project/docs/PROJECT_KNOWLEDGE.md` - Architecture & tech stack
- `.claude-project/prd/OrderFlow_PRD_260302.md` - Source of truth

---

**Last Updated:** 2026-03-07
