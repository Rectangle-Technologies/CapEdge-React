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
  "result": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
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

**Response (200):**

```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "message": "Token is valid"
}
```

**Errors:**

- `401` - Token expired or invalid
