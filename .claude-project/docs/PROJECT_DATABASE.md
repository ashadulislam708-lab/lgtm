# Database Schema: LGTM (OrderFlow)

## Overview

- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Migrations**: `backend/src/database/migrations/`

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │     orders       │       │   order_items    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │──┐    │ PK id            │──┐    │ PK id            │
│    email         │  │    │ FK userId        │  │    │ FK orderId       │
│    password      │  └───>│    trackingId    │  └───>│ FK productId     │
│    name          │       │    status        │       │    quantity       │
│    phone         │       │    totalAmount   │       │    unitPrice      │
│    address       │       │    taxAmount     │       │    totalPrice     │
│    role          │       │    paymentStatus │       └──────────────────┘
│    status        │       │    correlationId │
│    lastLoginAt   │       │    createdAt     │
│    createdAt     │       └──────────────────┘
│    updatedAt     │
└──────────────────┘
        │
        │  1:N
        ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  notifications   │       │    payments      │       │  inventory_logs  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │       │ PK id            │
│ FK userId        │       │ FK orderId       │       │ FK productId     │
│    type          │       │    amount        │       │    prevQuantity  │
│    title         │       │    status        │       │    newQuantity   │
│    message       │       │    gatewayResp   │       │    source        │
│    isRead        │       │    attemptNumber │       │    discrepancy   │
│    metadata      │       │    errorMessage  │       │    syncCorrId    │
│    createdAt     │       │    processingTime│       │    createdAt     │
└──────────────────┘       │    correlationId │       └──────────────────┘
                           │    createdAt     │
┌──────────────────┐       └──────────────────┘
│    products      │
├──────────────────┤
│ PK id            │
│    name          │
│    description   │
│    price         │
│    category      │
│    sku           │
│    stockQuantity │
│    imageUrl      │
│    isActive      │
│    createdAt     │
│    updatedAt     │
└──────────────────┘
```

## Entity Relationships

### One-to-Many (1:N)

| Parent | Child | Relationship |
|--------|-------|-------------|
| users | orders | A user has many orders |
| users | notifications | A user has many notifications |
| orders | order_items | An order has many line items |
| orders | payments | An order has many payment attempts |
| products | order_items | A product appears in many order items |
| products | inventory_logs | A product has many inventory log entries |

## Tables

### users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| email | varchar(255) | No | - | Unique email address |
| password | varchar(255) | No | - | bcrypt hashed password |
| name | varchar(100) | No | - | Display name |
| phone | varchar(20) | Yes | NULL | Phone number |
| address | text | Yes | NULL | Shipping address |
| role | enum('customer','admin') | No | 'customer' | User role |
| status | enum('active','inactive') | No | 'active' | Account status |
| last_login_at | timestamp | Yes | NULL | Last login timestamp |
| created_at | timestamp | No | now() | Creation time |
| updated_at | timestamp | No | now() | Last update |

**Constraints:**
- UNIQUE (email)

### products

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| name | varchar(255) | No | - | Product name (indexed for search) |
| description | text | Yes | NULL | Product description |
| price | decimal(10,2) | No | - | Unit price |
| category | varchar(100) | No | - | Product category (indexed) |
| sku | varchar(50) | No | - | Stock keeping unit |
| stock_quantity | integer | No | 0 | Current stock level |
| image_url | varchar(500) | Yes | NULL | Product image URL |
| is_active | boolean | No | true | Soft delete flag |
| created_at | timestamp | No | now() | Creation time |
| updated_at | timestamp | No | now() | Last update |

**Constraints:**
- UNIQUE (sku)
- INDEX (name) for text search
- INDEX (category) for filtering

### orders

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| tracking_id | varchar(20) | No | - | Human-readable ID (ORD-XXXXXX) |
| user_id | uuid | No | - | FK to users |
| status | enum | No | 'pending' | pending/confirmed/processing/shipped/delivered/cancelled |
| total_amount | decimal(10,2) | No | - | Order total |
| tax_amount | decimal(10,2) | No | - | Tax amount |
| shipping_address | text | Yes | NULL | Delivery address |
| payment_status | enum | No | 'pending' | pending/processing/paid/failed |
| payment_attempts | integer | No | 0 | Number of payment attempts |
| correlation_id | uuid | No | - | Distributed tracing correlation ID |
| created_at | timestamp | No | now() | Creation time (indexed) |
| updated_at | timestamp | No | now() | Last update |

**Constraints:**
- UNIQUE (tracking_id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX (user_id) for user order lookups
- INDEX (created_at) for date range queries

### order_items

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| order_id | uuid | No | - | FK to orders |
| product_id | uuid | No | - | FK to products |
| quantity | integer | No | - | Quantity ordered (> 0) |
| unit_price | decimal(10,2) | No | - | Price at time of order |
| total_price | decimal(10,2) | No | - | quantity * unit_price |

**Constraints:**
- FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
- FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
- INDEX (order_id)

### payments

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| order_id | uuid | No | - | FK to orders |
| amount | decimal(10,2) | No | - | Payment amount |
| status | enum | No | - | pending/success/failed/timeout |
| gateway_response | jsonb | Yes | NULL | Simulated gateway response |
| attempt_number | integer | No | - | Which attempt this is |
| error_message | varchar(500) | Yes | NULL | Error details if failed |
| processing_time | integer | Yes | NULL | Processing duration in ms |
| correlation_id | uuid | No | - | Links to order's correlation ID |
| created_at | timestamp | No | now() | Creation time |

**Constraints:**
- FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
- INDEX (order_id)

### notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | FK to users |
| type | enum | No | - | order_placed/payment_success/payment_failed/order_shipped/inventory_alert |
| title | varchar(255) | No | - | Notification title |
| message | text | No | - | Notification body |
| is_read | boolean | No | false | Read status |
| metadata | jsonb | Yes | NULL | Related entity IDs |
| created_at | timestamp | No | now() | Creation time (indexed) |

**Constraints:**
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX (user_id)
- INDEX (created_at)

### inventory_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| product_id | uuid | No | - | FK to products |
| previous_quantity | integer | No | - | Stock before change |
| new_quantity | integer | No | - | Stock after change |
| source | enum | No | - | manual/sync/order/bulk_import |
| discrepancy | integer | Yes | NULL | Difference during sync |
| sync_correlation_id | uuid | Yes | NULL | Links to sync operation |
| created_at | timestamp | No | now() | Creation time |

**Constraints:**
- FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE

## Seed Data

| Entity | Count | Notes |
|--------|-------|-------|
| Users (Customer) | 50 | Varied registration dates |
| Users (Admin) | 3 | Pre-seeded |
| Products | 150 | Across 8-10 categories |
| Orders | 1,500 | Various statuses, 6 months range |
| OrderItems | 4,000+ | 2-5 items per order |
| Payments | 1,800 | Includes retries and failures |
| Notifications | 3,000+ | Mixed read/unread |
| InventoryLogs | 500 | Sync history records |

## Migrations

```bash
# Generate migration
cd backend
npm run migration:generate -- MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

**Last Updated:** 2026-03-07
