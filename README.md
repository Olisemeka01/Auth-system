# Auth System

A comprehensive authentication and authorization API system built with NestJS, featuring multiple authentication methods, role-based access control (RBAC), and audit logging.

## Overview

This system provides secure authentication and authorization for applications, supporting both user-based and client-based authentication with a robust audit trail.

### Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework
- **Language**: TypeScript
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Authentication**: JWT (JSON Web Tokens), API Keys
- **Documentation**: Swagger/OpenAPI

## Features

### User Authentication
- Email/password registration and login
- JWT-based authentication with access tokens (1h expiry)
- Refresh token support (7d expiry)
- Password hashing with bcrypt
- User profile management
- Account activation/deactivation
- Last login tracking

### Client Authentication
- API key-based authentication for external integrations
- SHA256-hashed API keys with expiration dates
- Email verification with OTP tokens
- Client activity tracking

### Role-Based Access Control (RBAC)
- Five role levels: SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, CLIENT
- Many-to-many user-role relationships
- Decorator-based route protection
- Role hierarchy enforcement

### Security Features
- Rate limiting (multiple tiers)
- Comprehensive audit logging
- IP address and user agent tracking
- Input validation with class-validator
- CORS protection

### Audit Logging
- Automatic logging of all user and client actions
- Entity tracking with action types
- IP address and user agent capture
- Queryable audit history

## Architecture

The system follows a modular architecture with clear separation of concerns:

```
src/
├── modules/
│   ├── auth/          # Authentication logic (login, register, JWT)
│   ├── users/         # User management and CRUD operations
│   ├── roles/         # Role management and RBAC
│   ├── clients/       # Client and API key management
│   └── audit/         # Audit logging service
├── common/
│   ├── guards/        # Authentication and authorization guards
│   ├── interceptors/  # Request/response transformation and logging
│   ├── decorators/    # Custom decorators for route protection
│   └── constants/     # Action definitions and configurations
└── database/
    ├── migrations/    # Database schema migrations
    ├── seeds/         # Database seeding scripts
    └── entities/      # TypeORM entities
```

### Authentication Flow

```
User Registration -> Password Hash -> Create User -> Assign Default Role -> Return JWT
User Login -> Validate Password -> Generate JWT + Refresh Token -> Update Last Login
Protected Request -> JWT Guard -> Role Guard -> Controller -> Service -> Response
```

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (v12 or higher)
- **Redis** (optional - configured but not actively used)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd auth-system

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=auth_system

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# API
PORT=3000
NODE_ENV=development

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Running with Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# Run database migrations
docker-compose exec api npm run migration:run

# Seed the database
docker-compose exec api npm run seed
```

The API will be available at `http://localhost:3000`

### Running Locally

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
npm run migration:run

# Seed the database
npm run seed

# Start the development server
npm run start:dev
```

### Database Setup

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed initial data
npm run seed
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development mode with hot-reload |
| `npm run start:prod` | Run production build |
| `npm run build` | Build for production |
| `npm run migration:run` | Run database migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:generate` | Generate new migration |
| `npm run seed` | Seed database with initial data |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:3000/api/docs
```

The Swagger UI includes:
- All available endpoints
- Request/response schemas
- Authentication methods (Bearer token and API key)
- Try-it-out functionality

## Project Structure

### Core Modules

- **[auth/](src/modules/auth/)** - Authentication endpoints and JWT token management
- **[users/](src/modules/users/)** - User entity management and CRUD operations
- **[roles/](src/modules/roles/)** - Role definitions and RBAC logic
- **[clients/](src/modules/clients/)** - Client management and API key generation
- **[audit/](src/modules/audit/)** - Audit log storage and querying

### Common Components

- **[guards/](src/common/guards/)** - JWT authentication, role validation, API key guards
- **[interceptors/](src/common/interceptors/)** - Response transformation and audit logging
- **[decorators/](src/common/decorators/)** - `@Roles()`, `@CurrentUser()`, `@CurrentClient()`
- **[constants/](src/common/constants/)** - Action types and configuration values

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_DATABASE` | Database name | auth_system |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | 1h |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | - |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry | 7d |
| `PORT` | API server port | 3000 |
| `NODE_ENV` | Environment | development |

## Development

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting

```bash
# Check for linting errors
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

### Database Migrations

When modifying entities, generate a new migration:

```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
