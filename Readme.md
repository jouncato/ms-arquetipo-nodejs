# Microservice Archetype - Node.js 22

Arquetipo base para microservicios backend con **arquitectura hexagonal**, Node.js 22, Fastify y PostgreSQL.

## 🚀 Características

- **Node.js 22** con ESM (ECMAScript Modules)
- **Arquitectura Hexagonal** (Puertos y Adaptadores)
- **Fastify** para alto rendimiento
- **PostgreSQL** con pool de conexiones
- **Logging** estructurado con Pino
- **Pruebas** con Node.js Test Runner nativo
- **Docker** y Docker Compose listos
- **Validación** automática de schemas
- **Rate limiting** y seguridad básica

## 📁 Estructura del Proyecto

```
microservice-archetype/
├── src/
│   ├── domain/                 # Entidades y reglas de negocio
│   │   ├── entities/           # User.entity.js
│   │   └── repositories/       # Interfaces de repositorios
│   ├── application/            # Casos de uso y servicios
│   │   └── services/           # UserService.js
│   ├── infrastructure/         # Adaptadores externos
│   │   ├── config/             # Configuración de entornos
│   │   ├── database/           # Conexión a PostgreSQL
│   │   ├── logging/            # Configuración de Pino
│   │   ├── repositories/       # Implementaciones de repositorios
│   │   └── server/             # Configuración de Fastify
│   ├── interfaces/             # Controladores web
│   │   └── controllers/        # User.controller.js
│   └── main.js                 # Punto de entrada
├── tests/                      # Pruebas unitarias e integración
├── scripts/                    # Scripts de utilidad
├── docker-compose.yml          # Orquestación de servicios
├── Dockerfile                  # Imagen Docker
└── README.md                   # Esta documentación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 22+
- Docker y Docker Compose (opcional)
- PostgreSQL (si no usas Docker)

### 1. Clonar y configurar

```bash
# Clonar el arquetipo
git clone <repo-url> mi-microservicio
cd mi-microservicio

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita `.env` con tus valores:

```bash
# Servidor
NODE_ENV=development
PORT=3000
HOST=127.0.0.1

# Base de datos
DATABASE_ENABLED=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=microservice_db
DB_USER=postgres
DB_PASSWORD=postgres123

# Logging
LOG_LEVEL=debug

# Seguridad
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Iniciar con Docker (Recomendado)

```bash
# Iniciar todos los servicios
npm run docker:run

# Ver logs
docker-compose logs -f microservice

# Parar servicios
npm run docker:stop
```

### 4. Iniciar manualmente

```bash
# Con base de datos local
npm run dev

# Sin base de datos (solo para pruebas)
DATABASE_ENABLED=false npm run dev
```

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas en modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

## 📊 API Endpoints

### Health Check
```http
GET /health
```

### Usuarios
```http
GET    /api/v1/users          # Listar usuarios
GET    /api/v1/users/:id      # Obtener usuario
POST   /api/v1/users          # Crear usuario
PUT    /api/v1/users/:id      # Actualizar usuario
DELETE /api/v1/users/:id      # Eliminar usuario
```

### Documentación API
Visita `http://localhost:3000/docs` para ver la documentación Swagger automática.

## 🔧 Desarrollo

### Agregar nueva entidad

1. **Crear entidad de dominio**:
```javascript
// src/domain/entities/product.entity.js
export class Product {
  constructor({ id, name, price }) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}
```

2. **Crear repositorio (interfaz)**:
```javascript
// src/domain/repositories/product.repository.js
export class ProductRepository {
  async create(product) { throw new Error('Method must be implemented'); }
  async findById(id) { throw new Error('Method must be implemented'); }
}
```

3. **Implementar repositorio**:
```javascript
// src/infrastructure/repositories/product.repository.postgres.js
export class PostgresProductRepository extends ProductRepository {
  // Implementar métodos...
}
```

4. **Crear servicio**:
```javascript
// src/application/services/product.service.js
export class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }
}
```

5. **Crear controlador**:
```javascript
// src/interfaces/controllers/product.controller.js
export async function productRoutes(fastify, options) {
  // Definir rutas...
}
```

6. **Registrar rutas** en `src/infrastructure/server/routes.js`

### Scripts de utilidad

```bash
# Generar nuevo servicio automáticamente
npm run generate:service -- --name=Product

# Ejecutar migraciones
npm run db:migrate

# Linting
npm run lint
npm run lint:fix
```

## 🐳 Docker

### Builds personalizados

```bash
# Build de imagen
npm run docker:build

# Run con configuración personalizada
docker run -p 3000:3000 \
  -e DATABASE_ENABLED=false \
  microservice-archetype
```

### Usar como base para otros servicios

```dockerfile
FROM microservice-archetype:latest
COPY ./my-service /app/
```

## 📈 Monitoreo y Observabilidad

### Logs estructurados
```javascript
// Los logs se formatean automáticamente
request.log.info({ userId: 123 }, 'User created');
```

### Métricas
El endpoint `/health` proporciona:
- Status del servicio
- Uptime
- Timestamp
- Versión

### Request ID
Cada request tiene un ID único traceable en headers y logs.

## 🔒 Seguridad

- **Helmet** para headers de seguridad
- **CORS** configurable
- **Rate limiting** por IP
- **Validación** estricta de input
- **Sanitización** automática de datos

## 🚢 Deployment

### Variables de entorno para producción

```bash
NODE_ENV=production
LOG_LEVEL=info
DATABASE_ENABLED=true
DB_SSL=true
JWT_SECRET=strong-random-key
RATE_LIMIT_ENABLED=true
```

### Kubernetes (ejemplo)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: microservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: microservice
  template:
    metadata:
      labels:
        app: microservice
    spec:
      containers:
      - name: microservice
        image: microservice-archetype:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## 🔄 Generación de nuevos microservicios

```bash
# Copiar arquetipo
cp -r microservice-archetype nuevo-servicio
cd nuevo-servicio

# Personalizar
sed -i 's/microservice-archetype/nuevo-servicio/g' package.json
sed -i 's/microservice_db/nuevo_servicio_db/g' .env

# Instalar y arrancar
npm install
npm run docker:run
```

## 📝 Convenciones de código

- **ESM** para todos los imports/exports
- **PascalCase** para clases y constructores
- **camelCase** para variables y funciones
- **kebab-case** para archivos y carpetas
- **UPPER_CASE** para constantes globales

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch: `git checkout -b feature/amazing-feature`
3. Commit cambios: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo `LICENSE` para detalles.

---

**¿Problemas o preguntas?** Abre un issue en el repositorio.