# Team Learnings

Shared learnings across all projects using this .claude base configuration.
These are team-wide conventions and patterns.

---

## Scope

This file contains learnings that apply to **ALL projects** using this base configuration:
- Team coding conventions
- Shared library preferences
- Common architectural patterns
- Team process preferences

For project-specific learnings, use `.claude-project/memory/LEARNINGS.md`
For personal preferences, use `~/.claude/memory/LEARNINGS.md`

---

## Entries

<!-- Team learnings are appended below this line -->

### 2026-01-28: Google OAuth Integration

**Type**: guideline-reference
**Source**: Session reflection - design-flow project

**Description**: Full Google OAuth integration guide created.

**See**: [guides/google-oauth.md](../guides/google-oauth.md)

Key gotchas documented:
- Use localStorage for OAuth state (not sessionStorage)
- Backend SocialLoginTypeEnum uses numeric values (GOOGLE=3)
- Access tokens validate via userinfo endpoint
- New users require `termsAndConditionsAccepted: true`

---

### 2026-01-28: Use Dynamic Service Discovery for PM2 Configs

**Type**: correction
**Confidence**: HIGH
**Source**: Session reflection - design-flow project

**Description**: Don't hardcode dashboard services in PM2/Docker configs. Use dynamic discovery pattern instead because different projects have different dashboard combinations (admin, coach, owner, etc.).

**Evidence**:
- "there must be multiple dashboard so it shouldn't be hardcoded"
- Different projects may have different dashboard needs

**Pattern**: Use `dashboard/` folder for consolidated admin dashboard. If separate dashboards are truly needed, ask user during project setup rather than auto-detecting from HTML. This simplifies project structure.

---

### 2026-01-28: Vite/React Router Requires Explicit --port Flag

**Type**: technical-learning
**Confidence**: HIGH
**Source**: Session reflection - design-flow project

**Description**: Vite dev server (used by React Router v7) does NOT respect the `PORT` environment variable. Must pass `--port` flag explicitly via CLI.

**Correct approach**:
```javascript
// In PM2 ecosystem.config.js
args: `run dev -- --port ${port}`,  // ✓ Works
```

**Incorrect approach**:
```javascript
env: {
  PORT: 5173,  // ✗ Ignored by Vite
}
```

---

### 2026-01-28: Always Create Symlinks When Adding Commands to base/commands

**Type**: correction
**Confidence**: HIGH
**Source**: Session reflection - design-flow project

**Description**: When creating new commands in `.claude/base/commands/`, you must also create a corresponding symlink in `.claude/commands/` for the command to be accessible.

**Evidence**:
- "I think you forgot symlink. I'm not sure how you create a command, whenever you create a command can you check symlink?"

**Pattern**:
```bash
# After creating .claude/base/commands/dev/start.md
cd .claude/commands/dev
ln -s ../../base/commands/dev/start.md start.md
```

**Structure**:
```
.claude/
├── base/commands/dev/start.md     # Actual command file
└── commands/dev/start.md          # Symlink → ../../base/commands/dev/start.md
```

**Checklist for new commands**:
1. Create command file in `.claude/base/commands/<category>/<name>.md`
2. Create symlink in `.claude/commands/<category>/<name>.md`
3. Verify with `ls -la .claude/commands/<category>/<name>.md`

---
