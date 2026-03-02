---
name: project-init
phase: 1
prerequisites: []
description: Initialize project structure with Claude config and documentation folders
---

# Project Init Skill

Phase 1 of the fullstack pipeline. Sets up project infrastructure.

## Context

- **Project**: Read from PIPELINE_STATUS.md or prompt
- **Previous phase**: None (first phase)
- **Expected output**: `.claude-project/` folder, `.claude/` submodule (if new)

## Smart Detection

Before executing, detect the current project state:

### Check 1: Is this a new project?

```bash
# Check if .claude/ exists
ls -la .claude/ 2>/dev/null
```

**If `.claude/` does NOT exist:**
- This is a brand new project
- Execute full `/new-project` workflow (see below)

**If `.claude/` EXISTS:**
- Skip to Check 2

### Check 2: Does .claude-project/ exist?

```bash
# Check if .claude-project/ exists
ls -la .claude-project/ 2>/dev/null
```

**If `.claude-project/` does NOT exist:**
- Project has Claude config but no documentation
- Execute `/init-workspace` workflow (see below)

**If `.claude-project/` EXISTS:**
- Verify structure is complete
- Report ready

---

## Execution Path A: Full New Project Setup

When `.claude/` doesn't exist, run the full project setup:

### A.1 Gather Tech Stack

Use **AskUserQuestion** to determine the tech stack. This information will be persisted to PIPELINE_STATUS.md for all subsequent phases.

**Question 1: Backend Framework** (single selection)
```
Question: "Which backend framework will this project use?"
Header: "Backend"
Options:
  - label: "NestJS (Recommended)"
    description: "TypeScript, TypeORM, JWT, Swagger - Full-featured Node.js framework"
  - label: "Django"
    description: "Python, DRF, SimpleJWT, drf-spectacular - Batteries-included Python framework"
```
Store as: `$BACKEND` = "nestjs" | "django"

**Question 2: Frontend Framework(s)** (multiSelect: true)
```
Question: "Which frontend framework(s) will this project use?"
Header: "Frontend"
Options:
  - label: "React Web"
    description: "React 19, TailwindCSS 4, shadcn/ui - Modern web application"
  - label: "React Native"
    description: "NativeWind, React Navigation - Cross-platform mobile app"
```
Store as: `$FRONTENDS` = ["react"] | ["react-native"] | ["react", "react-native"]

**Question 3: Dashboards** (multiSelect: true, optional)
```
Question: "Do you need any dashboard applications?"
Header: "Dashboards"
Options:
  - label: "Admin Dashboard"
    description: "System administration interface (uses React)"
  - label: "Coach Dashboard"
    description: "Coach/user-specific management interface (uses React)"
  - label: "None"
    description: "No dashboard needed for this project"
```
Store as: `$DASHBOARDS` = [] | ["admin"] | ["coach"] | ["admin", "coach"]

### A.2 Create Claude Config Repository

```bash
# Create config repo on GitHub
gh repo create potentialInc/{project}-claude --public

# Clone and set up submodules
git clone https://github.com/potentialInc/{project}-claude.git /tmp/{project}-claude
cd /tmp/{project}-claude

# Add base submodule (always)
git submodule add https://github.com/potentialInc/claude-base.git base

# Add framework submodules based on selection
# NestJS: git submodule add https://github.com/potentialInc/claude-nestjs.git nestjs
# Django: git submodule add https://github.com/potentialInc/claude-django.git django
# React: git submodule add https://github.com/potentialInc/claude-react.git react
# React Native: git submodule add https://github.com/potentialInc/claude-react-native.git react-native

git submodule update --init --recursive
```

### A.3 Create Config Structure

```bash
mkdir -p agents hooks skills
ln -s base/commands commands

# Create settings.json
cat > settings.json << 'EOF'
{
  "hooks": {
    "UserPromptSubmit": [],
    "PostToolUse": [],
    "Stop": []
  },
  "mcpServers": {}
}
EOF

# Push config repo
git add -A
git commit -m "feat: Initialize Claude Code config"
git push -u origin main
```

### A.4 Add .claude to Project

```bash
cd $PROJECT_DIR
git submodule add https://github.com/potentialInc/{project}-claude.git .claude
git submodule update --init --recursive
```

### A.5 Clone Boilerplate Repositories

Based on tech stack selection:

| Selection | Repository | Target Folder |
|-----------|------------|---------------|
| NestJS | potentialInc/nestjs-starter-kit | backend/ |
| Django | potentialInc/django-starter-kit | backend/ |
| React Web | potentialInc/react-starter-kit | frontend/ |
| Dashboard | potentialInc/react-starter-kit | dashboard/ |
| Coach Dashboard | potentialInc/react-starter-kit | frontend-coach-dashboard/ |
| React Native | potentialInc/react-native-starter-kit | mobile/ |

```bash
# For each selected boilerplate:
git clone --branch main --single-branch $REPO_URL $FOLDER
rm -rf $FOLDER/.git $FOLDER/.gitmodules
rm -f $FOLDER/Dockerfile* $FOLDER/docker-compose*.yml
```

### A.6 Generate docker-compose.yml

Create root `docker-compose.yml` with services for each selected component.

### A.7 Persist Tech Stack to PIPELINE_STATUS.md

After creating the status file, update the Configuration section with the selected tech stack:

```bash
# Create PIPELINE_STATUS.md from template
mkdir -p .claude-project/status/{project}
cp .claude/base/templates/PIPELINE_STATUS.template.md .claude-project/status/{project}/PIPELINE_STATUS.md

# Replace placeholders
sed -i '' "s/{PROJECT_NAME}/$PROJECT_NAME/g" .claude-project/status/{project}/PIPELINE_STATUS.md
sed -i '' "s/{DATE}/$(date +%Y-%m-%d)/g" .claude-project/status/{project}/PIPELINE_STATUS.md
```

**Update the tech_stack configuration:**

```yaml
tech_stack:
  backend: $BACKEND          # e.g., "nestjs"
  frontends: $FRONTENDS      # e.g., ["react"]
  dashboards: $DASHBOARDS    # e.g., ["admin"]
```

This persisted configuration will be used by all subsequent phases to resolve the correct skill paths.

### A.8 Validate Submodules

Before completing, verify all required submodules exist:

```bash
# Check backend submodule
if [ ! -d ".claude/$BACKEND" ]; then
  echo "ERROR: Missing backend submodule .claude/$BACKEND/"
  echo "Install with: git submodule add https://github.com/potentialInc/claude-$BACKEND.git .claude/$BACKEND"
  exit 1
fi

# Check frontend submodule(s)
for frontend in "${FRONTENDS[@]}"; do
  if [ ! -d ".claude/$frontend" ]; then
    echo "ERROR: Missing frontend submodule .claude/$frontend/"
    echo "Install with: git submodule add https://github.com/potentialInc/claude-$frontend.git .claude/$frontend"
    exit 1
  fi
done
```

### A.9 Continue to Init Project Docs

After setup, continue to Execution Path B.

---

## Execution Path B: Initialize Project Documentation

When `.claude/` exists but `.claude-project/` doesn't:

### B.1 Auto-Detect Project Info

```bash
# Get project name from git remote or folder name
project_name=$(basename $(git rev-parse --show-toplevel))

# Detect tech stack from .claude/ submodules
tech_stack=$(ls .claude/ | grep -E "nestjs|django|react|react-native")
```

### B.2 Create Documentation Structure

```bash
mkdir -p .claude-project/{docs,memory,plans,prd}

# Create docs files
touch .claude-project/docs/PROJECT_KNOWLEDGE.md
touch .claude-project/docs/PROJECT_API.md
touch .claude-project/docs/PROJECT_DATABASE.md
touch .claude-project/docs/PROJECT_API_INTEGRATION.md

# Create memory files
touch .claude-project/memory/DECISIONS.md
touch .claude-project/memory/LEARNINGS.md
touch .claude-project/memory/PREFERENCES.md

# Create plan folders for each project folder
for folder in backend frontend frontend-* mobile; do
  if [ -d "$folder" ]; then
    mkdir -p ".claude-project/status/$folder"
  fi
done
```

### B.3 Create Initial Templates

Copy templates from `.claude/base/templates/claude-project/` and replace placeholders:

- `{PROJECT_NAME}` → actual project name
- `{DATE}` → current date
- `{BACKEND}` → detected backend framework
- `{FRONTENDS}` → detected frontend frameworks

---

## Execution Path C: Verify Existing Structure

When both `.claude/` and `.claude-project/` exist:

### C.1 Verify Required Folders

```bash
required_folders=(
  ".claude-project/docs"
  ".claude-project/memory"
  ".claude-project/status"
)

for folder in "${required_folders[@]}"; do
  if [ ! -d "$folder" ]; then
    echo "Missing: $folder"
    # Create missing folder
    mkdir -p "$folder"
  fi
done
```

### C.2 Verify Required Files

```bash
required_files=(
  ".claude-project/docs/PROJECT_KNOWLEDGE.md"
  ".claude-project/docs/PROJECT_API.md"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing: $file"
    # Create from template
  fi
done
```

### C.3 Report Status

```
Project Init Verification
=========================
.claude/           ✅ Present
.claude-project/   ✅ Present
  docs/            ✅ Complete
  memory/          ✅ Complete
  plans/           ✅ Complete

Project is ready for next phase.
```

---

## Completion Criteria

- [ ] `.claude/` submodule exists and is initialized
- [ ] `.claude-project/` folder structure exists
- [ ] `.claude-project/docs/` has required files
- [ ] `.claude-project/memory/` has required files
- [ ] `.claude-project/status/` has project-specific subfolders
- [ ] `PIPELINE_STATUS.md` exists with valid `tech_stack` configuration
- [ ] All required framework submodules exist (`.claude/$BACKEND/`, `.claude/$FRONTEND/`)

## On Success

Update PIPELINE_STATUS.md:
```
| init | project-init.md | :white_check_mark: | - | .claude-project/ | Done |
```

Add to Execution Log:
```
| {DATE} | init | {DURATION} | :white_check_mark: | - |
```

## On Failure

Update PIPELINE_STATUS.md:
```
| init | project-init.md | :x: | - | - | {ERROR_MESSAGE} |
```

Common failures:
- GitHub CLI not authenticated → Run `gh auth login`
- Repository already exists → Ask to use existing or rename
- Network error during clone → Retry or check connection

---

## Related Commands

- `/new-project` - Full project setup (used in Path A)
- `/init-workspace` - Documentation setup only (used in Path B)
- `/init-claude-config` - Claude config setup only
