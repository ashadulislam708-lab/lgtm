# LGTM API Testing Guide

All auth guards have been removed — every endpoint works without authentication.

---

## Error-Prone & Slow Endpoints (Best for LGTM Testing)

| Endpoint | Behavior | Why It's Useful |
|----------|----------|-----------------|
| `POST /orders` | Multi-step transaction (stock check → payment → notification) | Cascading failures, distributed traces |
| `POST /payments/process` | **30% failure rate**, 500-2000ms latency | Error logs, retry patterns |
| `POST /inventory/sync` | **10% timeout**, 200-1000ms latency | Timeout metrics, slow spans |
| `POST /reports` | **2-5 second** processing time | Long traces, queue monitoring |
| `POST /products/bulk-import` | Slow for large batches | Bulk operation traces |

---

## Endpoints

### 1. POST /inventory/sync — Sync Inventory (10% timeout)

```bash
curl -X POST http://localhost:3000/inventory/sync
```

No request body needed.

---

### 2. POST /reports — Generate Report (2-5s slow)

**Sales report:**
```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sales",
    "dateFrom": "2025-01-01",
    "dateTo": "2026-03-13",
    "format": "json"
  }'
```

**Orders report:**
```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "orders",
    "dateFrom": "2025-01-01",
    "dateTo": "2026-03-13",
    "format": "json"
  }'
```

**Inventory report:**
```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inventory",
    "dateFrom": "2025-01-01",
    "dateTo": "2026-03-13",
    "format": "json"
  }'
```

| Field | Required | Values |
|-------|----------|--------|
| `type` | Yes | `sales`, `orders`, `inventory` |
| `dateFrom` | Yes | ISO date string |
| `dateTo` | Yes | ISO date string |
| `format` | No | `json` (default), `csv` |

---

### 3. POST /chaos/config — Configure Chaos Settings

**Max chaos (stress testing):**
```bash
curl -X POST http://localhost:3000/chaos/config \
  -H "Content-Type: application/json" \
  -d '{
    "paymentGateway": {
      "latencyMs": { "min": 2000, "max": 5000 },
      "failureRate": 0.5,
      "timeoutRate": 0.3
    },
    "warehouseApi": {
      "latencyMs": { "min": 1000, "max": 3000 },
      "timeoutRate": 0.4
    },
    "database": {
      "slowQueryEnabled": true,
      "slowQueryDelayMs": 1000
    },
    "queueSlowConsumer": {
      "enabled": true,
      "delayMs": 2000
    }
  }'
```

All fields are optional — send only what you want to change.

**Reset to defaults:**
```bash
curl -X POST http://localhost:3000/chaos/reset
```

**View current config:**
```bash
curl http://localhost:3000/chaos/config
```

---

### 4. POST /orders — Place Order (Cascading Transaction)

> **Note:** `productId` values are UUIDs generated at seed time. First run `GET /products` to get real IDs.

```bash
# Step 1: Get product IDs
curl http://localhost:3000/products | jq '.data[] | {id, name, sku}'

# Step 2: Place order (replace UUIDs with real ones from step 1)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productId": "<UUID-from-GET-products>", "quantity": 2 },
      { "productId": "<UUID-from-GET-products>", "quantity": 1 }
    ],
    "shippingAddress": "123 Test Street, Seoul, Korea 06100"
  }'
```

Known test product SKUs from seeder: `TEST-PROD-001`, `TEST-PROD-002`, `TEST-PROD-003`

| Field | Required | Type |
|-------|----------|------|
| `items` | Yes | Array (min 1 item) |
| `items[].productId` | Yes | UUID |
| `items[].quantity` | Yes | Integer >= 1 |
| `shippingAddress` | No | String |

---

### 5. POST /payments/process — Process Payment (30% error rate)

> **Note:** `orderId` is a UUID. First run `GET /orders` to find one with `status: pending`.

```bash
# Step 1: Get a pending order ID
curl "http://localhost:3000/orders?status=pending" | jq '.data[0].id'

# Step 2: Process payment (replace UUID)
curl -X POST http://localhost:3000/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<UUID-from-GET-orders>"
  }'
```

Known test order tracking IDs from seeder: `ORD-TEST-PENDING`, `ORD-TEST-DELIVERED`, `ORD-TEST-CANCELLED`, `ORD-TEST-PROCESSING`

| Field | Required | Type |
|-------|----------|------|
| `orderId` | Yes | UUID of existing order |

---

### 6. POST /products — Create Product

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LGTM Test Speaker",
    "description": "Product for observability testing",
    "price": 99.99,
    "category": "Electronics",
    "sku": "LGTM-TEST-001",
    "stockQuantity": 50,
    "isActive": true
  }'
```

| Field | Required | Type |
|-------|----------|------|
| `name` | Yes | String |
| `price` | Yes | Number >= 0 |
| `category` | Yes | String |
| `sku` | Yes | String (unique) |
| `description` | No | String |
| `stockQuantity` | No | Integer (default 0) |
| `imageUrl` | No | String |
| `isActive` | No | Boolean (default true) |

---

### 7. POST /products/bulk-import — Bulk Import (slow for large N)

```bash
curl -X POST http://localhost:3000/products/bulk-import \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      { "name": "Bulk Item 1", "price": 10.00, "category": "Books", "sku": "BULK-001", "stockQuantity": 100 },
      { "name": "Bulk Item 2", "price": 20.00, "category": "Books", "sku": "BULK-002", "stockQuantity": 200 },
      { "name": "Bulk Item 3", "price": 30.00, "category": "Electronics", "sku": "BULK-003", "stockQuantity": 300 }
    ]
  }'
```

---

### 8. GET Endpoints (No Body Needed)

```bash
# List all orders (admin view, paginated)
curl http://localhost:3000/orders

# Get single order by ID
curl http://localhost:3000/orders/<UUID>

# List all products (paginated)
curl http://localhost:3000/products

# List all notifications
curl http://localhost:3000/notifications

# View chaos config
curl http://localhost:3000/chaos/config

# Health check
curl http://localhost:3000/health
```

---

## Testing Workflow

```bash
# 1. Crank up chaos for more errors
curl -X POST http://localhost:3000/chaos/config \
  -H "Content-Type: application/json" \
  -d '{"paymentGateway":{"failureRate":0.5},"warehouseApi":{"timeoutRate":0.4}}'

# 2. Get product IDs
PRODUCT_ID=$(curl -s http://localhost:3000/products | jq -r '.data[0].id')

# 3. Place orders (generates traces, logs, metrics)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}],\"shippingAddress\":\"123 Test St\"}"

# 4. Get the order ID and process payment (30% will fail)
ORDER_ID=$(curl -s "http://localhost:3000/orders?status=pending" | jq -r '.data[0].id')
curl -X POST http://localhost:3000/payments/process \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\"}"

# 5. Sync inventory (10% timeout)
curl -X POST http://localhost:3000/inventory/sync

# 6. Generate report (2-5s slow)
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{"type":"sales","dateFrom":"2025-01-01","dateTo":"2026-03-13","format":"json"}'

# 7. Reset chaos when done
curl -X POST http://localhost:3000/chaos/reset
```
