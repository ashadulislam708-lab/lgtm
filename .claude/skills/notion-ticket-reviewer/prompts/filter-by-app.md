# Filter by App / <app-name-2>

## Prompt Template

```
Enter plan mode - Review notion tickets
Filter: App = "<app-name>", Status = "New"
```

## Description

Filter Bug Report tickets by App / <app-name-2> to see issues relevant to a specific application.

## Available Apps

| App | Description |
|-----|-------------|
| **\<app-1\>** | Your first application (customize per project) |
| **\<app-2\>** | Your second application (customize per project) |
| **\<app-3\>** | Additional app (customize per project) |

> **Note:** App values are project-specific. Check your Notion database "App / <app-name-2>" property for actual values.

## Example Usage

### Single App
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: App = "<app-name>", Status = "New"
```

### Another App
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: App = "<app-name-2>"
```

### Multiple Apps
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: App = "<app-1>" OR App = "<app-2>"
```

### App + Type
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: App = "<app-name>", Type = "Bug"
```

## Curl Commands

### Get API Key from .env
```bash
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
```

### Filter by Single App
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {"property": "App / <app-name-2>", "multi_select": {"contains": "<app-name>"}},
        {"property": "Status", "status": {"equals": "New"}}
      ]
    },
    "page_size": 100
  }'
```

### Filter by Multiple Apps
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {
          "or": [
            {"property": "App / <app-name-2>", "multi_select": {"contains": "<app-name>"}},
            {"property": "App / <app-name-2>", "multi_select": {"contains": "<app-name-2>"}}
          ]
        },
        {"property": "Status", "status": {"equals": "New"}}
      ]
    },
    "page_size": 100
  }'
```

## API Filter Reference

### Single App
```json
{
  "filter": {
    "and": [
      {
        "property": "App / <app-name-2>",
        "multi_select": {
          "contains": "<app-name>"
        }
      },
      {
        "property": "Status",
        "status": {
          "equals": "New"
        }
      }
    ]
  }
}
```

### Multiple Apps
```json
{
  "filter": {
    "and": [
      {
        "or": [
          {"property": "App / <app-name-2>", "multi_select": {"contains": "<app-name>"}},
          {"property": "App / <app-name-2>", "multi_select": {"contains": "<app-name-2>"}}
        ]
      },
      {
        "property": "Status",
        "status": {
          "equals": "New"
        }
      }
    ]
  }
}
```

## Output Format

```
Found [N] tickets for app <app-name>:

### /users (3 issues)
1. #2 Login redirect issue
2. #3 Profile update error
3. #4 Form validation

### /dashboard (1 issue)
4. #7 Widget loading

### /settings (2 issues)
5. #5 Theme toggle
6. #6 Notification preferences
```

## Common Use Cases

### Daily Bug Triage
```
Enter plan mode - Review notion tickets
Filter: App = "<app-name>", Status = "New", Type = "Bug"
```

### Secondary App Issues
```
Enter plan mode - Review notion tickets
Filter: App = "<app-name-2>", Status = "New"
```

### All Frontend Issues
```
Enter plan mode - Review notion tickets
Filter: App = "<app-1>" OR App = "<app-2>" OR App = "<app-3>"
```

### Ready for Test Issues
```
Enter plan mode - Review notion tickets
Filter: App = "<app-name>", Status = "Ready for test"
```

## Related

- [review-all.md](./review-all.md) - Review all tickets
- [filter-by-project.md](./filter-by-project.md) - Filter by project
