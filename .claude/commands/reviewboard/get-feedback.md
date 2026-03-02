# /get-feedback

Retrieve structured feedback for a ReviewBoard project and save as a markdown log.

## Usage
```
/get-feedback [project-name]
```

## Arguments
- `project-name` (required): Name of the project to retrieve feedback for

## Steps

1. Call the backend API: `GET /feedback/{project-name}`
   - If multiple versions exist, prompt user to select: latest (default), or a specific version number
   - Optional: `GET /feedback/{project-name}?version={N}` for a specific version

2. Parse the structured JSON response containing:
   - Project name and generation timestamp
   - Screens with version info
   - Pins with coordinates, status, comment text, author, and replies

3. Print a formatted feedback report to the terminal organized by screen:
   ```
   Feedback Report: E-Commerce Mobile App
   Generated: 2026-02-25 10:30:00

   Screen: Home_V2_Final (v3)
   ─────────────────────────
   Pin #1 [OPEN] @ (35.5%, 25.0%)
     "Logo alignment is off"
     — ECommApp992 • 2h ago
     └─ Reply: "Will fix in next sprint" • Admin • 1h ago

   Pin #2 [IN PROGRESS] @ (60.0%, 45.0%)
     "Button contrast is too low"
     — ECommApp992 • 5h ago
   ```

4. Auto-save the report as a markdown file:
   - Path: `.claude-project/feedback-logs/{project-slug}-{timestamp}.md`
   - Create the `feedback-logs/` directory if it doesn't exist

## Example
```
/get-feedback "E-Commerce Mobile App"
```

Output:
```
Feedback retrieved: 3 screens, 12 pins (5 open, 3 in-progress, 4 resolved)
Report saved to: .claude-project/feedback-logs/e-commerce-mobile-app-2026-02-25.md
```
