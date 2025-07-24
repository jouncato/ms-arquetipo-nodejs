#!/usr/bin/env node

/**
 * Script para generar nuevos servicios basados en el arquetipo
 * Uso: npm run generate:service -- --name=Product
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const nameFlag = args.find(arg => arg.startsWith('--name='));

if (!nameFlag) {
  console.error('❌ Error: Se requiere el parámetro --name');
  console.log('Uso: npm run generate:service -- --name=Product');
  process.exit(1);
}

const serviceName = nameFlag.split('=')[1];
const lowerName = serviceName.toLowerCase();
const upperName = serviceName.toUpperCase();

console.log(`🏗️  Generando servicio: ${serviceName}`);

// Crear directorios si no existen
const dirs = [
  `src/domain/entities`,
  `src/domain/repositories`,
  `src/application/services`,
  `src/infrastructure/repositories`,
  `src/interfaces/controllers`,
  `tests`
];

dirs.forEach(dir => {
  mkdirSync(dir, { recursive: true });
});

// Template de entidad
const entityTemplate = `/**
 * Entidad ${serviceName} del dominio
 */
export class ${serviceName} {
  constructor({ id, name, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create({ name }) {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    return new ${serviceName}({
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  update({ name }) {
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }
      this.name = name.trim();
    }
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
`;

// Template de repositorio
const repositoryTemplate = `import { ${serviceName}Repository } from '../../domain/repositories/${lowerName}.repository.js';

export class ${serviceName}Repository {
  async create(${lowerName}) {
    throw new Error('Method create must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  async update(id, ${lowerName}Data) {
    throw new Error('Method update must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete must be implemented');
  }
}
`;

// Template de servicio
const serviceTemplate = `import { ${serviceName} } from '../../domain/entities/${lowerName}.entity.js';

export class ${serviceName}Service {
  constructor(${lowerName}Repository) {
    this.${lowerName}Repository = ${lowerName}Repository;
  }

  async create${serviceName}({ name }) {
    const ${lowerName} = ${serviceName}.create({ name });
    return await this.${lowerName}Repository.create(${lowerName});
  }

  async get${serviceName}ById(id) {
    const ${lowerName} = await this.${lowerName}Repository.findById(id);
    if (!${lowerName}) {
      throw new Error('${serviceName} not found');
    }
    return ${lowerName};
  }

  async getAll${serviceName}s(options = {}) {
    return await this.${lowerName}Repository.findAll(options);
  }

  async update${serviceName}(id, ${lowerName}Data) {
    await this.get${serviceName}ById(id);
    return await this.${lowerName}Repository.update(id, ${lowerName}Data);
  }

  async delete${serviceName}(id) {
    await this.get${serviceName}ById(id);
    return await this.${lowerName}Repository.delete(id);
  }
}
`;

// Crear archivos
const files = [
  {
    path: `src/domain/entities/${lowerName}.entity.js`,
    content: entityTemplate
  },
  {
    path: `src/domain/repositories/${lowerName}.repository.js`,
    content: repositoryTemplate
  },
  {
    path: `src/application/services/${lowerName}.service.js`,
    content: serviceTemplate
  }
];

files.forEach(file => {
  writeFileSync(file.path, file.content);
  console.log(`✅ Creado: ${file.path}`);
});

console.log(`
🎉 Servicio ${serviceName} generado exitosamente!

Próximos pasos:
1. Implementar ${serviceName}Repository en infrastructure/repositories/
2. Crear controlador en interfaces/controllers/
3. Registrar rutas en infrastructure/server/routes.js
4. Agregar tests en tests/
5. Crear migración SQL si es necesario
`);
