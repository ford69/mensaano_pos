# Integration API — flexible line items (update)

**Endpoint:** `POST https://api.mensaanogh.com/api/integration/orders`  
**Auth:** header `X-API-Key: <CLIENT_SECRET>`

## What changed

| Before | After |
|--------|--------|
| Every line **required** a valid MongoDB `menuItemId` | Each line needs **`quantity`** and at least one of **`menuItemId`** or **`name`** |
| Unknown or invalid ids → **400** | Order is **accepted**; unmatched lines stored as **custom items** |
| No display name on stored lines | Matched lines store `menuItemId` + `name`; custom lines store `name` + optional `unitPrice` |
| Response was order only | **201** may include `_integrationWarnings` when some lines did not match the menu |

Matching order (server-side):

1. Valid ObjectId `menuItemId` → link to menu item  
2. `name` or text `menuItemId` → exact menu name, then partial name  
3. No match → custom line (`menuItemId: ""`, `name`, optional `unitPrice`)

---

## Request body

```json
{
  "externalOrderId": "wa-20260512-abc123",
  "source": "whatsapp",
  "type": "delivery",
  "customer": {
    "name": "Yaa Brazy",
    "phone": "0544023250",
    "address": "Spintex Community 18"
  },
  "items": [
    {
      "name": "Chicken Shawarma",
      "quantity": 2,
      "size": "Large",
      "note": "No onions"
    },
    {
      "menuItemId": "507f1f77bcf86cd799439011",
      "quantity": 1
    },
    {
      "name": "Special platter",
      "quantity": 1,
      "unitPrice": 85.0
    }
  ],
  "status": "pending",
  "paymentStatus": "paid",
  "specialInstructions": "Call on arrival"
}
```

### Line item fields

| Field | Required | Description |
|-------|----------|-------------|
| `quantity` | Yes | Integer ≥ 1 |
| `name` | One of `name` / `menuItemId` | Label from WhatsApp/AI; used for matching or custom storage |
| `menuItemId` | One of `name` / `menuItemId` | MongoDB id **or** menu name string to match |
| `size` | No | Size variant label when matched to menu |
| `note` | No | Line note |
| `unitPrice` | No | Per-unit price for **custom** lines (no menu match); used in totals/SMS |

### Order-level (unchanged)

- `externalOrderId` — required, unique (idempotent retries)  
- `type` — `dine-in` \| `delivery`  
- `tableNumber` — required for `dine-in`  
- `customer.name` — required  
- `status`, `paymentStatus` — required  

---

## Responses

| HTTP | Meaning |
|------|---------|
| **201** | New order created |
| **200** | Same `externalOrderId` already exists (idempotent replay) |
| **400** | Validation error; may include `itemIndex` (0-based line index) |
| **401** | Invalid/missing `X-API-Key` |
| **429** | Rate limited |
| **500** | Server error |

### 201 example (with warnings)

```json
{
  "_id": "...",
  "type": "delivery",
  "customer": { "name": "Yaa Brazy", "phone": "0544023250" },
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439011",
      "name": "Chicken Shawarma",
      "quantity": 2,
      "size": "Large",
      "note": "No onions"
    },
    {
      "menuItemId": "",
      "name": "Special platter",
      "quantity": 1,
      "unitPrice": 85
    }
  ],
  "status": "pending",
  "paymentStatus": "paid",
  "externalOrderId": "wa-20260512-abc123",
  "source": "whatsapp",
  "_integrationWarnings": [
    {
      "index": 2,
      "message": "No menu match for \"Special platter\" — stored as custom line",
      "name": "Special platter"
    }
  ]
}
```

### 400 examples

```json
{ "error": "Each item needs menuItemId and/or name", "itemIndex": 0 }
```

```json
{ "error": "Each item requires quantity >= 1", "itemIndex": 1 }
```

---

## Menu catalog (recommended)

`GET /api/integration/menu_items` with the same `X-API-Key` — use to map names to ids when possible; sending `name` alone is still supported.
