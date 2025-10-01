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

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

---

### Profit & Loss (P&L) Report Endpoints

#### GET /reports/pnl

Retrieve matched transaction records with profit and loss calculations.

**Query Parameters:**

- `startDate` (optional): Filter by sell date from (ISO date format: YYYY-MM-DD)
- `endDate` (optional): Filter by sell date to (ISO date format: YYYY-MM-DD)
- `capitalGainType` (optional): Filter by capital gain type (STCG, LTCG)
- `dematAccountId` (optional): Filter by demat account ID
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
  "data": {
    "records": [
      {
        "id": 1,
        "buyDate": "2024-01-15T00:00:00.000Z",
        "sellDate": "2024-06-20T00:00:00.000Z",
        "securityId": 1,
        "quantity": 100,
        "buyTransactionId": "TXN001",
        "sellTransactionId": "TXN002",
        "capitalGainType": "STCG",
        "profitAndLoss": 44025.00,
        "deliveryType": "Delivery",
        "security": {
          "id": 1,
          "name": "Reliance Industries",
          "type": "EQUITY"
        },
        "buyTransaction": {
          "id": "TXN001",
          "date": "2024-01-15T00:00:00.000Z",
          "price": 2450.50,
          "quantity": 100,
          "type": "BUY"
        },
        "sellTransaction": {
          "id": "TXN002",
          "date": "2024-06-20T00:00:00.000Z",
          "price": 2890.75,
          "quantity": 100,
          "type": "SELL"
        }
      }
    ],
    "summary": {
      "totalProfit": 89050.00,
      "totalLoss": 10218.75,
      "netProfitLoss": 78831.25,
      "stcg": 38806.25,
      "ltcg": 40025.00,
      "totalTrades": 5
    }
  },
  "message": "P&L records retrieved successfully"
}
```

#### GET /reports/pnl/export

Export P&L report to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `startDate` (optional): Filter by sell date from (ISO date format)
- `endDate` (optional): Filter by sell date to (ISO date format)
- `capitalGainType` (optional): Filter by capital gain type (STCG, LTCG)
- `dematAccountId` (optional): Filter by demat account ID

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

---

### Holdings Report Endpoints

#### GET /reports/holdings

Retrieve current holdings (unmatched buy transactions) with unrealized P&L.

**Query Parameters:**

- `securityName` (optional): Search holdings by security name
- `securityType` (optional): Filter by security type (EQUITY, FUTURES, OPTIONS, etc.)
- `dematAccountId` (optional): Filter by demat account ID
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
  "data": {
    "holdings": [
      {
        "id": 1,
        "buyDate": "2024-01-15T00:00:00.000Z",
        "quantity": 50,
        "price": 2450.50,
        "securityId": 1,
        "buyTransactionId": "TXN001",
        "security": {
          "id": 1,
          "name": "Reliance Industries",
          "type": "EQUITY",
          "currentPrice": 2890.75
        },
        "totalInvestment": 122525.00,
        "currentValue": 144537.50,
        "unrealizedPnL": 22012.50,
        "pnlPercentage": 17.96
      }
    ],
    "summary": {
      "totalInvestment": 568537.50,
      "currentValue": 638018.75,
      "unrealizedPnL": 69481.25,
      "pnlPercentage": 12.22,
      "totalHoldings": 6,
      "profitableHoldings": 4,
      "losingHoldings": 2
    }
  },
  "message": "Holdings retrieved successfully"
}
```

#### GET /reports/holdings/export

Export holdings report to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `securityName` (optional): Filter by security name
- `securityType` (optional): Filter by security type
- `dematAccountId` (optional): Filter by demat account ID

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

---

### Ledger Endpoints

#### GET /ledger

Retrieve ledger entries for all transactions across demat accounts.

**Query Parameters:**

- `startDate` (optional): Filter by transaction date from (ISO date format: YYYY-MM-DD)
- `endDate` (optional): Filter by transaction date to (ISO date format: YYYY-MM-DD)
- `dematAccountId` (optional): Filter by specific demat account ID
- `transactionType` (optional): Filter by transaction type (BUY, SELL, CREDIT, DEBIT)
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
  "data": {
    "entries": [
      {
        "id": 1,
        "date": "2024-09-15T00:00:00.000Z",
        "dematAccountId": 1,
        "tradeTransactionId": "TXN001",
        "transactionAmount": -245050.00,
        "balance": 754950.00,
        "dematAccount": {
          "id": 1,
          "userAccountId": 1,
          "brokerId": 1,
          "userAccount": {
            "id": 1,
            "name": "John Doe"
          },
          "broker": {
            "id": 1,
            "name": "Zerodha"
          }
        },
        "transaction": {
          "id": "TXN001",
          "date": "2024-09-15T00:00:00.000Z",
          "type": "BUY",
          "quantity": 100,
          "price": 2450.50,
          "securityId": 1,
          "deliveryType": "Delivery",
          "referenceNumber": "REF001",
          "security": {
            "id": 1,
            "name": "Reliance Industries",
            "type": "EQUITY"
          }
        },
        "remarks": "Purchase of equity shares"
      }
    ],
    "summary": {
      "totalDebits": 787868.75,
      "totalCredits": 248037.50,
      "netAmount": -539831.25,
      "totalTransactions": 8
    }
  },
  "message": "Ledger entries retrieved successfully"
}
```

#### GET /ledger/export

Export ledger data to CSV/Excel format.

**Query Parameters:**

- `format` (optional): Export format (csv, excel) - default: csv
- `startDate` (optional): Filter by transaction date from (ISO date format)
- `endDate` (optional): Filter by transaction date to (ISO date format)
- `dematAccountId` (optional): Filter by demat account ID
- `transactionType` (optional): Filter by transaction type

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers

---

### Transaction Management Endpoints

#### GET /transactions

Retrieve all transactions with filtering options.

**Query Parameters:**

- `startDate` (optional): Filter by transaction date from (ISO date format: YYYY-MM-DD)
- `endDate` (optional): Filter by transaction date to (ISO date format: YYYY-MM-DD)
- `type` (optional): Filter by transaction type (BUY, SELL)
- `securityId` (optional): Filter by security ID
- `dematAccountId` (optional): Filter by demat account ID
- `deliveryType` (optional): Filter by delivery type (Delivery, Intraday)
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
      "id": "TXN001",
      "date": "2024-09-15T00:00:00.000Z",
      "type": "BUY",
      "quantity": 100,
      "price": 2450.50,
      "securityId": 1,
      "deliveryType": "Delivery",
      "referenceNumber": "REF001",
      "dematAccountId": 1,
      "security": {
        "id": 1,
        "name": "Reliance Industries",
        "type": "EQUITY",
        "stockExchange": {
          "id": 1,
          "name": "NSE (National Stock Exchange)",
          "code": "NSE"
        }
      },
      "dematAccount": {
        "id": 1,
        "userAccountId": 1,
        "brokerId": 1,
        "broker": {
          "id": 1,
          "name": "Zerodha"
        }
      },
      "createdAt": "2024-09-15T00:00:00.000Z",
      "updatedAt": "2024-09-15T00:00:00.000Z"
    }
  ],
  "message": "Transactions retrieved successfully"
}
```

#### POST /transactions

Create a new transaction.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "date": "string (required, ISO date format)",
  "type": "string (required, enum: BUY|SELL)",
  "quantity": "number (required, min 1)",
  "price": "number (required, min 0, max 2 decimal places)",
  "securityId": "number (required)",
  "deliveryType": "string (required, enum: Delivery|Intraday)",
  "referenceNumber": "string (optional)",
  "dematAccountId": "number (required)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "TXN001",
    "date": "2024-09-15T00:00:00.000Z",
    "type": "BUY",
    "quantity": 100,
    "price": 2450.50,
    "securityId": 1,
    "deliveryType": "Delivery",
    "referenceNumber": "REF001",
    "dematAccountId": 1,
    "createdAt": "2024-09-15T00:00:00.000Z",
    "updatedAt": "2024-09-15T00:00:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

#### PUT /transactions/:id

Update an existing transaction.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** Same as POST

**Response (200):** Same structure as POST with updated timestamps

#### DELETE /transactions/:id

Delete a transaction.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

**Errors:**

- `400` - Transaction is part of matched records
- `404` - Transaction not found
- `422` - Validation errors

---

### Financial Year Configuration Endpoints

#### GET /financial-years

Retrieve all financial year configurations.

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
      "title": "FY 2024-25",
      "startDate": "2024-04-01T00:00:00.000Z",
      "lastDate": "2025-03-31T23:59:59.999Z",
      "stcgRate": 15.0,
      "ltcgRate": 10.0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Financial years retrieved successfully"
}
```

#### POST /financial-years

Create a new financial year configuration.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "string (required, e.g., 'FY 2024-25')",
  "startDate": "string (required, ISO date format)",
  "lastDate": "string (required, ISO date format)",
  "stcgRate": "number (required, min 0, max 100, represents percentage)",
  "ltcgRate": "number (required, min 0, max 100, represents percentage)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "FY 2024-25",
    "startDate": "2024-04-01T00:00:00.000Z",
    "lastDate": "2025-03-31T23:59:59.999Z",
    "stcgRate": 15.0,
    "ltcgRate": 10.0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Financial year created successfully"
}
```

**Errors:**

- `400` - Date range conflicts with existing financial year
- `422` - Validation errors

