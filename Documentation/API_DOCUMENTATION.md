# 🔌 API Documentation - Smart Visitor Tracking System

*Complete API reference for developers and integrators*

---

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Visitor Management APIs](#visitor-management-apis)
4. [Admin Management APIs](#admin-management-apis)
5. [Appeal System APIs](#appeal-system-apis)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [SDK Examples](#sdk-examples)

---

## 🎯 API Overview

### Base URL
```
Production: https://your-domain.vercel.app/api
Development: http://localhost:3000/api
```

### API Standards
- **Protocol**: REST over HTTPS
- **Format**: JSON request/response
- **Authentication**: JWT tokens via HTTP-only cookies
- **Versioning**: URL path versioning (future: `/api/v1/`)
- **Rate Limiting**: 100 requests per 15 minutes per IP

### Response Format
```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// Error Response
interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}
```

---

## 🔐 Authentication

### Admin Login
Authenticate admin user and receive JWT token.

**Endpoint**: `POST /api/admin/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "your_secure_password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "admin",
      "username": "admin",
      "role": "super_admin"
    },
    "expiresAt": "2025-01-04T07:20:00.000Z"
  },
  "message": "Login successful",
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

**Headers Set**:
```
Set-Cookie: admin_token=<jwt_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

### Verify Authentication
Verify current admin session.

**Endpoint**: `GET /api/admin/verify`

**Headers Required**:
```
Cookie: admin_token=<jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "admin",
      "username": "admin",
      "role": "super_admin"
    },
    "isValid": true
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

---

## 👥 Visitor Management APIs

### Track Visitor Activity
Record visitor activity and device information.

**Endpoint**: `POST /api/visitors/track`

**Authentication**: None required

**Request Body**:
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "fingerprint": {
    "os": "Windows 11",
    "browser": "Chrome 120.0.0.0",
    "device": "Desktop",
    "screenResolution": "1920x1080",
    "timezone": "Asia/Calcutta",
    "language": "en-US"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visitor": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "visitCount": 5,
      "isNewVisitor": false,
      "lastVisit": "2025-01-03T07:20:00.000Z"
    }
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Get Visitors List
Retrieve paginated list of visitors with filtering options.

**Endpoint**: `GET /api/visitors/list`

**Authentication**: Admin required

**Query Parameters**:
```
limit: number = 50          // Results per page (max 100)
offset: number = 0          // Pagination offset
status: string              // Filter: 'active', 'banned', or omit for all
sortBy: string = 'lastVisit' // Sort field: 'lastVisit', 'firstVisit', 'visitCount'
sortOrder: string = 'desc'   // Sort order: 'asc' or 'desc'
```

**Example Request**:
```
GET /api/visitors/list?limit=25&offset=0&status=active&sortBy=lastVisit&sortOrder=desc
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visitors": [
      {
        "id": "doc_id_123",
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "status": "active",
        "firstVisit": "2025-01-01T10:00:00.000Z",
        "lastVisit": "2025-01-03T07:20:00.000Z",
        "visitCount": 15,
        "os": "Windows 11",
        "browser": "Chrome 120.0.0.0",
        "device": "Desktop",
        "ipAddress": "192.168.1.1",
        "timezone": "Asia/Calcutta",
        "language": "en-US",
        "screenResolution": "1920x1080",
        "createdAt": "2025-01-01T10:00:00.000Z",
        "updatedAt": "2025-01-03T07:20:00.000Z"
      }
    ],
    "stats": {
      "total": 1250,
      "active": 1100,
      "banned": 150,
      "filtered": 1100,
      "currentPage": 1,
      "totalPages": 44,
      "hasMore": true
    },
    "pagination": {
      "limit": 25,
      "offset": 0,
      "hasMore": true
    }
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Bulk Visitor Operations
Perform bulk operations on multiple visitors.

**Endpoint**: `POST /api/visitors/list`

**Authentication**: Admin required

**Request Body**:
```json
{
  "action": "ban",  // 'ban', 'unban', or 'delete'
  "uuids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "banReason": "Suspicious activity detected",
  "adminId": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Bulk ban operation completed",
    "results": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "action": "banned",
        "success": true
      },
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440001",
        "action": "banned",
        "success": true
      }
    ],
    "processedCount": 2
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Update Visitor Status
Update individual visitor status.

**Endpoint**: `POST /api/visitors/status`

**Authentication**: Admin required

**Request Body**:
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "banned",  // 'active' or 'banned'
  "banReason": "Violation of terms of service",
  "adminId": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visitor": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "status": "banned",
      "banReason": "Violation of terms of service",
      "banTimestamp": "2025-01-03T07:20:00.000Z",
      "bannedBy": "admin"
    }
  },
  "message": "Visitor status updated successfully",
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Check Visitor Status
Check if a visitor is banned (used by ban gate).

**Endpoint**: `GET /api/visitors/status?uuid=<visitor_uuid>`

**Authentication**: None required

**Query Parameters**:
```
uuid: string (required)  // Visitor UUID to check
```

**Response (Active Visitor)**:
```json
{
  "success": true,
  "data": {
    "status": "active",
    "isBanned": false
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

**Response (Banned Visitor)**:
```json
{
  "success": true,
  "data": {
    "status": "banned",
    "isBanned": true,
    "banReason": "Violation of terms of service",
    "banTimestamp": "2025-01-03T07:20:00.000Z",
    "canAppeal": true
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

---

## 📧 Appeal System APIs

### Submit Ban Appeal
Allow banned users to submit an appeal.

**Endpoint**: `POST /api/contact/ban-appeal`

**Authentication**: None required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Appeal for wrongful ban",
  "message": "I believe I was banned by mistake. I was just browsing the portfolio and didn't do anything wrong. Please review my case.",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "banReason": "Suspicious activity detected"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "appeal": {
      "id": "appeal_123",
      "status": "pending",
      "submittedAt": "2025-01-03T07:20:00.000Z"
    }
  },
  "message": "Your appeal has been submitted successfully. We will review it within 24-48 hours.",
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Update Appeal Status
Admin endpoint to review and update appeal status.

**Endpoint**: `PUT /api/contact/ban-appeal`

**Authentication**: Admin required

**Request Body**:
```json
{
  "appealId": "appeal_123",
  "status": "approved",  // 'approved', 'rejected', or 'pending'
  "reviewNotes": "Appeal approved. Ban was indeed a false positive.",
  "reviewedBy": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "appeal": {
      "id": "appeal_123",
      "status": "approved",
      "reviewedAt": "2025-01-03T07:20:00.000Z",
      "reviewedBy": "admin",
      "reviewNotes": "Appeal approved. Ban was indeed a false positive."
    }
  },
  "message": "Appeal status updated successfully",
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### Get Appeals List
Retrieve list of ban appeals for admin review.

**Endpoint**: `GET /api/contact/ban-appeal`

**Authentication**: Admin required

**Query Parameters**:
```
status: string     // Filter: 'pending', 'approved', 'rejected', or omit for all
limit: number = 50 // Results per page
offset: number = 0 // Pagination offset
```

**Response**:
```json
{
  "success": true,
  "data": {
    "appeals": [
      {
        "id": "appeal_123",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "subject": "Appeal for wrongful ban",
        "message": "I believe I was banned by mistake...",
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "banReason": "Suspicious activity detected",
        "status": "pending",
        "submittedAt": "2025-01-03T07:20:00.000Z"
      }
    ],
    "stats": {
      "total": 25,
      "pending": 8,
      "approved": 12,
      "rejected": 5
    }
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

---

## ❌ Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details",
    "validation": "Specific validation errors"
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

### HTTP Status Codes

| Status Code | Meaning | Usage |
|-------------|---------|-------|
| **200** | OK | Successful request |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid request data |
| **401** | Unauthorized | Authentication required |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Resource already exists |
| **422** | Unprocessable Entity | Validation errors |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |

### Common Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `INVALID_CREDENTIALS` | Invalid username or password | 401 |
| `TOKEN_EXPIRED` | JWT token has expired | 401 |
| `TOKEN_INVALID` | JWT token is invalid | 401 |
| `VISITOR_NOT_FOUND` | Visitor UUID not found | 404 |
| `APPEAL_NOT_FOUND` | Appeal ID not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

### Error Examples

**Authentication Error**:
```json
{
  "success": false,
  "error": "Invalid credentials provided",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "uuid": "UUID is required",
    "status": "Status must be 'active' or 'banned'"
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

**Rate Limit Error**:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": "15 minutes",
    "retryAfter": 300
  },
  "timestamp": "2025-01-03T07:20:00.000Z"
}
```

---

## 🚦 Rate Limiting

### Rate Limit Rules

| Endpoint Category | Limit | Window | Scope |
|------------------|-------|--------|-------|
| **Public APIs** | 100 requests | 15 minutes | Per IP |
| **Admin APIs** | 500 requests | 15 minutes | Per session |
| **Tracking APIs** | 200 requests | 15 minutes | Per IP |
| **Appeal APIs** | 10 requests | 1 hour | Per IP |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704268800
X-RateLimit-Window: 900
```

### Rate Limit Implementation

```typescript
// Rate limiting middleware example
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/visitors/track': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: 'Too many tracking requests'
  },
  '/api/admin/*': {
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many admin requests'
  }
};
```

---

## 🛠️ SDK Examples

### JavaScript/TypeScript SDK

```typescript
// API Client implementation
class VisitorTrackingAPI {
  private baseURL: string;
  private adminToken?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Admin authentication
  async adminLogin(credentials: AdminCredentials): Promise<AdminResponse> {
    const response = await fetch(`${this.baseURL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new APIError(await response.json());
    }

    return response.json();
  }

  // Track visitor
  async trackVisitor(visitorData: VisitorTrackingData): Promise<VisitorResponse> {
    const response = await fetch(`${this.baseURL}/api/visitors/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visitorData)
    });

    if (!response.ok) {
      throw new APIError(await response.json());
    }

    return response.json();
  }

  // Get visitors (admin only)
  async getVisitors(params: VisitorListParams = {}): Promise<VisitorListResponse> {
    const queryString = new URLSearchParams(params as any).toString();
    
    const response = await fetch(`${this.baseURL}/api/visitors/list?${queryString}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new APIError(await response.json());
    }

    return response.json();
  }

  // Ban visitor (admin only)
  async banVisitor(uuid: string, reason: string): Promise<VisitorStatusResponse> {
    const response = await fetch(`${this.baseURL}/api/visitors/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        uuid,
        status: 'banned',
        banReason: reason,
        adminId: 'admin'
      })
    });

    if (!response.ok) {
      throw new APIError(await response.json());
    }

    return response.json();
  }

  // Submit appeal
  async submitAppeal(appealData: AppealData): Promise<AppealResponse> {
    const response = await fetch(`${this.baseURL}/api/contact/ban-appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appealData)
    });

    if (!response.ok) {
      throw new APIError(await response.json());
    }

    return response.json();
  }
}

// Usage example
const api = new VisitorTrackingAPI('https://your-domain.vercel.app');

// Track a visitor
try {
  const result = await api.trackVisitor({
    uuid: generateUUID(),
    fingerprint: {
      os: 'Windows 11',
      browser: 'Chrome 120.0.0.0',
      device: 'Desktop',
      screenResolution: '1920x1080',
      timezone: 'Asia/Calcutta',
      language: 'en-US'
    },
    ipAddress: '192.168.1.1'
  });
  
  console.log('Visitor tracked:', result.data.visitor);
} catch (error) {
  console.error('Tracking failed:', error.message);
}
```

### React Hook Implementation

```typescript
// Custom React hooks for API integration
export const useVisitorTracking = () => {
  const trackVisitor = useCallback(async (visitorData: VisitorTrackingData) => {
    try {
      const api = new VisitorTrackingAPI(process.env.NEXT_PUBLIC_API_URL!);
      return await api.trackVisitor(visitorData);
    } catch (error) {
      console.error('Visitor tracking failed:', error);
      throw error;
    }
  }, []);

  return { trackVisitor };
};

export const useAdminAPI = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: AdminCredentials) => {
    setLoading(true);
    try {
      const api = new VisitorTrackingAPI(process.env.NEXT_PUBLIC_API_URL!);
      const result = await api.adminLogin(credentials);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVisitors = useCallback(async (params?: VisitorListParams) => {
    const api = new VisitorTrackingAPI(process.env.NEXT_PUBLIC_API_URL!);
    return await api.getVisitors(params);
  }, []);

  return {
    isAuthenticated,
    loading,
    login,
    getVisitors
  };
};
```

### cURL Examples

**Track Visitor**:
```bash
curl -X POST https://your-domain.vercel.app/api/visitors/track \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "fingerprint": {
      "os": "Windows 11",
      "browser": "Chrome 120.0.0.0",
      "device": "Desktop",
      "screenResolution": "1920x1080",
      "timezone": "Asia/Calcutta",
      "language": "en-US"
    },
    "ipAddress": "192.168.1.1"
  }'
```

**Admin Login**:
```bash
curl -X POST https://your-domain.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "admin",
    "password": "your_secure_password"
  }'
```

**Get Visitors (with auth)**:
```bash
curl -X GET "https://your-domain.vercel.app/api/visitors/list?limit=25&status=active" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## 📊 API Performance Metrics

### Response Time Targets

| Endpoint Category | Target Response Time | 95th Percentile |
|------------------|---------------------|-----------------|
| **Visitor Tracking** | < 200ms | < 500ms |
| **Admin Operations** | < 500ms | < 1000ms |
| **Data Retrieval** | < 300ms | < 800ms |
| **Real-time Updates** | < 100ms | < 200ms |

### Monitoring Implementation

```typescript
// API performance monitoring
class APIMonitor {
  static async trackRequest(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number
  ) {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow API request: ${method} ${endpoint} took ${duration}ms`);
    }
    
    // Send metrics to monitoring service
    await this.sendMetric('api_request_duration', duration, {
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }
}
```

---

*This API documentation provides comprehensive technical details for developers integrating with or maintaining the Smart Visitor Tracking System. All endpoints are production-ready with proper error handling, validation, and security measures.*