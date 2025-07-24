/**
 * Entidad User del dominio
 * Contiene la lógica de negocio y reglas del dominio
 */
export class User {
  constructor({ id, email, name, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validar email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar nombre
   */
  static isValidName(name) {
    return name && name.trim().length >= 2;
  }

  /**
   * Crear nuevo usuario con validaciones
   */
  static create({ email, name }) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isValidName(name)) {
      throw new Error('Name must be at least 2 characters');
    }

    return new User({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Actualizar usuario
   */
  update({ name, email }) {
    if (name !== undefined) {
      if (!User.isValidName(name)) {
        throw new Error('Name must be at least 2 characters');
      }
      this.name = name.trim();
    }

    if (email !== undefined) {
      if (!User.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      this.email = email.toLowerCase().trim();
    }

    this.updatedAt = new Date();
  }

  /**
   * Convertir a objeto plano
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}