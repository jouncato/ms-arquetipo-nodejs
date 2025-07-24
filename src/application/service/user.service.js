import { User } from '../../domain/entities/user.entity.js';

/**
 * Servicio de aplicación para casos de uso de usuarios
 * Orquesta la lógica de negocio usando entidades y repositorios
 */
export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Crear nuevo usuario
   */
  async createUser({ email, name }) {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Crear entidad de dominio
    const user = User.create({ email, name });
    
    // Persistir usuario
    return await this.userRepository.create(user);
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(options = {}) {
    return await this.userRepository.findAll(options);
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id, userData) {
    const user = await this.getUserById(id);
    
    // Si se está cambiando el email, verificar que no exista
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    return await this.userRepository.update(id, userData);
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id) {
    await this.getUserById(id); // Verificar que existe
    return await this.userRepository.delete(id);
  }
}