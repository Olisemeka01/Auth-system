# Authentication System

A comprehensive authentication and authorization system built with NestJS and TypeORM.

## Features

- User authentication with JWT
- Role-based access control (RBAC)
- Client management with API keys
- Audit logging for all actions
- Email verification for clients
- Soft deletes for data retention

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- pnpm package manager

## Installation

```bash
pnpm install
```

## Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=auth_system

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h

PORT=3000
NODE_ENV=development
```

## Database Setup

### 1. Create the database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE auth_system;

# Exit
\q
```

### 2. Run migrations

```bash
pnpm migration:run
```

### 3. Seed the database

This will create:
- Super Admin role with all permissions
- Manager role with limited permissions
- Staff role with read-only access
- Admin user (email: `admin@auth.com`, password: `12345`)

```bash
pnpm seed
```

## Database Schema

### Entities

#### User
- `id` (UUID) - Primary key
- `email` (varchar) - Unique email address
- `password_hash` (varchar) - Hashed password
- `first_name` (varchar) - First name
- `last_name` (varchar) - Last name
- `phone` (varchar) - Phone number (optional)
- `is_active` (boolean) - Active status
- `is_verified` (boolean) - Verification status
- `last_login_at` (timestamp) - Last login timestamp
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `deleted_at` (timestamp) - Soft delete timestamp
- `roles` (Many-to-Many) - Relationship with Role

#### Role
- `id` (UUID) - Primary key
- `name` (varchar) - Unique role name
- `description` (varchar) - Role description
- `is_default` (boolean) - Default role flag
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `permissions` (Many-to-Many) - Relationship with Permission
- `users` (Many-to-Many) - Relationship with User

#### Permission
- `id` (UUID) - Primary key
- `name` (varchar) - Unique permission name
- `description` (varchar) - Permission description
- `resource` (varchar) - Resource name
- `action` (varchar) - Action name (create, read, update, delete)
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `roles` (Many-to-Many) - Relationship with Role

#### Client
- `id` (UUID) - Primary key
- `first_name` (varchar) - First name
- `last_name` (varchar) - Last name
- `email` (varchar) - Unique email address
- `password_hash` (varchar) - Hashed password
- `phone` (varchar) - Phone number (optional)
- `address` (text) - Address (optional)
- `is_active` (boolean) - Active status
- `is_email_verified` (enum) - Email verification status
- `email_verification_token` (varchar) - Verification token
- `email_verification_token_expires_at` (timestamp) - Token expiration
- `verified_at` (timestamp) - Verification timestamp
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `deleted_at` (timestamp) - Soft delete timestamp
- `api_keys` (One-to-Many) - Relationship with APIKey

#### APIKey
- `id` (UUID) - Primary key
- `client_id` (UUID) - Foreign key to Client
- `key_hash` (varchar) - Hashed API key
- `name` (varchar) - API key name
- `last_four` (varchar) - Last 4 characters of key
- `is_active` (boolean) - Active status
- `expires_at` (timestamp) - Expiration timestamp
- `last_used_at` (timestamp) - Last usage timestamp
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `deleted_at` (timestamp) - Soft delete timestamp
- `client` (Many-to-One) - Relationship with Client

#### AuditLog
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to User (nullable)
- `client_id` (UUID) - Foreign key to Client (nullable)
- `action` (varchar) - Action performed
- `entity` (text) - Entity type
- `entity_id` (UUID) - Entity ID
- `changes` (jsonb) - Change details
- `ip_address` (varchar) - IP address
- `user_agent` (varchar) - User agent string
- `created_at` (timestamp) - Creation timestamp
- `user` (Many-to-One) - Relationship with User
- `client` (Many-to-One) - Relationship with Client

## Relationships

- User ↔ Role (Many-to-Many via `user_roles`)
- Role ↔ Permission (Many-to-Many via `role_permissions`)
- Client ↔ APIKey (One-to-Many)
- Client ↔ AuditLog (One-to-Many)
- User ↔ AuditLog (One-to-Many)

## Running the Application

```bash
# Development
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

## Default Admin Credentials

After seeding the database, you can log in with:

- Email: `admin@auth.com`
- Password: `12345`

**Important:** Change the admin password immediately after first login!

## NPM Scripts

- `pnpm start` - Start the application
- `pnpm start:dev` - Start in development mode with hot reload
- `pnpm build` - Build the application
- `pnpm migration:generate` - Generate a new migration
- `pnpm migration:run` - Run pending migrations
- `pnpm migration:revert` - Revert the last migration
- `pnpm seed` - Seed the database with initial data
- `pnpm lint` - Run ESLint
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests

## Security Notes

1. Always use HTTPS in production
2. Change the JWT_SECRET in production
3. Use strong passwords for the database
4. Enable rate limiting for API endpoints
5. Implement proper CORS configuration
6. Use environment-specific configurations
7. Regularly update dependencies for security patches

## License

UNLICENSED