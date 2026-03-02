# /create-project

Create a new ReviewBoard project with auto-provisioned client credentials.

## Usage
```
/create-project [project-name] [slack-channel]
```

## Arguments
- `project-name` (required): Name for the new project
- `slack-channel` (optional): Slack channel for feedback notifications (without # prefix)

## Steps

1. Call the backend API to create the project:
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -H "Cookie: accessToken=$ADMIN_TOKEN" \
     -d '{"name": "$ARGUMENTS[0]", "slackChannel": "$ARGUMENTS[1]"}'
   ```

2. The API will auto-provision a client account:
   - **Access ID**: `{ProjectNameCamelCase}{random 3-digit number}` (e.g., `MarketingSite882`)
   - **Password**: `Potential` (fixed, not customizable)

3. Print the credentials and access URL to the terminal:
   ```
   Project Created: {project-name}
   Client Access ID: {accessId}
   Password: Potential
   Access URL: {frontendUrl}/login
   Slack Channel: #{slack-channel}
   ```

## Example
```
/create-project "E-Commerce Mobile App" mobile-checkout-reviews
```

Output:
```
Project Created: E-Commerce Mobile App
Client Access ID: ECommerceMobileApp992
Password: Potential
Access URL: http://localhost:5173/login
Slack Channel: #mobile-checkout-reviews
```
