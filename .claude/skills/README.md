# Skills

Production-tested skills for Claude Code that auto-activate based on context.

---

## What Are Skills?

Skills are modular knowledge bases that Claude loads when needed. They provide:

- Domain-specific guidelines
- Best practices
- Code examples
- Anti-patterns to avoid

**How it works:** Skills activate automatically via hooks + `skill-rules.json` configuration.

---

## Available Skills

### skill-developer (Meta-Skill)

**Purpose:** Creating and managing Claude Code skills

**Files:** 7 resource files

**Use when:**

- Creating new skills
- Understanding skill structure
- Working with skill-rules.json
- Debugging skill activation

**[View Skill →](skill-developer/)**

---

### fullstack

**Purpose:** Fullstack project management and deployment

**Files:** 3 files (deployment.md, iteration-manager.md, project-init.md)

**Covers:**

- Project initialization patterns
- Deployment workflows
- Iteration management and planning

**Use when:**

- Setting up new fullstack projects
- Planning deployment strategies
- Managing development iterations

**[View Skill →](fullstack/)**

---

### generate-ppt

**Purpose:** Creating HTML presentations with reveal.js

**Files:** 1 main file (SKILL.md)

**Covers:**

- Reveal.js presentation structure
- Brand-consistent slide design
- Townhall and meeting decks

**Use when:**

- Creating presentations
- Building slide decks
- Generating townhall materials

**[View Skill →](generate-ppt/)**

---

### notion-ticket-reviewer

**Purpose:** Notion database integration for ticket management

**Files:** SKILL.md + 7 prompt files + config

**Covers:**

- Fetching tickets from Notion
- Reviewing and updating ticket status
- Filtering by project/app/status
- Automated ticket processing

**Use when:**

- Reviewing Notion tickets
- Fixing tickets from backlog
- Updating ticket status

**[View Skill →](notion-ticket-reviewer/)**

---

### e2e-testing

**Purpose:** Playwright E2E testing patterns

**Files:** 2 files (e2e-fixtures.md, e2e-page-objects.md)

**Covers:**

- Test fixture management
- Page Object pattern templates
- Authentication fixtures
- Test data generators
- Waiting strategies (no hardcoded timeouts)

**Use when:**

- Writing Playwright E2E tests
- Creating page objects
- Managing test fixtures

**[View Skill →](e2e-testing/)**

---

### git-workflow

**Purpose:** Git and PR workflow automation

**Files:** 1 file (create-dev-pr.md)

**Covers:**

- Creating PRs to dev branch
- PR title formatting (conventional commits)
- Pre-flight checks before PR
- GitHub CLI usage

**Use when:**

- Creating pull requests
- Pushing to dev branch
- Completing bug fixes or features

**[View Skill →](git-workflow/)**

---

### debugging

**Purpose:** Frontend bug fixing guide

**Files:** 1 file (fix-bug.md)

**Covers:**

- React rendering issues
- Redux state problems
- React Router 7 issues
- API/data fetching errors
- TypeScript type errors
- Styling/CSS issues

**Use when:**

- Fixing frontend bugs
- Debugging React components
- Troubleshooting state issues

**[View Skill →](debugging/)**

---

### code-quality

**Purpose:** TypeScript type organization

**Files:** 1 file (organize-types.md)

**Covers:**

- Type organization structure
- Where to place different type categories
- Detecting duplicate types
- Barrel exports management

**Use when:**

- Organizing TypeScript types
- Cleaning up type definitions
- Refactoring type structure

**[View Skill →](code-quality/)**

---

## Stack-Specific Skills

Additional skills are available in stack-specific submodules:

| Submodule | Skills |
|-----------|--------|
| `nestjs/` | backend-dev-guidelines, error-tracking |
| `react/` | frontend-dev-guidelines |
| `react-native/` | mobile-dev-guidelines |

These activate when the submodule is included in your project.

---

## skill-rules.json Configuration

### What It Does

Defines when skills should activate based on:

- **Keywords** in user prompts
- **Intent patterns** (regex matching user intent)
- **File path patterns** (editing specific files)

### Configuration Format

```json
{
  "skill-name": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high" | "medium" | "low",
    "promptTriggers": {
      "keywords": ["list", "of", "keywords"],
      "intentPatterns": ["regex patterns"]
    },
    "fileTriggers": {
      "pathPatterns": ["path/to/files/**/*.ts"]
    }
  }
}
```

### Enforcement Levels

- **suggest**: Skill appears as suggestion
- **block**: Must use skill before proceeding (guardrail)

---

## Using as .claude Submodule

This repo is designed to be added as a `.claude` submodule to other projects:

```bash
git submodule add https://github.com/potentialInc/claude-workflow.git .claude
```

Claude Code will automatically discover:
- `commands/` - Slash commands
- `agents/` - Agent definitions
- `skills/` - Skill definitions
- `hooks/` - Hook scripts (referenced in settings.json)

---

## Troubleshooting

### Skill isn't activating

**Check:**

1. Is skill directory in `.claude/skills/`?
2. Is skill listed in `skill-rules.json`?
3. Do trigger keywords match your prompt?
4. Are hooks installed and working?

**Debug:**

```bash
# Check skill exists
ls -la .claude/skills/

# Validate skill-rules.json
cat .claude/skills/skill-rules.json | jq .

# Check hooks are executable
ls -la .claude/hooks/*.sh
```

### Skill activates too often

Update skill-rules.json:

- Make keywords more specific
- Narrow `pathPatterns`
- Increase specificity of `intentPatterns`

---

## Creating Your Own Skills

See the **skill-developer** skill for complete guide on:

- Skill structure and frontmatter
- Resource file organization
- Trigger pattern design
- Testing skill activation

**Quick template:**

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill Title

## Purpose
[Why this skill exists]

## When to Use This Skill
[Auto-activation scenarios]

## Quick Reference
[Key patterns and examples]
```
