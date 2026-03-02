# Review Notion Tickets via Curl

## Prompt Template

```
Review notion tickets for database [DATABASE_ID]
```

## Description

Review all tickets from a Notion Bug Report database using curl commands. This works independently of the MCP server and is compatible with any project.

## Prerequisites

1. **NOTION_API_KEY** must be set in one of:
   - `.env` file in project root
   - System environment variable

2. **Database must be shared** with your Notion integration

## Workflow

### Step 1: Get API Key

Read the API key from `.env` file:

```bash
# Read from .env file (Unix)
NOTION_API_KEY=$(grep -E "^NOTION_API_KEY=" .env | cut -d'=' -f2)
echo "API Key found: ${NOTION_API_KEY:0:10}..."
```

### Step 2: Test Connection

Verify the API key works:

```bash
curl -s -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

Expected response includes `"object": "user"` and workspace info.

### Step 3: Query Database

Fetch all tickets from the database:

```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"page_size": 100}'
```

### Step 4: Parse and Display

Save response to temp file and parse with Node.js:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/notion_tickets.json', 'utf8'));

const tickets = data.results.map(page => {
  const props = page.properties;
  return {
    id: page.id,
    uniqueId: props['']?.unique_id?.number || '-',
    title: props['Title']?.title?.[0]?.plain_text || 'Untitled',
    status: props['Status']?.status?.name || 'Unknown',
    priority: props['Priority']?.select?.name || 'None',
    type: props['Type']?.multi_select?.map(t => t.name).join(', ') || '-',
    app: props['App / Dashboard']?.multi_select?.map(a => a.name).join(', ') || '-',
    pages: props['Pages']?.rich_text?.[0]?.plain_text || '-',
    description: props['Description']?.rich_text?.[0]?.plain_text || '-'
  };
});

// Group by status
const byStatus = {};
tickets.forEach(t => {
  if (!byStatus[t.status]) byStatus[t.status] = [];
  byStatus[t.status].push(t);
});

console.log(`Total tickets: ${tickets.length}\n`);

// Display by status
['New', 'Fixing', 'Resolved', 'Closed', 'Won\'t Fix'].forEach(status => {
  const items = byStatus[status] || [];
  if (items.length) {
    console.log(`=== ${status} (${items.length}) ===`);
    items.forEach(t => {
      console.log(`  #${t.uniqueId} [${t.app}] ${t.pages}`);
      console.log(`       ${t.title}`);
      console.log(`       ${t.description.substring(0, 60)}...`);
    });
    console.log();
  }
});
```

## Filter Options

### By Status

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
    "page_size": 100
  }'
```

### By Type

```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Type",
      "multi_select": {"contains": "Bug"}
    },
    "page_size": 100
  }'
```

### By App

```bash
curl -s -X POST "https://api.notion.com/v1/databases/[DATABASE_ID]/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "App / Dashboard",
      "multi_select": {"contains": "<app-name>"}
    },
    "page_size": 100
  }'
```

### Combined Filters

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

## Output Format

```
Total tickets: 6

=== New (6) ===
  #2 [<app>] /users
       Login redirect issue
       User should be redirected to dashboard after login...
  #3 [<app>] /dashboard
       Widget loading issue
       Dashboard widgets take too long to load...
  #4 [<app>] /settings
       Form validation error
       Validation errors not showing correctly...

=== In Progress (0) ===

=== Ready for test (0) ===
```

## Troubleshooting

### "API token is invalid"
- Check NOTION_API_KEY is set correctly
- Verify key starts with `ntn_` or `secret_`
- Regenerate key at notion.so/my-integrations

### "Database not found"
- Verify database ID is correct (32 hex chars, no dashes)
- Ensure database is shared with your integration
- Go to database in Notion > ... > Add connections

### "Could not find property"
- Property names are case-sensitive
- Check exact property names in your database schema
- Common: "Title", "Status", "Type", "App / Dashboard", "Pages"

## Related

- [update-ticket.md](./update-ticket.md) - Update tickets via curl
- [fix-all-by-status.md](./fix-all-by-status.md) - Fix all tickets sequentially
- [fix-single.md](./fix-single.md) - Fix a single ticket
