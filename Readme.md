# Node.js Microservice Archetype

Enterprise-grade microservice template implementing hexagonal architecture with Node.js 22, Fastify, and PostgreSQL.

## Project Description

This archetype provides a production-ready foundation for building scalable microservices using modern Node.js practices. It implements hexagonal architecture (Ports and Adapters pattern) to ensure proper separation of concerns, testability, and maintainability.

## Architecture Overview

The project follows Domain-Driven Design principles with clear boundaries between layers:

- **Domain Layer**: Core business logic, entities, and repository interfaces
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External adapters (database, messaging, etc.)
- **Interface Layer**: API controllers and external interfaces

## Project Structure

```
microservice-archetype/
├── src/
│   ├── domain/                     # Business logic and rules
│   │   ├── entities/               # Domain entities
│   │   ├── repositories/           # Repository interfaces
│   │   └── services/               # Domain services
│   ├── application/                # Application layer
│   │   ├── services/               # Application services
│   │   └── usecases/               # Use case implementations
│   ├── infrastructure/             # External adapters
│   │   ├── config/                 # Environment configuration
│   │   ├── database/               # Database connections
│   │   ├── logging/                # Logging configuration
│   │   ├── repositories/           # Repository implementations
│   │   ├── middleware/             # Express/Fastify middleware
│   │   └── server/                 # Server setup and routes
│   ├── interfaces/                 # External interfaces
│   │   └── controllers/            # HTTP controllers
│   └── main.js                     # Application entry point
├── tests/                          # Test suites
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── fixtures/                   # Test fixtures
├── scripts/                        # Utility scripts
├── docs/                           # Documentation
├── .env.example                    # Environment variables template
├── .eslintrc.js                    # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── docker-compose.yml              # Development environment
├── Dockerfile                      # Production container
└── package.json                    # Dependencies and scripts
```

## Quick Start

### Prerequisites

- Node.js 22.x or higher
- Docker and Docker Compose (recommended)
- PostgreSQL 15+ (if not using Docker)

### Installation

1. Clone the repository:
```bash
git clone <repository-url> your-microservice
cd your-microservice
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start with Docker (recommended):
```bash
npm run docker:up
```

Or start manually:
```bash
# Start PostgreSQL locally first
npm run dev
```

The service will be available at `http://localhost:3000`

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration
```bash
NODE_ENV=development
PORT=3000
HOST=127.0.0.1
```

### Database Configuration
```bash
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=microservice_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Security Configuration
```bash
JWT_SECRET=your_jwt_secret_key
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute
```

### Logging Configuration
```bash
LOG_LEVEL=debug
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm start               # Start production server

# Testing
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # Run TypeScript type checking

# Docker
npm run docker:build    # Build Docker image
npm run docker:up       # Start with Docker Compose
npm run docker:down     # Stop Docker containers

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with test data

# Utilities
npm run generate:service # Generate new service boilerplate
npm run clean           # Clean build artifacts
```

## Testing Strategy

The project includes comprehensive testing setup:

### Unit Tests
Located in `tests/unit/`, these test individual components in isolation using mocks for dependencies.

### Integration Tests
Located in `tests/integration/`, these test complete workflows with real database connections.

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/services/user.service.test.js

# Watch mode for development
npm run test:watch
```

## Development Standards

### Code Style
- ESLint with Airbnb configuration
- Prettier for code formatting
- Conventional Commits for commit messages
- Husky pre-commit hooks

### Architecture Principles
- Follow SOLID principles
- Implement dependency injection
- Use interface segregation
- Maintain clear separation of concerns
- Write comprehensive tests

### Error Handling
- Centralized error handling middleware
- Structured logging with correlation IDs
- Proper HTTP status codes
- Detailed error messages for development

### API Design
- RESTful API conventions
- OpenAPI/Swagger documentation
- Request/response validation
- Consistent error response format

## Key Dependencies

### Core Framework
- **Fastify**: High-performance web framework
- **@fastify/postgres**: PostgreSQL connection plugin
- **pino**: Structured logging

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit file processing

### Testing
- **Node.js Test Runner**: Native testing framework
- **Supertest**: HTTP assertion library

### Production
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting

## Security Considerations

### Authentication & Authorization
- JWT token validation middleware
- Role-based access control ready
- Secure session management

### Input Validation
- Schema-based request validation
- SQL injection prevention
- XSS protection through proper encoding

### Infrastructure Security
- Docker security best practices
- Non-root container user
- Environment variable protection
- HTTPS enforcement in production

## Production Deployment

### Container Deployment
```bash
# Build production image
docker build -t your-microservice:latest .

# Run container
docker run -d \
  --name your-microservice \
  -p 3000:3000 \
  --env-file .env.production \
  your-microservice:latest
```

### Environment Variables for Production
```bash
NODE_ENV=production
LOG_LEVEL=info
DATABASE_ENABLED=true
DB_SSL=true
JWT_SECRET=strong_random_production_key
RATE_LIMIT_ENABLED=true
```

### Health Monitoring
- Health check endpoint at `/health`
- Structured logging for monitoring
- Request correlation IDs
- Performance metrics collection ready

## Extending the Archetype

### Adding New Entities
1. Create domain entity in `src/domain/entities/`
2. Define repository interface in `src/domain/repositories/`
3. Implement repository in `src/infrastructure/repositories/`
4. Create application service in `src/application/services/`
5. Add controller in `src/interfaces/controllers/`
6. Register routes in `src/infrastructure/server/routes.js`

### Database Migrations
Database schema changes should be managed through migration scripts in `scripts/migrations/`.

### Configuration Management
Environment-specific configurations are managed through the config system in `src/infrastructure/config/`.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Follow the established coding standards
2. Write comprehensive tests for new features
3. Update documentation as needed
4. Submit pull requests with clear descriptions