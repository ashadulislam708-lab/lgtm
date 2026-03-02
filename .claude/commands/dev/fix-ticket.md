# Fix Ticket Command

Fix a single Notion Bug Report ticket by analyzing requirements and implementing changes.

## Usage

```
/fix-ticket [ticket-id-or-title]
```

or

```
Fix ticket: [ticket title or ID]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| ticket-id-or-title | Yes | The Notion page ID or ticket title to fix |

## Workflow

### 1. Find Ticket
- Search by ID (UUID format) or title (partial match)
- Retrieve full ticket details from Notion API

### 2. Update Status
- Set status to **"Fixing"**
- This signals to others that work has started

### 3. Analyze Requirements
Extract from ticket:
- Title: What needs to be done
- Description: Detailed requirements
- Pages: Affected routes (e.g., `/patient`, `/patient/chat`)
- App / Dashboard: Which application
- Type: Bug, Feature, etc.
- Attachments: Screenshots for context

### 4. Explore Codebase
- Search for files matching the Pages path
- Read existing implementations
- Understand current architecture

### 5. Implement Fix
- Make necessary code changes
- Follow project coding standards
- Run tests if applicable

### 6. Complete Ticket
- Set status to **"Resolved"**
- Add Dev's Comment with:
  - Files modified
  - Changes made
  - Testing notes
  - Any notes for QA

### 7. Optional: Create Commit
```
git commit -m "fix: [ticket title]

Notion Ticket: https://notion.so/[ticket-id]
"
```

## Examples

### By Title
```
Fix ticket: My profile detail page
```

### By ID
```
Fix ticket: 2e6b6d88-d2cf-8006-a54e-d420667b579f
```

### With Plan Mode
```
Enter plan mode - Fix ticket: Calendar gap between elements
```

## Status Flow

```
New → Fixing → Resolved → Closed
         ↓
      Won't Fix
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

### Set Status to Fixing
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "Fixing"}}}}'
```

### Set Status to Resolved
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "Resolved"}}}}'
```

### Set Status to Won't Fix
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"status": {"name": "Won'\''t Fix"}}}}'
```

### Add Dev's Comment
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/[PAGE_ID]" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Dev'\''s Comment": {"rich_text": [{"text": {"content": "[COMMENT_TEXT]"}}]}}}'
```

## Related

- [notion-ticket-reviewer skill](../skills/notion-ticket-reviewer/SKILL.md)
- [ticket-fixer agent](../agents/ticket-fixer.md)
