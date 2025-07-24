import { UserRepository } from '../../domain/repositories/user.repository.js';
import { User } from '../../domain/entities/user.entity.js';

/**
 * Implementación del repositorio de usuarios para PostgreSQL
 */
export class PostgresUserRepository extends UserRepository {
  constructor(pg) {
    super();
    this.pg = pg;
  }

  /**
   * Crear usuario
   */
  async create(user) {
    const client = await this.pg.connect();
    try {
      const query = `
        INSERT INTO users (email, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, created_at, updated_at
      `;
      const values = [user.email, user.name, user.createdAt, user.updatedAt];
      const result = await client.query(query, values);
      
      return this.mapToEntity(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id) {
    const client = await this.pg.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email) {
    const client = await this.pg.connect();
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await client.query(query, [email]);
      
      return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener todos los usuarios con paginación
   */
  async findAll(options = {}) {
    const { limit = 10, offset = 0 } = options;
    const client = await this.pg.connect();
    
    try {
      const query = `
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(row => this.mapToEntity(row));
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar usuario
   */
  async update(id, userData) {
    const client = await this.pg.connect();
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (userData.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(userData.name);
      }

      if (userData.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(userData.email);
      }

      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(id);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, name, created_at, updated_at
      `;

      const result = await client.query(query, values);
      return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar usuario
   */
  async delete(id) {
    const client = await this.pg.connect();
    try {
      const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await client.query(query, [id]);
      
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Mapear fila de DB a entidad de dominio
   */
  mapToEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}