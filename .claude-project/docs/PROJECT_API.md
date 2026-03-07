# API Reference: LGTM (OrderFlow)

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.lgtm.com`

## Authentication

JWT-based authentication with httpOnly cookies (browser) or Bearer token (API clients).

- `POST /auth/login` returns tokens via `Set-Cookie` headers
- Admin accounts are seeded via database migration (no public signup)

## Endpoints

### Auth

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| POST | `/auth/login` | Login user | No | FAST (<50ms) |
| POST | `/auth/register` | Register new customer | No | FAST (<50ms) |
| POST | `/auth/refresh` | Refresh access token | No | FAST (<50ms) |

### Products

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/products` | List products (paginated, filterable) | No | FAST (<50ms) |
| GET | `/products/:id` | Get product by ID | No | FAST (<50ms) |
| POST | `/products` | Create product | Admin | FAST (<50ms) |
| PUT | `/products/:id` | Update product | Admin | MEDIUM (200-500ms) |
| DELETE | `/products/:id` | Delete product | Admin | FAST (<50ms) |
| POST | `/products/bulk-import` | Bulk import products | Admin | SLOW (1-5s) |

### Orders

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| POST | `/orders` | Place order | Customer | MEDIUM (200-500ms) |
| GET | `/orders` | List orders | Customer/Admin | MEDIUM (200-500ms) |
| GET | `/orders/:id` | Get order details | Customer/Admin | FAST (<50ms) |
| PATCH | `/orders/:id/status` | Update order status | Admin | FAST (<50ms) |

### Payments

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| POST | `/payments/process` | Queue payment processing | Admin | FAST enqueue, SLOW async (1-3s) |
| GET | `/payments/:orderId/status` | Get payment status | Customer/Admin | FAST (<50ms) |

### Inventory

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/inventory` | List inventory | Admin | FAST (<50ms) |
| POST | `/inventory/sync` | Sync with warehouse | Admin | SLOW (300ms-2s) |
| PATCH | `/inventory/:productId` | Update stock | Admin | FAST (<50ms) |

### Reports

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| POST | `/reports` | Generate report | Admin | SLOW (2-5s) |
| GET | `/reports/:jobId` | Get report status/data | Admin | FAST (<50ms) |

### Notifications

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/notifications` | List notifications | Customer/Admin | FAST (<50ms) |
| PATCH | `/notifications/:id/read` | Mark as read | Customer | FAST (<50ms) |

### Users (Admin)

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/users` | List users | Admin | FAST (<50ms) |
| GET | `/users/:id` | Get user details | Admin | FAST (<50ms) |
| PATCH | `/users/:id` | Update user | Admin | FAST (<50ms) |

### Health & Observability

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/health` | Health check (DB, Redis, Queue) | No | FAST (<20ms) |
| GET | `/health/ready` | Kubernetes readiness probe | No | FAST (<10ms) |
| GET | `/health/live` | Kubernetes liveness probe | No | FAST (<5ms) |
| GET | `/metrics` | Prometheus metrics | No | FAST (<20ms) |

### Chaos Engineering (Admin)

| Method | Endpoint | Description | Auth | Performance |
|--------|----------|-------------|------|-------------|
| GET | `/chaos/config` | Get chaos configuration | Admin | FAST (<10ms) |
| POST | `/chaos/config` | Set chaos configuration | Admin | FAST (<10ms) |
| POST | `/chaos/reset` | Reset chaos to defaults | Admin | FAST (<10ms) |

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## Query Parameters (Common)

| Parameter | Description | Used By |
|-----------|-------------|---------|
| `page` | Page number (default: 1) | Products, Orders, Users, Inventory, Notifications |
| `limit` | Items per page (default: 10) | Products, Orders, Users, Inventory, Notifications |
| `search` | Text search | Products, Users |
| `category` | Filter by category | Products, Inventory |
| `status` | Filter by status | Orders, Users |
| `sortBy` | Sort field | Products |
| `sortOrder` | `asc` or `desc` | Products |

---

**Last Updated:** 2026-03-07
