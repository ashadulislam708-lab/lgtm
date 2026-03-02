---
name: gap-finder
description: Methodology and checklists for finding implementation gaps across the full stack
---

# Gap Finder Skill

Systematic gap detection comparing the current implementation against PRD, design guidelines, HTML prototypes, and API specifications.

## Quick Start

```
/dev:gap-finder                  # Full scan (frontend + backend)
/dev:gap-finder frontend         # Frontend only
/dev:gap-finder backend          # Backend only
```

## Reference Documents

Always load these before scanning:

| Document | Path | What to Extract |
|----------|------|-----------------|
| PRD | `.claude-project/prd/prd.pdf` | Required screens, features, flows |
| Design System | `.claude-project/docs/PROJECT_DESIGN_GUIDELINES.md` | Colors, fonts, spacing, components |
| API Spec | `.claude-project/docs/PROJECT_API.md` | Endpoints, parameters, responses |
| Integration Map | `.claude-project/docs/PROJECT_API_INTEGRATION.md` | Frontend-API connection status |
| Database | `.claude-project/docs/PROJECT_DATABASE.md` | Entities, relationships |
| Architecture | `.claude-project/docs/PROJECT_KNOWLEDGE.md` | Stack, patterns, conventions |
| HTML Prototypes | `.claude-project/resources/HTML/` | Visual reference for each screen |

---

## Gap Categories & Detection Patterns

### 1. Design System Compliance

**Colors:**
```bash
# Find non-standard custom colors (should be #6366F1, #0F172A, #F8FAFC)
rg "bg-\[#(?!6366F1|0F172A|F8FAFC)" --glob '*.tsx' frontend/
rg "text-\[#" --glob '*.tsx' frontend/

# Verify status colors match spec
rg "bg-red" --glob '*.tsx' frontend/     # Should use red-50/red-700/red-200
rg "bg-yellow" --glob '*.tsx' frontend/  # Should use yellow-50/yellow-700/yellow-200
rg "bg-green" --glob '*.tsx' frontend/   # Should use green-50/green-700/green-200
```

**Typography:**
```bash
# Headings without font-jakarta
rg "text-(2xl|3xl|4xl)" --glob '*.tsx' frontend/ | rg -v "font-jakarta"

# Check font imports
rg "font-jakarta|Plus Jakarta" frontend/app/styles/
```

**Spacing & Borders:**
```bash
# Non-standard border-radius (should be rounded-2xl, rounded-xl, rounded-lg)
rg "rounded-(?!2xl|xl|lg|full|md)" --glob '*.tsx' frontend/

# Check shadow usage
rg "shadow-" --glob '*.tsx' frontend/
```

### 2. Missing Icons

```bash
# Pages that DON'T import from lucide-react
fd -e tsx frontend/app/pages/ -x sh -c 'rg -L "lucide-react" "$1" && echo "$1"' _ {}

# Count icon imports per file
rg "from 'lucide-react'" --glob '*.tsx' frontend/ -c

# Buttons that might need icons (look for text-only buttons)
rg "<button|<Button" --glob '*.tsx' frontend/ -A 2
```

**Expected icon patterns:**
- Nav items: icon + label
- Action buttons: icon + text (or icon-only with aria-label)
- Status badges: colored dot or icon + text
- Loading: `<Loader2 className="animate-spin" />`
- Error: `<AlertTriangle />` or `<AlertCircle />`
- Empty state: large icon + heading + description

### 3. Missing Pages/Features

```bash
# List all implemented pages
fd -e tsx frontend/app/pages/

# Check route definitions
rg "path:" frontend/app/ --glob '*.tsx'
rg "Route " frontend/app/ --glob '*.tsx'

# List HTML prototypes (each should have a React equivalent)
fd -e html .claude-project/resources/HTML/
```

**Cross-reference:**
- Each PRD screen should have a `.tsx` page file
- Each HTML prototype should have a React implementation
- Each route in the router should resolve to an existing component

#### 3a. Navigation Integrity

Check that internal links use SPA navigation and point to valid destinations:

```bash
# Find <a href> tags used for internal navigation (SPA anti-pattern)
rg -U '<a\b[^>]*href="/' --glob '*.tsx' frontend/app/

# Extract all internal link destinations for cross-reference
rg 'href="(/[^"]*)"' --glob '*.tsx' frontend/app/ -o --no-filename | sort -u
rg 'to="(/[^"]*)"' --glob '*.tsx' frontend/app/ -o --no-filename | sort -u

# Compare against defined routes
rg "path:" frontend/app/ --glob '*.tsx'
```

**Flag:**
- `<a href="/...">` for internal routes (should be `<Link to>` or `useNavigate`)
- Destinations that don't match any defined route
- Link text implying a page/flow that doesn't exist (e.g., "Login here" linking to a dashboard)
- Links to auth-guarded routes that would cause redirect loops for unauthenticated users

#### 3b. Semantic Link Text Mismatch

Cross-reference link visible text against destination to detect misleading navigation:

```bash
# Step 1: Find auth pages with auth-action link text
rg -l '(login|sign.in|sign.up|register)' --glob '*.tsx' frontend/app/pages/auth/

# Step 2: In those files, check for links pointing to guarded routes
rg -n '(to|href)="(/admin|/projects|/dashboard)' --glob '*.tsx' frontend/app/pages/auth/

# Reverse: dashboard/home text pointing to auth routes
rg -n 'to="(/login|/register|/auth)[^"]*"' --glob '*.tsx' frontend/app/ -A 3 | rg -i '(dashboard|home|project)'
```

**Detection matrix:**

| Link Text Contains | Destination Must Match | Severity if Mismatched |
|---|---|---|
| "login", "sign in" | `/login`, `/auth/*` | HIGH |
| "register", "sign up" | `/register`, `/signup` | HIGH |
| Any text on auth pages | Must NOT target guarded routes | CRITICAL (redirect loop) |

**Flag:**
- Auth-action text pointing to protected routes (confusing UX + potential redirect loops)
- Links on public pages whose destination is behind auth guards
- Redundant self-referencing links on auth pages

> See also 9c for auth guard redirect loop analysis.

### 4. Missing UI States

```bash
# Loading states per page
rg "(isLoading|loading|LoadingSpinner|Loader2)" --glob '*.tsx' frontend/app/pages/ -l

# Error states per page
rg "(isError|error && |Error message|AlertTriangle)" --glob '*.tsx' frontend/app/pages/ -l

# Empty states per page
rg "(EmptyState|empty|No .* found|no data)" --glob '*.tsx' frontend/app/pages/ -l

# Form validation
rg "(error|invalid|required|validation)" --glob '*.tsx' frontend/app/pages/ -l

# Confirmation dialogs
rg "(ConfirmModal|confirm|Are you sure)" --glob '*.tsx' frontend/app/pages/ -l

# Toast/notifications
rg "(toast|notification|success|alert)" --glob '*.tsx' frontend/app/pages/ -l
```

**Per-page checklist:**
- [ ] Loading spinner while data fetches
- [ ] Error alert on API failure
- [ ] Empty state when list is empty
- [ ] Form validation messages
- [ ] Success feedback after create/update/delete
- [ ] Confirmation before delete actions

### 5. Hardcoded/Placeholder Content

```bash
# Hardcoded user info
rg '"Admin User"|"dev@"|"admin@"' --glob '*.tsx' frontend/

# Hardcoded numbers/stats
rg '"\+[0-9]|"[0-9]+ (this|last|new)"' --glob '*.tsx' frontend/

# TODO/FIXME/HACK comments
rg "(TODO|FIXME|HACK|XXX|TEMP)" --glob '*.{ts,tsx}' frontend/ backend/

# Placeholder text
rg "(placeholder|lorem|dummy|sample|example\.com)" -i --glob '*.{ts,tsx}' frontend/ backend/

# Hardcoded credentials
rg '"(password|secret|token|key)"' -i --glob '*.{ts,tsx}' frontend/ backend/
```

### 6. Accessibility

```bash
# Images without alt
rg "<img " --glob '*.tsx' frontend/ | rg -v 'alt='

# Icon-only buttons without labels
rg "onClick.*icon|icon.*onClick" --glob '*.tsx' frontend/ | rg -v "(aria-label|sr-only|title)"

# Form inputs without labels
rg "<(input|Input|textarea|Textarea|select|Select)" --glob '*.tsx' frontend/ | rg -v "(Label|label|aria-label)"

# Missing role attributes on interactive elements
rg "onClick" --glob '*.tsx' frontend/ | rg "<div|<span" | rg -v 'role='
```

### 7. API Integration Gaps

```bash
# Service files and their endpoints
rg "(get|post|put|patch|delete)\(" --glob '*.ts' frontend/app/services/

# Redux thunks
rg "createAsyncThunk" --glob '*.ts' frontend/app/

# Missing error handling
fd -e ts frontend/app/services/ -x sh -c 'rg -L "catch|error" "$1" && echo "NO ERROR HANDLING: $1"' _ {}
```

**Cross-reference against PROJECT_API.md:**
- Each documented endpoint should have a service function
- Each service function should have error handling
- Each endpoint with pagination should pass page/limit params
- Each endpoint with search should pass search/filter params

### 8. Backend Gaps

```bash
# Controllers without Swagger
rg "@Controller" --glob '*.ts' backend/src/ -l | xargs rg -L "@ApiTags"

# Missing @ApiOperation on endpoints
rg "@(Get|Post|Patch|Delete)\(" --glob '*.ts' backend/src/ -B 3 | rg -v "@ApiOperation"

# DTOs without validation
fd -e ts -p 'dto' backend/src/ -x sh -c 'rg -L "(IsString|IsNumber|IsEmail|IsUUID|IsOptional)" "$1" && echo "NO VALIDATION: $1"' _ {}

# Missing guards on non-public routes
rg "@(Get|Post|Patch|Delete)\(" --glob '*.ts' backend/src/ -B 5 | rg -v "(UseGuards|Public)"

# Services without proper exceptions
fd -e ts -p 'service' backend/src/modules/ -x sh -c 'rg -L "(NotFoundException|ConflictException|BadRequestException)" "$1" && echo "NO EXCEPTIONS: $1"' _ {}
```

### 9. Auth & State Management

Detect infinite API loops, auth guard re-entrance, and public-to-protected route links.

#### 9a. Infinite API Loop Detection

```bash
# Find guards/components that dispatch thunks inside useEffect
rg "useEffect" --glob '*.tsx' frontend/app/components/guards/ -A 5

# Find async thunk rejected handlers that reset state to initialState
rg "\.rejected.*initialState|\.rejected.*=>.*\{" --glob '*.ts' frontend/app/redux/
```

**Flag:**
- useEffect dispatches thunk → thunk.rejected resets state that useEffect depends on → infinite loop
- No "checked" or "attempted" flag to break the dispatch cycle after first failure

#### 9b. Auth Guard Re-entrance

```bash
# Find guard components
fd -e tsx -p 'Guard' frontend/app/

# Check if guards track whether auth check was already attempted
rg "authChecked|sessionChecked|hasChecked" --glob '*.tsx' frontend/app/components/guards/
```

**Flag:**
- Guards dispatching auth-check thunks without tracking whether check was already attempted
- Guards where "not authenticated" state is indistinguishable from "never checked" state

#### 9c. Protected Route Links from Public Pages

```bash
# Find link targets in auth/public pages pointing to guarded routes
rg 'to="(/admin|/projects|/dashboard)' --glob '*.tsx' frontend/app/pages/auth/

# Cross-reference against guarded route definitions
rg "Guard" frontend/app/routes.ts
```

**Flag:**
- Public pages linking to protected routes (bypasses login flow, triggers guard redirect loops)
- Link text implying login form but actually pointing to a guarded dashboard/page

> See also 3b for semantic link text mismatch detection patterns.

---

## Scoring Methodology

Each category is scored 0-100% based on compliance:

| Category | Weight | Scoring |
|----------|--------|---------|
| Design System | 15% | (compliant items / total items) x 100 |
| Missing Icons | 5% | (pages with icons / total pages) x 100 |
| Missing Pages | 20% | (implemented pages / PRD-required pages) x 100 |
| Missing UI States | 15% | (states handled / states required) x 100 |
| Hardcoded Content | 5% | 100 - (hardcoded items x 5), min 0 |
| Accessibility | 10% | (accessible elements / total interactive elements) x 100 |
| API Integration | 15% | (connected endpoints / total endpoints) x 100 |
| Backend | 5% | (compliant modules / total modules) x 100 |
| Auth & State Mgmt | 10% | (guards with checked flag / total guards) x 100, minus infinite loop patterns |

**Overall Score** = weighted average of all categories.

| Score Range | Rating |
|-------------|--------|
| 90-100% | Excellent |
| 75-89% | Good |
| 50-74% | Needs Work |
| 0-49% | Critical |

---

## Report Output

Save to: `./dev/reports/gap-analysis-{YYYY-MM-DD}.md`

See the [gap-finder agent](../../agents/gap-finder.md) for the full report template.

---

## Related

- **Agent:** [gap-finder](../../agents/gap-finder.md) — Executes the scan
- **Command:** [/dev:gap-finder](../../commands/dev/gap-finder.md) — Invocation entry point
- **Related agents:** [code-architecture-reviewer](../../agents/code-architecture-reviewer.md), [api-integration-agent](../../agents/api-integration-agent.md)
