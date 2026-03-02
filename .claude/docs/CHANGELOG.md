# Claude Workflow Changelog

All notable changes to the `.claude` configuration (`claude-workflow` repo).

---

## [1.1.0] — 2026-02-19

### Magic Keywords (NEW)

Type a keyword followed by a colon to instantly activate commands or skills — no slash needed.

| Keyword | Activates | Description |
|---------|-----------|-------------|
| `team:` | `/dev:team` | Launch multi-agent orchestration |
| `swarm:` | `/dev:team team` | Launch team mode (PM + Dev + QA) |
| `commit:` | `/git:commit` | Commit and PR to dev |
| `ralph:` | `/dev:ralph` | Autonomous verify/fix loops |
| `start:` | `/dev:start` | Pull latest and start dev servers |
| `debug:` | `systematic-debugging` skill | Debug systematically |
| `api:` | `api` skill | Build NestJS endpoints |
| `test:` | `test` skill | Run tests |
| `figma:` | `figma` skill | Convert Figma to React |
| `docs:` | `documentation` skill | Generate documentation |
| `autopilot:` | `/dev:team team --autopilot` | Persistent team in tmux with auto-resume |

**Implementation:** `hooks/skill-activation-prompt.ts` — new `detectMagicKeywords()` function, checked before all other triggers. Skill rules version bumped to 1.1.

---

### Agent Registry — Project Level (NEW)

Created `agents/agent-manifest.json` with 8 project-level agents registered:

| Agent | Model | Domain | Status |
|-------|-------|--------|--------|
| `ticket-fixer` | opus | debugging | existing |
| `documentation-architect` | sonnet | documentation | existing |
| `code-architecture-reviewer` | sonnet | review | existing |
| `refactor-planner` | sonnet | refactoring | existing |
| `auto-error-resolver` | sonnet | debugging | **newly registered** |
| `plan-reviewer` | opus | review | **newly registered** |
| `code-refactor-master` | opus | refactoring | **newly registered** |
| `web-research-specialist` | sonnet | research | **newly registered** |

The `.md` files for all 8 agents already existed — 4 were simply missing from the manifest and are now discoverable by the orchestration system.

---

### QA Coverage Analysis (NEW)

QA agent now suggests additional test stories after running the initial set, closing the coverage gap where test quality depended entirely on PM's upfront story generation.

**How it works:**

1. QA runs all stories from the YAML file
2. After the run, QA analyzes what was tested and looks for gaps:
   - Error/edge cases (invalid input, empty states)
   - Negative paths (wrong credentials, unauthorized access)
   - Missing CRUD coverage
   - Boundary conditions
3. QA appends `SUGGESTED_STORIES` to the report (max 3 suggestions)
4. PM reviews: **Accept** (append to YAML, run 1 more round) or **Skip** (move on)
5. Max 1 suggestion round per backlog item — no infinite loops

**Files changed:**
- `base/agents/playwright-qa-agent.md` — added Coverage Analysis section
- `base/orchestration/modes/team.md` — updated cycle loop steps 5-9

**Before:**
```
QA runs stories → PASS → done
```

**After:**
```
QA runs stories → PASS + suggestions → PM reviews → accept/skip → done
```

---

### Autopilot Mode — Persistent Team Execution (NEW)

Three major enhancements to team mode for long-running autonomous work.

**1. No Stop Until Verified** — Removed the hard 3-round fix cap. Now uses tiered escalation:
- Rounds 1-3: Normal dev fix cycle
- Rounds 4-6: PM rewrites spec with more detail, dev re-implements from scratch
- Round 7+: PM breaks item into smaller sub-items (SPLIT)
- ABANDON only if same error repeats 3x with zero progress → BLOCKED

**2. Auto-Resume via tmux** — New `autopilot.sh` script wraps Claude in a tmux session:
- Detects rate-limit exits via log pattern matching (429, quota exceeded)
- Exponential backoff: 60s → 120s → 240s → 300s cap
- Max 50 retries before giving up
- Status file is source of truth — session can die and resume without losing progress
- Activate: `autopilot: --prd ./my-prd.md` or `--autopilot` flag

**3. Dynamic Backlog** — PM discovers new tasks after each completed item:
- Follow-up tasks, tech debt, QA-discovered gaps, integration work
- Max 5 new items per completed item
- Total cap: 3x original PRD item count (10 items → 30 max)
- Excess logged as DEFERRED for future sessions
- Team only shuts down when ALL items are COMPLETED, BLOCKED, or DEFERRED

**Files changed:**
- `base/orchestration/modes/team.md` — escalation tiers, discovery phase, completion check, auto-resume section
- `base/templates/dev-team/TEAM_STATUS.template.md` — BLOCKED, SPLIT, Source column, Discovered Tasks, Deferred sections
- `base/scripts/autopilot.sh` — **new** tmux wrapper with rate-limit detection
- `base/commands/dev/team.md` — `--autopilot` flag
- `hooks/skill-activation-prompt.ts` — `autopilot:` magic keyword

---

### Session Start Hook (NEW)

Added `SessionStart` hook in `settings.json` that runs `base/hooks/session-start.sh` on every new session.

Displays a quick-start menu with available magic keywords:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
.claude powered | nestjs + react
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick start (type keyword followed by colon):
  debug:    Debug systematically
  team:     Launch agent team
  commit:   Commit and PR to dev
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Skill Rules Cleanup (BREAKING)

`skills/skill-rules.json` has been emptied. All base skill definitions (reflect, fullstack, git-workflow, notion-ticket-reviewer, etc.) now live in `base/skills/skill-rules.json` inside the base submodule.

**What this means for the team:**
- The project-level `skills/skill-rules.json` is now **only for project-specific skill overrides**
- All shared skills are managed in the base submodule — no need to touch project-level file
- If you had custom project skills in this file, they need to be re-added

---

### New Commands (base submodule)

| Command | Description |
|---------|-------------|
| `/operation:qa` | Unified QA — design fidelity + acceptance stories |
| `/operation:ui-review` | Run parallel UI acceptance tests from YAML user stories |
| `/dev:team` | Launch multi-agent orchestration with composable modes |
| `/utility:skills` | Show all available skills organized by category |

---

### Removed

| What | Why |
|------|-----|
| `skills/meta/reflect/SKILL.md` | Reflect commands now handled by base submodule (`/utility:reflect`) |
| Reference Management section in `README.md` | `/build-registry` and `/validate-references` commands removed |
| `/dev:audit-skills` command | Replaced by `/dev:audit-system` |
| `/dev:build-registry` command | Replaced by agent manifest system |
| `/dev:validate-references` command | Superseded by audit system |
| `/dev:session-handoff` command | No longer needed |
| `/dev:submodule-check` command | Removed |
| `/dev:swarm` command | Replaced by `/dev:team` |
| `/operation:test` command | Replaced by `/operation:qa` |
| `content` submodule | Removed entirely — content managed elsewhere |
| `agents/auth-route-tester.md` (nestjs) | Deprecated, removed from nestjs submodule |

---

### Permissions

Added to `settings.local.json` allow list:
- `Bash(node:*)`
- `Bash(bash:*)` (for session-start hook)
- Session-start hook path

---

### Submodule Updates

| Submodule | Key Changes |
|-----------|-------------|
| `base` | Proposal generation skill, playwright QA agent, orchestration mode docs, session-start hook, system audit fixes, swarm tier 2 knowledge, dev-team templates |
| `nestjs` | Audit fixes, deduplicated agents, tier-specific keywords for conflict resolution, new `agent-manifest.json` |
| `react` | Audit fixes, design QA agent enhancements, tier-specific keywords, new `agent-manifest.json` |
| `content` | **Removed entirely** |

---

### Main Project Changes

| Area | Changes |
|------|---------|
| `ai_review/user_stories/` | Added QA user story YAML files: `auth`, `chat-generation`, `community`, `design-generation`, `prd-generation` |
| `backend/chat-generation/prompts/` | Added `prd-analysis.prompt.ts` and `system-instruction.prompt.ts` |
| `frontend/chat-generate/` | Removed multi-step wizard (6 components deleted), unified into single chat flow |
