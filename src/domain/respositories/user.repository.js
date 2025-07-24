/**
 * Interface/Puerto para el repositorio de usuarios
 * Define el contrato que debe implementar cualquier adaptador de persistencia
 */
export class UserRepository {
  async create(user) {
    throw new Error('Method create must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented');
  }

  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  async update(id, userData) {
    throw new Error('Method update must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete must be implemented');
  }
}