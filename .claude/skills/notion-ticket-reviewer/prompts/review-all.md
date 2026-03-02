# Review All Tickets

## Prompt Template

```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
```

## Description

Fetches all tickets from the Bug Report Notion database and presents them grouped by type, app, or status.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `DATABASE_ID` | Yes | The Notion database ID (32-character hex string) |

## Default Filter

- Status: **New** (ready to fix)
- Sorted by: Priority (Critical → Low)

## Output Format

```
Found [N] tickets:

### [Type: Bug]
1. #2 [<app>] /users - Title
2. #3 [<app>] /dashboard - Title

### [Type: Feature]
1. #8 [<app-2>] /admin - Title
...
```

## Example Usage

### Basic Review
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
```

### With Status Filter
```
Enter plan mode - Review notion tickets for database [DATABASE_ID] with status New
```

### With App Filter
```
Enter plan mode - Review notion tickets for database [YOUR_DATABASE_ID]
Filter: App = "<app-name>"
```

### With Type Filter
```
Enter plan mode - Review notion tickets for database [YOUR_DATABASE_ID]
Filter: Type = "Bug"
```

## Curl Commands

### Get API Key from .env
```bash
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
```

### Query Database
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

### With Type Filter
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {"property": "Status", "status": {"equals": "New"}},
        {"property": "Type", "multi_select": {"contains": "Bug"}}
      ]
    },
    "page_size": 100
  }'
```

## API Filter Reference

```json
{
  "filter": {
    "property": "Status",
    "status": {
      "equals": "New"
    }
  },
  "sorts": [
    {
      "property": "Priority",
      "direction": "ascending"
    }
  ]
}
```

## Next Steps After Review

After reviewing tickets, you can:
1. Fix a specific ticket: `Fix ticket: [title or ID]`
2. Filter further: Add app or type filter
3. Fix all: `Fix all tickets with status "New"`
4. Export: Request a summary or export

## Related

- [fix-single.md](./fix-single.md) - Fix a single ticket
- [filter-by-app.md](./filter-by-app.md) - Filter by app
- [filter-by-project.md](./filter-by-project.md) - Filter by project
