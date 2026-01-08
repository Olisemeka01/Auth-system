# Role-Based Access Control (RBAC) Implementation Guide

This guide explains how to use the authentication, authorization, and role-based access control system implemented in this application.

## Overview

The authentication system includes:
- JWT-based authentication for users and clients
- Role-based access control (RBAC) with 5 hierarchical roles
- API key authentication for clients
- Custom decorators for easy authorization
- Automatic audit logging for all actions
- Standardized API response format

## Role Hierarchy

Roles are hierarchical with the following access levels:

1. **SUPER_ADMIN** (Level 5) - Full system access
2. **ADMIN** (Level 4) - Manage users and clients
3. **MANAGER** (Level 3) - Limited admin access
4. **EMPLOYEE** (Level 2) - Read-only access
5. **CLIENT** (Level 1) - Own data only

Higher-level roles inherit all permissions of lower-level roles.

## Guards

### 1. JwtAuthGuard (Global)
Protects all routes by default. Requires a valid JWT token.

**How to make a route public:**
```typescript
import { Public } from '../common/decorators';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login() {
    // No authentication required
  }
}
```

### 2. RolesGuard (Global)
Checks if users have required roles based on role hierarchy.

**Usage:**
```typescript
import { Roles } from '../common/decorators';
import { Role } from '../modules/auth/enums/role.enum';

@Controller('users')
export class UsersController {
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll() {
    // Only ADMIN and SUPER_ADMIN can access
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create() {
    // Only SUPER_ADMIN can access
  }
}
```

### 3. ApiKeyGuard
Alternative authentication for clients using API keys.

**Usage:**
```typescript
import { ApiKeyGuard } from '../common/guards';
import { UseGuards } from '@nestjs/common';

@Controller('api')
export class ApiController {
  @Get('data')
  @UseGuards(ApiKeyGuard)
  getData() {
    // Client authenticated via x-api-key header
  }
}
```

## Decorators

### @Public()
Skip JWT authentication for specific routes.

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### @Roles(...roles: string[])
Require specific roles to access a route.

```typescript
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Delete(':id')
deleteUser(@Param('id') id: string) {
  // Only SUPER_ADMIN and ADMIN can delete users
}
```

### @CurrentUser()
Inject the authenticated user into the controller method.

```typescript
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserData) {
  return {
    id: user.id,
    email: user.email,
    roles: user.roles,
  };
}

// Get specific property
@Get('email')
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## CurrentUserData Interface

```typescript
interface CurrentUserData {
  id: string;
  email: string;
  type: 'user' | 'client';
  roles: any[];
  is_active: boolean;
  is_verified: boolean;
  api_key_id?: string; // Only present when authenticated via API key
}
```

## Complete Controller Example

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Public, Roles, CurrentUser } from '../common/decorators';
import { Role } from '../modules/auth/enums/role.enum';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  // Public route - no authentication
  @Public()
  @Get('health')
  healthCheck() {
    return { success: true, message: 'Service is healthy' };
  }

  // All authenticated users can access
  @Get('profile')
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      success: true,
      data: user,
    };
  }

  // Only MANAGER and above can view all users
  @Get()
  @ApiBearerAuth()
  @Roles(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  async findAll() {
    return {
      success: true,
      data: [],
    };
  }

  // Only SUPER_ADMIN can create users
  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() createUserDto: any, @CurrentUser() user: CurrentUserData) {
    // User is authenticated and has SUPER_ADMIN role
    return {
      success: true,
      data: {},
    };
  }
}
```

## API Key Authentication

Clients can authenticate using API keys instead of JWT tokens.

**How to use:**
1. Set the `x-api-key` header with the API key
2. Use the `ApiKeyGuard` on the route
3. The client will be authenticated automatically

```typescript
import { ApiKeyGuard } from '../common/guards';

@Controller('api')
export class ApiController {
  @Get('data')
  @UseGuards(ApiKeyGuard)
  getData(@CurrentUser() user: CurrentUserData) {
    // user.type === 'client'
    // user.api_key_id is available
    return { data: [] };
  }
}
```

## Response Format

All responses are automatically transformed to the standard format:

```typescript
{
  success: boolean,
  statusCode: number,
  message: string,
  data: any,
  timestamp: string,
  path: string
}
```

**Example successful response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  },
  "timestamp": "2025-01-08T12:00:00.000Z",
  "path": "/api/users/profile"
}
```

**Example error response:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Audit Logging

All non-GET requests are automatically logged to the `audit_logs` table.

**Logged information:**
- User ID (for user authentication)
- Client ID (for client/API key authentication)
- Action performed (e.g., `post_users`, `delete_clients`)
- Entity type
- Entity ID
- Changes made (request body, excluding sensitive fields)
- IP address
- User agent

**View audit logs:**
```typescript
@Controller('audit-logs')
export class AuditLogsController {
  @Get()
  @Roles(Role.SUPER_ADMIN)
  async getAuditLogs() {
    // Return audit log entries
  }
}
```

## Authentication Flow

### User Login Flow

1. **Login**
   ```bash
   POST /api/auth/login
   Body: { email, password }
   Response: { access_token, refresh_token, user }
   ```

2. **Use Token**
   ```bash
   GET /api/users/profile
   Headers: Authorization: Bearer <access_token>
   ```

3. **Refresh Token**
   ```bash
   POST /api/auth/refresh
   Body: { refresh_token }
   Response: { access_token, refresh_token }
   ```

### Client API Key Flow

1. **Generate API Key** (Admin only)
   ```bash
   POST /api/clients/:id/api-keys
   Body: { name, expiresIn }
   Response: { api_key } // Show only once!
   ```

2. **Use API Key**
   ```bash
   GET /api/clients/profile
   Headers: x-api-key: <api_key>
   ```

## Best Practices

1. **Always use `@ApiBearerAuth()`** in Swagger for protected routes
2. **Use specific roles** instead of omitting `@Roles()` decorator
3. **Use `@Public()` sparingly** - only for login, register, etc.
4. **Leverage `@CurrentUser()`** instead of manually extracting user from request
5. **Check role hierarchy** - higher roles automatically have lower role permissions
6. **Use `@Roles()` on the controller** for default role requirements
7. **Override controller roles** on specific methods when needed

## Security Considerations

1. **JWT tokens** expire after configured time (default: 1 hour)
2. **API keys** should be stored securely and rotated regularly
3. **Passwords** are hashed using bcrypt
4. **Audit logs** track all modifications for compliance
5. **Role hierarchy** prevents privilege escalation
6. **CORS** is configured to restrict cross-origin requests
7. **Rate limiting** should be implemented for production

## Testing

### Test with JWT Token

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@auth.com","password":"12345"}'

# Use token
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <access_token>"
```

### Test with API Key

```bash
curl -X GET http://localhost:3000/api/clients/profile \
  -H "x-api-key: <api_key>"
```

### Test Role-Based Access

```bash
# Try to access SUPER_ADMIN only endpoint as a regular user
curl -X DELETE http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer <user_token>"
# Response: 403 Forbidden
```

## Troubleshooting

### 401 Unauthorized
- Check if JWT token is valid and not expired
- Verify `Authorization: Bearer <token>` header is set
- For public routes, ensure `@Public()` decorator is used

### 403 Forbidden
- Check if user has required role
- Verify role hierarchy allows access
- Check if `@Roles()` decorator is properly configured

### API Key Not Working
- Ensure `ApiKeyGuard` is applied to the route
- Check if API key is active and not expired
- Verify `x-api-key` header is set correctly

## Additional Resources

- See [examples/](src/examples/) directory for complete controller examples
- Check [common/](src/common/) directory for decorator and guard implementations
- Review [auth/](src/modules/auth/) module for JWT strategy and configuration