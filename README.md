# CapEdge

CapEdge is all-in-one platform to maintain your stock trading records and generating comprehensive reports.

## API Specs

---

### Base URL

| Environment | URL |
|-------------|-----|
| Production  | `https://api.capedge.com/v1` |
| Development | `http://localhost:4000/` |

---

### Authentication Endpoints

#### POST /auth/login

Authenticate user with username and password.

**Request Body:**

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "string"
}
```

**Errors:**

- `401` - Invalid credentials
- `422` - Validation errors

---

#### POST /auth/validate-token

Validate current authentication token.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response Valid Token:**

```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "message": "Token is valid"
}
```

**Response Invalid/Expired Token:**

```json
{
  "success": true,
  "data": {
    "valid": false
  },
  "message": "Token expired or is invalid"
}
```

---

### Broker Management Endpoints

#### GET /brokers

Retrieve all brokers or search by name.

**Query Parameters:**

- `name` (optional): Search brokers by name
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Zerodha",
      "panNumber": "AAAAA0000A",
      "address": "Bangalore, Karnataka",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "Brokers retrieved successfully"
}
```

#### POST /brokers

Create a new broker.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "panNumber": "string (required, format: ABCDE1234F)",
  "address": "string (required, min 10 chars)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Zerodha",
    "panNumber": "AAAAA0000A",
    "address": "Bangalore, Karnataka",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Broker created successfully"
}
```

#### PUT /brokers/:id

Update an existing broker.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "panNumber": "string (required, format: ABCDE1234F)",
  "address": "string (required, min 10 chars)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Zerodha Updated",
    "panNumber": "AAAAA0000A",
    "address": "Bangalore, Karnataka",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  },
  "message": "Broker updated successfully"
}
```

#### DELETE /brokers/:id

Delete a broker.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Broker deleted successfully"
}
```

**Errors:**

- `400` - Broker has associated accounts
- `404` - Broker not found
- `422` - Validation errors

---

### Securities Management Endpoints

#### GET /securities

Retrieve all securities or search by name.

**Query Parameters:**

- `name` (optional): Search securities by name
- `type` (optional): Filter by security type (EQUITY, FUTURES, OPTIONS, COMMODITY, CURRENCY, BOND, ETF, MUTUAL_FUND)
- `exchangeId` (optional): Filter by stock exchange ID
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Reliance Industries Ltd",
      "type": "EQUITY",
      "strikePrice": null,
      "expiry": null,
      "stockExchangeId": 1,
      "stockExchange": {
        "id": 1,
        "name": "NSE (National Stock Exchange)",
        "code": "NSE"
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "NIFTY 50 JAN 2024 CE 18000",
      "type": "OPTIONS",
      "strikePrice": 18000.00,
      "expiry": "2024-01-25T00:00:00.000Z",
      "stockExchangeId": 1,
      "stockExchange": {
        "id": 1,
        "name": "NSE (National Stock Exchange)",
        "code": "NSE"
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "Securities retrieved successfully"
}
```

#### POST /securities

Create a new security.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "type": "string (required, enum: EQUITY|FUTURES|OPTIONS|COMMODITY|CURRENCY|BOND|ETF|MUTUAL_FUND)",
  "strikePrice": "number (nullable, min 0, max 2 decimal places, required for OPTIONS/FUTURES)",
  "expiry": "string (nullable, ISO date, required for OPTIONS/FUTURES, must be future date)",
  "stockExchangeId": "number (required)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Reliance Industries Ltd",
    "type": "EQUITY",
    "strikePrice": null,
    "expiry": null,
    "stockExchangeId": 1,
    "stockExchange": {
      "id": 1,
      "name": "NSE (National Stock Exchange)",
      "code": "NSE"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Security created successfully"
}
```

#### PUT /securities/:id

Update an existing security.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** Same as POST

**Response (200):** Same structure as POST with updated timestamps

#### DELETE /securities/:id

Delete a security.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Security deleted successfully"
}
```

**Errors:**

- `400` - Security has associated transactions
- `404` - Security not found
- `422` - Validation errors

---

### Stock Exchanges Endpoints

#### GET /stock-exchanges

Retrieve all stock exchanges.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "NSE (National Stock Exchange)",
      "code": "NSE"
    },
    {
      "id": 2,
      "name": "BSE (Bombay Stock Exchange)",
      "code": "BSE"
    }
  ],
  "message": "Stock exchanges retrieved successfully"
}
```

---

### User Account Management Endpoints

#### GET /user-accounts

Retrieve all user accounts with their demat accounts.

**Query Parameters:**

- `name` (optional): Search user accounts by name
- `includeDematAccounts` (optional): Include demat accounts in response (default: true)
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "panNumber": "ABCDE1234F",
      "address": "123 Main Street, Mumbai, Maharashtra 400001",
      "dematAccounts": [
        {
          "id": 1,
          "userAccountId": 1,
          "brokerId": 1,
          "balance": 50000.00,
          "broker": {
            "id": 1,
            "name": "Zerodha",
            "panNumber": "AAAAA0000A"
          },
          "createdAt": "2025-01-01T00:00:00.000Z",
          "updatedAt": "2025-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "User accounts retrieved successfully"
}
```

#### POST /user-accounts

Create a new user account.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "string (required, min 2 chars)",
  "panNumber": "string (required, format: ABCDE1234F)",
  "address": "string (required, min 10 chars)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "panNumber": "ABCDE1234F",
    "address": "123 Main Street, Mumbai, Maharashtra 400001",
    "dematAccounts": [],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "User account created successfully"
}
```

#### PUT /user-accounts/:id

Update an existing user account.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** Same as POST

**Response (200):** Same structure as POST with updated timestamps

#### DELETE /user-accounts/:id

Delete a user account.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

**Errors:**

- `400` - User account has associated demat accounts or transactions
- `404` - User account not found
- `422` - Validation errors

---

### Demat Account Management Endpoints

#### GET /demat-accounts

Retrieve demat accounts, optionally filtered by user account.

**Query Parameters:**

- `userAccountId` (optional): Filter by user account ID
- `brokerId` (optional): Filter by broker ID
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userAccountId": 1,
      "brokerId": 1,
      "balance": 50000.00,
      "userAccount": {
        "id": 1,
        "name": "John Doe",
        "panNumber": "ABCDE1234F"
      },
      "broker": {
        "id": 1,
        "name": "Zerodha",
        "panNumber": "AAAAA0000A"
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "Demat accounts retrieved successfully"
}
```

#### POST /demat-accounts

Create a new demat account.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "userAccountId": "number (required)",
  "brokerId": "number (required)",
  "balance": "number (required, min 0, max 2 decimal places)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "userAccountId": 1,
    "brokerId": 1,
    "balance": 50000.00,
    "userAccount": {
      "id": 1,
      "name": "John Doe",
      "panNumber": "ABCDE1234F"
    },
    "broker": {
      "id": 1,
      "name": "Zerodha",
      "panNumber": "AAAAA0000A"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Demat account created successfully"
}
```

#### PUT /demat-accounts/:id

Update an existing demat account.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** Same as POST

**Response (200):** Same structure as POST with updated timestamps

#### DELETE /demat-accounts/:id

Delete a demat account.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Demat account deleted successfully"
}
```

**Errors:**

- `400` - Demat account has associated transactions
- `404` - Demat account not found
- `422` - Validation errors

---

### Common Error Responses

All endpoints may return the following error responses:

**Validation Error (422):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

**Authentication Error (401):**

```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

**Not Found Error (404):**

```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Server Error (500):**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

### Data Export Endpoints

#### GET /brokers/export

Export brokers data to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `name` (optional): Filter by broker name

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

#### GET /securities/export

Export securities data to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `name` (optional): Filter by security name
- `type` (optional): Filter by security type

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

#### GET /user-accounts/export

Export user accounts data to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `name` (optional): Filter by user name
- `includeDematAccounts` (optional): Include demat accounts data - default: true

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers
