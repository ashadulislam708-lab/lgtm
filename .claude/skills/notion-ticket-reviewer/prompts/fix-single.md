# Fix Single Ticket

## Prompt Template

```
Fix ticket: [TICKET_TITLE_OR_ID]
```

## Description

Analyzes a single Bug Report ticket, implements the fix in the codebase, and updates the ticket status with implementation details.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `TICKET_TITLE_OR_ID` | Yes | The ticket title (partial match) or page ID |

## Workflow

```
1. FIND TICKET
   └── Search by title or ID via curl
   └── Fetch ticket details from Notion API

2. SET IN PROGRESS
   └── Update Status via curl: "New" → "In Progress"

3. ANALYZE
   └── Parse ticket title for intent
   └── Extract requirements from Description
   └── Identify affected Pages (e.g., /users, /dashboard/settings)
   └── Check App / Dashboard context
   └── Review attached images/screenshots

4. EXPLORE CODEBASE
   └── Search for files matching Pages path
   └── Read existing implementations
   └── Understand context

5. IMPLEMENT
   └── Make targeted code changes
   └── Follow existing patterns
   └── Run tests if applicable

6. COMPLETE
   └── Update Status via curl: "In Progress" → "Ready for test"
   └── Add Dev's Comment with implementation details
   └── Suggest git commit message
```

## Curl Commands

### Get API Key from .env
```bash
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
```

### Search for Ticket by Title
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "Title", "title": {"contains": "[SEARCH_TERM]"}}}'
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

### Add Dev's Comment
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Dev'\''s Comment": {"rich_text": [{"text": {"content": "[COMMENT_TEXT]"}}]}}}'
```

### Add Page Comment
```bash
curl -s -X POST "https://api.notion.com/v1/comments" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"parent": {"page_id": "[PAGE_ID]"}, "rich_text": [{"text": {"content": "[COMMENT_TEXT]"}}]}'
```

## Example Usage

### By Title
```
Fix ticket: <ticket title>
```

### By ID
```
Fix ticket: <page-id>
```

### With Context
```
Fix ticket: <ticket title>
Context: <additional context for the fix>
```

## Output Format

### Success
```
Ticket Fixed: <ticket title> (#<number>)
Status: New → In Progress → Ready for test

App: <app-name>
Pages: /<page-path>

Files Modified:
- <frontend>/src/pages/<module>/Layout.tsx
- <frontend>/src/components/<Component>.tsx

Changes:
- <description of change 1>
- <description of change 2>

Dev's Comment Added: Yes
Commit Suggested: fix: <commit message>
```

### Not Bug
```
Ticket Blocked: [Title]
Status: New → Not Bug

Reason: This is expected behavior per design spec

Action Required:
- Confirm with design team
- Update ticket description if needed

Dev's Comment Added: Yes (with explanation)
```

## Status Transitions

| From | To | Trigger |
|------|-----|---------|
| New | In Progress | `Fix ticket:` command |
| In Progress | Ready for test | Implementation complete |
| In Progress | Not Bug | Cannot or should not proceed |
| Not Bug | In Progress | Decision reversed |
| Ready for test | Test Done | QA verification passed |
| Ready for test | Test Failed | QA verification failed |

## Comment Template

When completing a ticket, the Dev's Comment is updated:

```
## Fix Implemented

**Files Modified:**
- [file1.ts]
- [file2.tsx]

**Changes:**
- [Change 1 description]
- [Change 2 description]

**Pages Affected:** [/<page>, /<page>/detail]

**Testing:**
- [Test notes or N/A]

**Commit:** `fix: [commit message suggestion]`

---
*Updated by Claude Code*
```

## Related

- [review-tickets.md](./review-tickets.md) - Review all tickets
- [update-ticket.md](./update-ticket.md) - Update ticket status
- [fix-all-by-status.md](./fix-all-by-status.md) - Fix all tickets by status
- [../../../commands/fix-ticket.md](../../../commands/fix-ticket.md) - Full command documentation
