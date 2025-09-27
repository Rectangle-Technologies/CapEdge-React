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
