# {PROJECT_NAME}

> [Project description extracted from PROJECT_KNOWLEDGE.md]

## Features

- Feature 1 (from PROJECT_KNOWLEDGE.md Goals)
- Feature 2
- Feature 3

## Tech Stack

- **Backend**: {BACKEND}
- **Frontend**: {FRONTENDS}
- **Database**: PostgreSQL
- **Deployment**: Docker

## Architecture

```
{PROJECT_NAME}/
├── backend/              # {BACKEND} API server
[if react]
├── frontend/             # React web application
[endif]
[if dashboard]
├── dashboard/                  # Admin dashboard
[endif]
[if dashboard-admin]
├── dashboard-admin/            # Admin Dashboard
[endif]
[if dashboard-ops]
├── dashboard-ops/              # Ops Dashboard
[endif]
[if dashboard-organizer]
├── dashboard-organizer/        # Organizer Dashboard
[endif]
[if react-native]
├── mobile/               # React Native mobile app
[endif]
├── .claude/              # Claude configuration & skills
├── .claude-project/      # Project documentation
└── docker-compose.yml    # Service orchestration
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
[if django]
- Python 3.11+ (for local development)
[endif]

### Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules <repo-url>
cd {PROJECT_NAME}

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Service URLs

- **Backend API**: http://localhost:3000
[if react]
- **Frontend**: http://localhost:5173
[endif]
[if dashboard]
- **Dashboard**: http://localhost:5174
[endif]
[if dashboard-admin]
- **Admin Dashboard**: http://localhost:5174
[endif]
[if dashboard-ops]
- **Ops Dashboard**: http://localhost:5175
[endif]
[if dashboard-organizer]
- **Organizer Dashboard**: http://localhost:5176
[endif]

## Development

### Backend Development

[if nestjs]
```bash
cd backend
npm install
npm run start:dev
```
[endif]

[if django]
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```
[endif]

### Frontend Development

[if react]
```bash
cd frontend
npm install
npm run dev
```
[endif]

### Database Migrations

[if nestjs]
```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
```
[endif]

[if django]
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```
[endif]

## Documentation

- **Quick Reference**: See [CLAUDE.md](CLAUDE.md) for Claude context
- **Full Documentation**: See `.claude-project/docs/`
  - [PROJECT_KNOWLEDGE.md](.claude-project/docs/PROJECT_KNOWLEDGE.md) - Architecture
  - [PROJECT_API.md](.claude-project/docs/PROJECT_API.md) - API specs
  - [PROJECT_DATABASE.md](.claude-project/docs/PROJECT_DATABASE.md) - Database schema

## Project Structure

[if nestjs]
```
backend/
├── src/
│   ├── modules/         # Feature modules
│   ├── entities/        # TypeORM entities
│   ├── dto/             # Data transfer objects
│   └── guards/          # Auth guards
└── test/                # E2E tests
```
[endif]

[if django]
```
backend/
├── apps/                # Django apps
├── config/              # Django settings
└── tests/               # Unit & integration tests
```
[endif]

[if react]
```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── types/           # TypeScript types
└── public/              # Static assets
```
[endif]

## Testing

[if nestjs]
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```
[endif]

[if django]
```bash
cd backend
pytest                    # Run all tests
pytest --cov             # With coverage
```
[endif]

[if react]
```bash
cd frontend
npm run test             # Vitest tests
```
[endif]

## Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create feature branch from `dev`
2. Make changes and commit
3. Push and create PR to `dev`
4. After review, merge to `dev`
5. `dev` → `main` for production releases

## License

[Specify license]

---

**Generated:** {DATE}
