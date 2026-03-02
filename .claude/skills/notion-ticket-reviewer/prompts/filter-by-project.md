# Filter by Project

## Prompt Template

```
Enter plan mode - Review notion tickets
Filter: Related Project contains "[PROJECT_NAME]"
```

## Description

Filter tickets by their related project to focus on work for a specific project.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `PROJECT_NAME` | Yes | The project name to filter by (partial match supported) |

## Example Usage

### Single Project
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: Related Project contains "YourProject"
```

### Project + Status
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: Related Project contains "YourProject", Status = "Not Started"
```

### Project + Team
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: Related Project contains "YourProject", Team = "Full-Stack"
```

### Project + Priority
```
Enter plan mode - Review notion tickets for database [DATABASE_ID]
Filter: Related Project contains "YourProject", Priority = "Critical" OR "Urgent"
```

## Curl Commands

### Get API Key from .env
```bash
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
```

### Query All Tickets (then filter locally)
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Status",
      "status": {"equals": "Not Started"}
    },
    "page_size": 100
  }'
```

### Combined Filter (Status + Team)
```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {"property": "Status", "status": {"equals": "Not Started"}},
        {"property": "Team", "select": {"equals": "Full-Stack"}}
      ]
    },
    "page_size": 100
  }'
```

## API Filter Reference

### By Related Project (Relation Property)

Note: Filtering by relation requires the related page ID or a rollup property.

**Option 1: Using Rollup Property** (if available)
```json
{
  "filter": {
    "property": "Project Name",
    "rollup": {
      "any": {
        "rich_text": {
          "contains": "YourProject"
        }
      }
    }
  }
}
```

**Option 2: Post-Query Filtering**
```python
# Fetch all tickets then filter in code
tickets = query_database(database_id)
filtered = [t for t in tickets if "YourProject" in get_project_name(t)]
```

### Combined Filter
```json
{
  "filter": {
    "and": [
      {
        "property": "Status",
        "status": {
          "equals": "Not Started"
        }
      },
      {
        "property": "Team",
        "select": {
          "equals": "Full-Stack"
        }
      }
    ]
  }
}
```

## Output Format

```
Found [N] tickets for project [PROJECT_NAME]:

### By Category
#### Features
1. [HIGH] Fix user authentication flow - ID: xxx...
2. [HIGH] Implement search functionality - ID: xxx...

#### Bug Fixes
3. [HIGH] Resolve API timeout issue - ID: xxx...

#### Improvements
4. [MEDIUM] Optimize database queries - ID: xxx...
```

## Workflow Recommendations

### For Focused Development Sessions
1. **Start with project filter**: See all work for your project
2. **Narrow by priority**: Focus on Critical/Urgent first
3. **Pick a ticket**: `Fix ticket: [title]`
4. **Complete and move**: Update status, fix next ticket

### Example Session
```
User: Enter plan mode - Review notion tickets
      Filter: Related Project contains "YourProject", Status = "Not Started"

Claude: Found 15 YourProject tickets:
        [Lists tickets grouped by category]

User: Fix ticket: Fix user authentication flow

Claude: [Implements fix, updates status]

User: Fix next ticket

Claude: [Picks next high-priority ticket]
```

## Notes

- The "Related Project" property is a **relation** type
- Filtering relations directly requires knowing the related page ID
- For text-based filtering, consider adding a rollup property
- Post-query filtering works for any case

## Related

- [review-all.md](./review-all.md) - Review all tickets
- [filter-by-team.md](./filter-by-team.md) - Filter by team
- [fix-single.md](./fix-single.md) - Fix a single ticket
