---
skill_name: notion-ticket-reviewer
applies_to_local_project_only: false
auto_trigger_regex:
    [notion ticket, review ticket, notion task, ticket reviewer, /notion-review, notion database, fix ticket, bug report]
tags: [notion, tickets, automation, review, curl, workflow, bugs]
related_skills: []
---

# Notion Ticket Reviewer

Automatically fetch, analyze, fix, and update tickets from Notion Bug Report database using Claude Code.

---

## Overview

This skill enables Claude Code to:
1. **Fetch tickets** from the Bug Report Notion database
2. **Filter** by status, priority, type, or app
3. **Analyze requirements** from ticket descriptions
4. **Implement fixes** in the codebase automatically
5. **Update ticket status** to "In Progress" → "Ready for test"
6. **Add comments** with implementation details

---

## Quick Start

### Review All Tickets
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
```

### Review New Bugs Only
```
Enter plan mode - Review notion tickets for database [DATABASE_ID] with status New
```

### Fix a Single Ticket
```
Fix ticket: <ticket title>
```
or
```
Fix ticket: <page-id>
```

### Filter by App
```
Enter plan mode - Review notion tickets
Filter: App = "<app-name>", Status = "New"
```

---

## Workflow: One-by-One Ticket Fixing

### Step 1: List Tickets
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
```
- Shows all "New" tickets
- Grouped by type (Bug, Feature, etc.)
- Displays: Priority, App, Pages, Title, ID

### Step 2: Select & Start Ticket
```
Fix ticket: [ticket title or ID]
```
- Sets status to **"In Progress"**
- Analyzes ticket requirements
- Explores relevant codebase files

### Step 3: Implement
Claude will:
- Read relevant files based on ticket description and pages
- Make necessary code changes
- Follow project coding standards
- Run tests if applicable

### Step 4: Complete
After implementation:
- Sets status to **"Ready for test"**
- Adds Dev's Comment with:
  - Files modified
  - Changes made
  - Testing notes
- Optionally creates git commit

### Step 5: Next Ticket
```
Fix next ticket
```
or select another ticket by name/ID

---

## Database Schema (Bug Report)

### Core Properties

| Property | Type | Values |
|----------|------|--------|
| **Title** | title | Bug/issue name |
| **Status** | status | Need Urgent Fix, New, Checked, In Progress, Need to discuss, Client Rejected, Test Failed, Not Bug, Ready for test, Test Done |
| **Priority** | select | 0. Highest, 1. High, 2. Medium, 3. Low |
| **Type** | multi_select | Bug, Feature, Improvement, Task |
| **Description** | rich_text | Detailed bug description |

### Location Properties

| Property | Type | Purpose |
|----------|------|---------|
| **App / Dashboard** | multi_select | Your app names (customize per project) |
| **Pages** | rich_text | Affected pages (e.g., `/users`, `/dashboard/settings`) |

### Assignment Properties

| Property | Type | Purpose |
|----------|------|---------|
| **Reported by** | relation | Person who reported the issue |
| **Responsible for** | relation | Person assigned to fix |
| **Done by** | relation | Person who completed the fix |

### Additional Properties

| Property | Type | Purpose |
|----------|------|---------|
| **Dev's Comment** | rich_text | Developer implementation notes |
| **Difficulty** | select | Estimated complexity |
| **Image, Video** | files | Screenshots/attachments |
| **Due Date** | date | Deadline |
| **Created time** | created_time | When ticket was created |

---

## Status Values

### To-do Group (red)
| Status | Color | Description |
|--------|-------|-------------|
| **Need Urgent Fix** | red | Critical bug, must fix immediately |
| **New** | red | Newly reported, ready to be fixed |

### In Progress Group
| Status | Color | Description |
|--------|-------|-------------|
| **Checked** | gray | Reviewed by developer |
| **In Progress** | blue | Currently being worked on |
| **Need to discuss** | orange | Requires team discussion |
| **Client Rejected** | red | Client did not accept the fix |
| **Test Failed** | red | QA testing failed |

### Complete Group (green)
| Status | Color | Description |
|--------|-------|-------------|
| **Not Bug** | blue | Not a bug, expected behavior |
| **Ready for test** | green | Fix complete, ready for QA |
| **Test Done** | green | QA verified and passed |

---

## Priority Values

| Priority | Color | Description |
|----------|-------|-------------|
| **0. Highest** | red | Critical, fix immediately |
| **1. High** | brown | Fix this sprint |
| **2. Medium** | yellow | Fix when possible |
| **3. Low** | pink | Nice to have |

---

## Filter Examples

### By Status
```python
filter = {
    "property": "Status",
    "status": {"equals": "New"}
}
```

### By Priority
```python
filter = {
    "property": "Priority",
    "select": {"equals": "High"}
}
```

### By Type
```python
filter = {
    "property": "Type",
    "multi_select": {"contains": "Bug"}
}
```

### By App
```python
filter = {
    "property": "App / Dashboard",
    "multi_select": {"contains": "<app-name>"}
}
```

### Combined Filters
```python
filter = {
    "and": [
        {"property": "Status", "status": {"equals": "New"}},
        {"property": "Type", "multi_select": {"contains": "Bug"}},
        {"property": "App / Dashboard", "multi_select": {"contains": "<app-name>"}}
    ]
}
```

---

## API Reference

### Query Database
```bash
curl -s -X POST "https://api.notion.com/v1/databases/DATABASE_ID/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "Status", "status": {"equals": "New"}}}'
```

### Update Ticket Status
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/PAGE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "In Progress"}}}}'
```

### Add Dev's Comment
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/PAGE_ID" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Dev'\''s Comment": {"rich_text": [{"text": {"content": "Fix implemented"}}]}}}'
```

### Add Page Comment
```bash
curl -s -X POST "https://api.notion.com/v1/comments" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"parent": {"page_id": "PAGE_ID"}, "rich_text": [{"text": {"content": "Implementation complete"}}]}'
```

---

## Prerequisites

### 1. Notion API Key
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create new integration
3. Copy the Internal Integration Secret (starts with `ntn_` or `secret_`)

### 2. Add to .env File
Add your API key to the project's `.env` file:
```
NOTION_API_KEY=ntn_your_key_here
```

### 3. Share Database
1. Open your Notion database
2. Click "..." → "Add connections"
3. Select your integration

### 4. Test Connection
```bash
curl -s -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

---

## Troubleshooting

### "API token is invalid"
1. Check `NOTION_API_KEY` in `.env` file
2. Verify key starts with `ntn_` or `secret_`
3. Regenerate key at notion.so/my-integrations if needed

### "Database not found"
1. Verify database ID is correct (32 hex chars)
2. Ensure integration has access to the database
3. Re-share database with integration

### "Status update failed"
1. Verify "Status" property exists
2. Check status option names match exactly: Need Urgent Fix, New, Checked, In Progress, Need to discuss, Client Rejected, Test Failed, Not Bug, Ready for test, Test Done
3. Ensure property type is "Status" (not "Select")

### Test curl connection
```bash
curl -s -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

---

## Related Files

- `databases/example-config.json` - Database configuration
- `prompts/review-tickets.md` - Review tickets via curl
- `prompts/update-ticket.md` - Update ticket status via curl
- `prompts/fix-single.md` - Fix single ticket prompt
- `prompts/fix-all-by-status.md` - Fix all tickets by status
- `prompts/filter-by-app.md` - Filter by app prompt
- `prompts/filter-by-project.md` - Filter by project prompt

---

## Example Session

```
User: Enter plan mode - Review notion tickets for database [DATABASE_ID] with status New

Claude: Found 6 tickets with "New" status:

### Bugs
1. [<app>] /users - Login redirect issue - #2
2. [<app>] /dashboard - Calendar gap between elements - #3
3. [<app>] /settings - Form validation error - #4

### UI Issues
4. [<app>] /profile - Padding sizes - #5
5. [<app>] /notifications - Toast position - #6
6. [<app>] /chat - Latest message display - #7
...

User: Fix ticket: Login redirect issue

Claude:
1. Setting status to "In Progress"...
2. Reading ticket description: "After login, user should redirect to dashboard."
3. Affected page: /users
4. Exploring codebase for login routing...
5. Found: <frontend>/src/pages/auth/...
6. Implementing fix...
7. Setting status to "Ready for test"
8. Adding Dev's Comment with implementation details

Done! Ticket ready for QA verification.
```
