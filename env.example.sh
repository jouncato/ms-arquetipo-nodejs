# ===========================================
# MICROSERVICE CONFIGURATION
# ===========================================

# Environment
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=127.0.0.1

# Database Configuration
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=microservice_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Logging Configuration
LOG_LEVEL=debug

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute

# Security
JWT_SECRET=development-secret-change-in-production
JWT_EXPIRES_IN=24h

# ===========================================
# PRODUCTION OVERRIDES
# ===========================================
# NODE_ENV=production
# LOG_LEVEL=info
# DB_SSL=true
# JWT_SECRET=strong-random-production-key
# CORS_ORIGINS=https://yourdomain.com