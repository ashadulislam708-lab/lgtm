# Fix All Tickets by Status

## Prompt Template

```
Fix all tickets with status "[STATUS]" for database [DATABASE_ID]
```

## Description

Processes and fixes all Bug Report tickets with a specific status, one by one sequentially. Each ticket goes through the full fix workflow before moving to the next.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `DATABASE_ID` | Yes | - | The Notion database ID (32-character hex string) |
| `STATUS` | No | "New" | The status to filter tickets by |

## Workflow

```
1. FETCH TICKETS
   └── Query database with status filter
   └── Sort by Priority (Critical → Low)
   └── Store ticket list

2. DISPLAY OVERVIEW
   └── Show total count
   └── List all tickets to be processed
   └── Confirm to proceed

3. FOR EACH TICKET (sequential):
   │
   ├── 3a. SET IN PROGRESS
   │   └── Update Status: "New" → "In Progress"
   │
   ├── 3b. ANALYZE
   │   └── Parse ticket title for intent
   │   └── Extract requirements from Description
   │   └── Check Pages for affected routes
   │   └── Review App / Dashboard context
   │
   ├── 3c. EXPLORE CODEBASE
   │   └── Search for files matching Pages path
   │   └── Read existing implementations
   │   └── Understand context
   │
   ├── 3d. IMPLEMENT
   │   └── Make targeted code changes
   │   └── Follow existing patterns
   │   └── Run tests if applicable
   │
   ├── 3e. COMPLETE
   │   └── Update Status: "In Progress" → "Ready for test"
   │   └── Add Dev's Comment with implementation details
   │
   └── 3f. LOG PROGRESS
       └── Mark ticket as done in progress tracker
       └── Show "[X/N] completed"

4. HANDLE ERRORS
   └── If blocked: Set status to "Not Bug", add Dev's Comment
   └── Log error and continue to next ticket (or stop)
   └── User can resume with "Continue fixing tickets"

5. FINAL SUMMARY
   └── Show total processed
   └── List completed tickets
   └── List blocked/failed tickets
   └── Suggest git commit for all changes
```

## Example Usage

### Default (New)
```
Fix all tickets with status "New" for database [DATABASE_ID]
```

### Not Bug Tickets (Retry)
```
Fix all tickets with status "Not Bug" for database [DATABASE_ID]
```

### With App Filter
```
Fix all tickets with status "New" for database [DATABASE_ID]
Filter: App = "<app-name>"
```

### Continue After Interruption
```
Continue fixing tickets
```

## Curl Commands

### Get API Key from .env
```bash
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
```

### Query Tickets by Status
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Status",
      "status": {"equals": "New"}
    },
    "sorts": [{"property": "Priority", "direction": "ascending"}],
    "page_size": 100
  }'
```

### Query with App Filter
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {"property": "Status", "status": {"equals": "New"}},
        {"property": "App / Dashboard", "multi_select": {"contains": "<app-name>"}}
      ]
    },
    "sorts": [{"property": "Priority", "direction": "ascending"}],
    "page_size": 100
  }'
```

### Set Status to In Progress
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "In Progress"}}}}'
```

### Set Status to Ready for test
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "Ready for test"}}}}'
```

### Set Status to Not Bug
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "Not Bug"}}}}'
```

### Add Dev's Comment
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Dev'\''s Comment": {"rich_text": [{"text": {"content": "[COMMENT_TEXT]"}}]}}}'
```

## Output Format

### Starting
```
Found [N] tickets with status "New":

1. #2 [<app>] /users - Login redirect issue
2. #3 [<app>] /dashboard - Widget loading issue
3. #4 [<app>] /settings - Form validation error

Starting sequential processing...
```

### Progress (Per Ticket)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/6] Processing: Login redirect issue (#2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: New → In Progress
Description: User should be redirected to dashboard after login.
Pages: /users
Analyzing...
Found relevant files: <frontend>/src/pages/auth/LoginPage.tsx
Implementing fix...
Status: In Progress → Ready for test
Dev's Comment added.

[1/6] COMPLETED
```

### Final Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BATCH PROCESSING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 6 tickets processed

Ready for test (5):
  - #2 Login redirect issue
  - #3 Widget loading issue
  - #5 Theme toggle
  - #6 Notification preferences
  - #7 Toast position

Not Bug (1):
  - #4 Form validation (expected behavior)

Files Modified:
  - <frontend>/src/pages/auth/LoginPage.tsx
  - <frontend>/src/components/Dashboard.tsx
  - <frontend>/src/styles/theme.css

Suggested commit:
  fix: resolve multiple UI bugs (#2, #3, #5, #6, #7)
```

## Status Transitions

| From | To | Trigger |
|------|-----|---------|
| New | In Progress | Ticket picked for processing |
| Not Bug | In Progress | Ticket picked for retry |
| In Progress | Ready for test | Implementation complete |
| In Progress | Not Bug | Cannot or should not proceed |

## Options

### Stop on First Error
```
Fix all tickets with status "New" for database [DATABASE_ID]
Option: Stop on error
```

### Skip Confirmation
```
Fix all tickets with status "New" for database [DATABASE_ID]
Option: Auto-confirm
```

### Dry Run
```
Fix all tickets with status "New" for database [DATABASE_ID]
Option: Dry run (show plan only)
```

## Related

- [fix-single.md](./fix-single.md) - Fix a single ticket
- [review-all.md](./review-all.md) - Review all tickets first
- [filter-by-app.md](./filter-by-app.md) - Filter by app
- [filter-by-project.md](./filter-by-project.md) - Filter by project
