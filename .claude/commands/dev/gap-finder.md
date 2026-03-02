---
description: Scan project for missing designs, icons, and implementation gaps
argument-hint: [scope] — frontend, backend, or all (default: all)
---

# /dev:gap-finder

Scan the full project for missing designs, icons, incomplete pages, placeholder content, and other implementation gaps. Generates a structured markdown report.

## Usage

```
/dev:gap-finder
/dev:gap-finder frontend
/dev:gap-finder backend
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| scope | No | `frontend`, `backend`, or `all` (default: `all`) |

## Workflow

### Step 0: Parse Scope

Determine scan scope from the argument:
- `frontend` — scan only `frontend/app/` pages and components
- `backend` — scan only `backend/src/` modules and endpoints
- `all` (default) — scan both frontend and backend

### Step 1: Load Reference Documents

Read all project documentation to establish the baseline:

```
.claude-project/prd/prd.pdf              → Required features and screens
.claude-project/docs/PROJECT_DESIGN_GUIDELINES.md → Design system rules
.claude-project/docs/PROJECT_API.md       → API endpoint specifications
.claude-project/docs/PROJECT_API_INTEGRATION.md → Frontend-API mapping
.claude-project/docs/PROJECT_DATABASE.md  → Database schema
.claude-project/docs/PROJECT_KNOWLEDGE.md → Architecture overview
```

Also scan HTML prototypes:
```
.claude-project/resources/HTML/           → Prototype screens for comparison
```

### Step 2: Frontend Scan (if scope includes frontend)

Discover all page and component files:

```bash
fd -e tsx -p 'pages/' frontend/app/
fd -e tsx -p 'components/' frontend/app/
```

For **each page**, check:

1. **Design System Compliance** — colors, typography, spacing, borders, shadows match `PROJECT_DESIGN_GUIDELINES.md`
2. **Missing Icons** — buttons/actions without Lucide React icons, text-only indicators
3. **Missing UI States** — loading, error, empty states; form validation feedback; confirmation dialogs
4. **Hardcoded Content** — hardcoded strings, placeholder images, TODO/FIXME comments
5. **Accessibility** — missing aria-labels, alt text, sr-only text on icon-only buttons
6. **Navigation Integrity** — `<a href>` used instead of `<Link>` for internal routes, links to non-existent pages, misleading link text, semantic link text mismatches (auth-action text pointing to non-auth routes, redirect loop risks)
7. **Auth & State Management** — infinite API loops from useEffect+state reset cycles, auth guard re-entrance without `authChecked` flag, links from public pages to protected routes

Cross-reference:
- Compare implemented pages vs PRD-required screens
- Compare against HTML prototypes in `.claude-project/resources/HTML/`
- Compare API calls vs `PROJECT_API_INTEGRATION.md`
- Verify all internal link destinations (`href`, `to`) resolve to defined routes
- Cross-reference link visible text against destination type (auth text must point to auth routes, not dashboards)

### Step 3: Backend Scan (if scope includes backend)

Discover all module files:

```bash
fd -e ts backend/src/modules/
```

For **each module**, check:

1. **Missing Endpoints** — PRD-required endpoints not implemented
2. **Swagger Documentation** — controllers missing @ApiTags, @ApiOperation, @ApiResponse
3. **DTO Validation** — DTOs missing class-validator decorators
4. **Auth Guards** — protected routes missing @UseGuards(JwtAuthGuard)
5. **Error Handling** — services not throwing proper HTTP exceptions

### Step 4: Generate Report

Create the report directory if needed:

```bash
mkdir -p ./dev/reports
```

Write the gap analysis report to:
```
./dev/reports/gap-analysis-{YYYY-MM-DD}.md
```

The report must include:
- Executive Summary table (category, total, critical, high, medium, low)
- Per-page frontend gap analysis
- Per-module backend gap analysis
- Design system compliance matrix
- API integration status table
- Top 10 priority recommendations

### Step 5: Display Summary

Show the user:
1. The Executive Summary table
2. Total gap count by severity
3. Top 3 most critical findings
4. Path to the full report file

## Examples

### Full Scan
```
/dev:gap-finder
```
Scans frontend + backend, generates `./dev/reports/gap-analysis-2026-02-26.md`.

### Frontend Only
```
/dev:gap-finder frontend
```
Scans only `frontend/app/` pages and components for design, icon, and UI state gaps.

### Backend Only
```
/dev:gap-finder backend
```
Scans only `backend/src/` modules for missing endpoints, validation, and documentation gaps.

## Error Handling

- If PRD file is missing: warn and continue with available docs
- If no page/module files found: report "No files found for scope: {scope}"
- If report directory creation fails: save to current directory instead

## Related

- [gap-finder agent](../../agents/gap-finder.md)
- [gap-finder skill](../../skills/gap-finder/SKILL.md)
- [code-architecture-reviewer agent](../../agents/code-architecture-reviewer.md)
- [api-integration-agent](../../agents/api-integration-agent.md)
