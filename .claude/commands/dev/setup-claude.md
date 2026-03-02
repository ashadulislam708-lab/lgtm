---
description: Interactively add framework-specific Claude configurations as git submodules
argument-hint: Select frameworks via checkbox prompt
---

# setup-claude

Interactively add framework and department-specific Claude configurations (Django, NestJS, React, React Native, Marketing, Operations, Content) as git submodules to your project.

**Related**: `/init-claude-config` (new project) | `/migrate-submodules` (batch with flags) | `/submodule-check` (validate health)

## Instructions

### Step 0: Validate Prerequisites

Run these checks before proceeding:

| Check | Command | On Failure |
|-------|---------|------------|
| Git repo | `git rev-parse --git-dir` | `❌ ERROR: Not in a git repository. Run 'git init' or navigate to your project.` |
| Directory | `pwd && basename "$(pwd)"` | If in project root with `.claude/` subdirectory: `cd .claude`. If neither `.claude/` dir: `⚠️ Navigate to your project's .claude directory first.` |
| Network | `git ls-remote https://github.com/potentialInc/claude-django.git HEAD` | `⚠️ Cannot access GitHub repos (network/auth issue). Continue anyway?` — ask user to confirm. |

---

### Step 1: Interactive Framework & Department Selection

Present **all three questions in a single AskUserQuestion call**:

```json
{
  "questions": [
    {
      "question": "Which backend framework configurations would you like to add?",
      "header": "Backend",
      "multiSelect": true,
      "options": [
        { "label": "Django", "description": "Python backend - DRF, SimpleJWT, pytest-django patterns" },
        { "label": "NestJS", "description": "TypeScript backend - Controllers, Services, TypeORM, Swagger patterns" },
        { "label": "Skip", "description": "Skip backend framework configurations" }
      ]
    },
    {
      "question": "Which frontend/mobile framework configurations would you like to add?",
      "header": "Frontend",
      "multiSelect": true,
      "options": [
        { "label": "React", "description": "Web frontend - React 19, TailwindCSS, shadcn/ui, Playwright testing" },
        { "label": "React Native", "description": "Mobile - NativeWind, React Navigation, Detox testing" },
        { "label": "Skip", "description": "Skip frontend/mobile framework configurations" }
      ]
    },
    {
      "question": "Which department-specific Claude configurations would you like to add?",
      "header": "Departments",
      "multiSelect": true,
      "options": [
        { "label": "Marketing", "description": "Marketing tools - CRO, copywriting, SEO, analytics, campaign optimization" },
        { "label": "Operations", "description": "Operations workflows - process automation, documentation, project management" },
        { "label": "Content", "description": "Content creation and strategy - blog posts, guides, educational content, video scripts" },
        { "label": "None", "description": "Skip department configurations" }
      ]
    }
  ]
}
```

#### Process Selections

**Name mapping** (case-insensitive):

| Selection | Directory |
|-----------|-----------|
| Django | `django` |
| NestJS | `nestjs` |
| React | `react` |
| React Native | `react-native` |
| Marketing | `marketing` |
| Operations | `operations` |
| Content | `content` |

**Note**: "Skip", "None", and "Other" are filtered out — not mapped to any directory.

Merge all three answers into a single `SELECTIONS` array, filter out "Skip"/"None"/"Other"/empty values.

**If no valid selections remain**: show `ℹ️ No configurations selected. Run /setup-claude or /migrate-submodules later.` and exit.

---

### Step 2: Check for Existing Submodules

For each selected config, check if it already exists:

```bash
for dir in django nestjs react react-native marketing operations content; do
  if [ -d "$dir" ] && [ -e "$dir/.git" ]; then
    echo "EXISTS: $dir/ (submodule)"
  elif [ -d "$dir" ]; then
    echo "EXISTS: $dir/ (plain directory)"
  fi
done
git config --get-regexp 'submodule\..*\.url' 2>/dev/null || echo "No submodules registered"
```

- Add existing ones to `$EXISTING_FRAMEWORKS` and skip them: `ℹ️ Framework(s) already added (skipping): nestjs/, react/`
- If **all** selected already exist: show current submodules, suggest `/submodule-check`, and exit.
- Continue with remaining (non-existing) selections.

---

### Step 3: Add Framework Submodules

**Repository mapping**:

| Config | Repository URL |
|--------|---------------|
| django | `https://github.com/potentialInc/claude-django.git` |
| nestjs | `https://github.com/potentialInc/claude-nestjs.git` |
| react | `https://github.com/potentialInc/claude-react.git` |
| react-native | `https://github.com/potentialInc/claude-react-native.git` |
| marketing | `https://github.com/potentialInc/claude-marketing.git` |
| operations | `https://github.com/potentialInc/claude-operations.git` |
| content | `https://github.com/potentialInc/claude-content.git` |

Add each **sequentially** using the submodule helper:

```bash
for FRAMEWORK in "${SELECTIONS[@]}"; do
  REPO_URL="https://github.com/potentialInc/claude-${FRAMEWORK}.git"
  echo "Adding ${FRAMEWORK}..."
  bash scripts/submodule-add.sh "${REPO_URL}" "${FRAMEWORK}" "main"
  if [ $? -eq 0 ]; then
    echo "✓ ${FRAMEWORK} added"
    ADDED+=("${FRAMEWORK}")
  else
    echo "✗ ${FRAMEWORK} failed"
    FAILED+=("${FRAMEWORK}")
    # Cleanup partial add
    git submodule deinit -f "${FRAMEWORK}" 2>/dev/null
    rm -rf ".git/modules/${FRAMEWORK}" 2>/dev/null
    rm -rf "${FRAMEWORK}" 2>/dev/null
    git config --remove-section "submodule.${FRAMEWORK}" 2>/dev/null
    git config -f .gitmodules --remove-section "submodule.${FRAMEWORK}" 2>/dev/null
  fi
done

# Commit submodule registrations
if [ ${#ADDED[@]} -gt 0 ]; then
  git add .gitmodules
  for fw in "${ADDED[@]}"; do
    git add "$fw"
  done
  git commit -m "feat: Add framework submodules (${ADDED[*]})"
fi
```

---

### Step 3.5: Update .gitignore

For each successfully added config, append framework-specific patterns (skip if already present):

| Config | Patterns |
|--------|----------|
| nestjs | `nestjs/node_modules/`, `nestjs/dist/`, `nestjs/.env`, `nestjs/.env.local`, `nestjs/package-lock.json` |
| react | `react/node_modules/`, `react/build/`, `react/.next/`, `react/dist/`, `react/.env.local`, `react/package-lock.json` |
| react-native | `react-native/node_modules/`, `react-native/.expo/`, `react-native/android/app/build/`, `react-native/ios/Pods/`, `react-native/.env` |
| django | `django/__pycache__/`, `django/.venv/`, `django/venv/`, `django/*.egg-info/`, `django/.env`, `django/db.sqlite3` |
| marketing | `marketing/node_modules/`, `marketing/.env` |
| operations | `operations/node_modules/`, `operations/.env` |
| content | `content/node_modules/`, `content/.env`, `content/dist/`, `content/build/`, `content/*.log` |

Use `grep -qF` to skip existing patterns, append missing ones.

---

### Step 4: Report Results

Display a summary covering all outcomes:

```
=== Claude Framework Setup ===

✓ Prerequisites passed
Selected: [list selections]

Results:
  ✓ django - Added successfully          (for each in ADDED)
  ℹ️ nestjs - Already exists, skipping    (for each in EXISTING)
  ✗ react-native - Failed                (for each in FAILED)

Submodules registered in .gitmodules (shared with all collaborators):
  - django/ -> https://github.com/potentialInc/claude-django.git (branch: main)
  (for each in ADDED)

Other developers can initialize with: git submodule update --init --recursive

.gitignore updated with framework build artifact patterns.

Next Steps:
1. Explore skills: ls -la django/skills/
2. Validate setup: /submodule-check
3. Update later: git submodule update --remote <framework>
```

**If failures occurred**, also show:
```
Failed (N):
  - react-native - Repository not accessible

Possible causes: network issues, auth required (gh auth login), repo not found.
Retry: bash scripts/submodule-add.sh <URL> <path> main
```

---

## Reference

### Configuration Details

| Config | Repository | Contents |
|--------|-----------|----------|
| Django | `potentialInc/claude-django` | DRF, pytest-django, SimpleJWT, serializers, ViewSets |
| NestJS | `potentialInc/claude-nestjs` | TypeORM, Swagger, controllers, services, DTOs |
| React | `potentialInc/claude-react` | React 19, TailwindCSS 4, shadcn/ui, Playwright |
| React Native | `potentialInc/claude-react-native` | NativeWind, React Navigation, Detox |
| Marketing | `potentialInc/claude-marketing` | CRO, copywriting, SEO, analytics, A/B testing |
| Operations | `potentialInc/claude-operations` | Process automation, workflow docs, project management |
| Content | `potentialInc/claude-content` | Blog posts, guides, video scripts, content strategy |

### Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| Not a git repository | Outside git repo | `git init` or navigate to repo |
| Not in .claude directory | Wrong location | `cd .claude/` |
| Network timeout | No internet / GitHub down | Retry later |
| Permission denied | No GitHub access | `gh auth login` or check SSH keys |
| Submodule already exists | Previously added | Skipped automatically |
| Repository not found | URL incorrect or deleted | Verify repo on GitHub |
| Destination path exists | Dir exists but not submodule | `rm -rf <dir>` then re-add |
| Empty submodule | Not initialized | `git submodule update --init --recursive` |
| .gitmodules entry missing | Corrupted .gitmodules | Re-add submodule: `git submodule add -b main <URL> <path>` |

### Rollback

```bash
git submodule deinit -f <framework>
rm -rf "$(git rev-parse --git-dir)/modules/<framework>"
git rm -f <framework>
git config -f .gitmodules --remove-section "submodule.<framework>" 2>/dev/null
git add .gitmodules
git commit -m "chore: Remove <framework> submodule"
```

### Quick Commands

```bash
git submodule status                              # Check status
git submodule update --init --recursive           # Initialize all submodules
git submodule update --remote                     # Update all to latest
git submodule update --remote django              # Update specific one
git config -f .gitmodules --get-regexp 'branch'   # Show branch tracking
```

---

## Examples

### Example 1: Full Stack Setup
1. Run `/setup-claude`
2. Frameworks: ✓ NestJS, ✓ React | Departments: ✓ None
3. Result: `.claude/nestjs/` and `.claude/react/` added

### Example 2: Department Only (Skip Frameworks)
1. Run `/setup-claude`
2. Frameworks: ✓ Skip | Departments: ✓ Marketing, ✓ Content
3. Result: `.claude/marketing/` and `.claude/content/` added

### Example 3: Adding Framework Later
1. Run `/setup-claude` (React already exists)
2. Frameworks: ✓ React Native | Departments: ✓ None
3. System skips React, adds only `.claude/react-native/`

---

**Best Practices**: Run in `.claude/` dir → validate with `/submodule-check` → update with `git submodule update --remote` → commit updated refs

**See Also**: `/migrate-submodules` | `/init-claude-config` | `/submodule-check`
