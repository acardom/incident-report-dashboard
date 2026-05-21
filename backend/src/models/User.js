/**
 * @file User.js
 * @author Alberto Cárdeno Domínguez
 * @component UserModel
 * @description Modelo de acceso a datos para la entidad de Usuarios (Users).
 * Este módulo centraliza las operaciones de base de datos relacionadas con los usuarios del sistema.
 * Soporta la creación de cuentas de operador, la búsqueda por email vinculada a un inquilino específico (tenant_id)
 * para garantizar la seguridad durante el inicio de sesión, y la recuperación de perfiles de usuario por identificador único.
 * No expone ni retorna hashes/sales de contraseñas por defecto a menos que sea explícitamente requerido para flujos de autenticación.
 */

const db = require('../config/db');

class User {
  /**
   * Crea y registra un nuevo usuario en la base de datos vinculándolo a su correspondiente inquilino.
   *
   * @param {Object} params - Credenciales e información del usuario.
   * @param {number} params.tenantId - ID del inquilino propietario.
   * @param {string} params.username - Nombre de usuario / alias del operador.
   * @param {string} params.email - Dirección de correo electrónico (clave de acceso).
   * @param {string} params.passwordHash - Contraseña cifrada en formato PBKDF2/SHA256.
   * @param {string} params.passwordSalt - Sal de cifrado utilizada en la derivación de claves.
   * @param {string} [params.role='user'] - Rol del usuario dentro del sistema (ej. 'user', 'admin').
   * @returns {Promise<Object>} Retorna el registro insertado sin información sensible de contraseña (id, tenant_id, username, email, role, created_at).
   */
  static async create({ tenantId, username, email, passwordHash, passwordSalt, role = 'user' }) {
    const queryText = `
      INSERT INTO users (tenant_id, username, email, password_hash, password_salt, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, username, email, role, created_at;
    `;
    const res = await db.query(queryText, [tenantId, username, email, passwordHash, passwordSalt, role]);
    return res.rows[0];
  }

  /**
   * Obtiene los datos completos de un usuario (incluyendo hashes de seguridad) filtrando por email e inquilino.
   * Método crítico utilizado por el controlador de autenticación para comprobar la contraseña provista.
   *
   * @param {string} email - Correo electrónico del usuario.
   * @param {number} tenantId - ID del inquilino bajo el cual se intenta iniciar sesión.
   * @returns {Promise<Object|undefined>} El objeto de usuario si coincide la búsqueda, o undefined.
   */
  static async findByEmailAndTenant(email, tenantId) {
    const queryText = `
      SELECT * FROM users WHERE email = $1 AND tenant_id = $2;
    `;
    const res = await db.query(queryText, [email, tenantId]);
    return res.rows[0];
  }

  /**
   * Busca y recupera la información de perfil público de un usuario por su ID.
   *
   * @param {number} id - Identificador único de usuario.
   * @returns {Promise<Object|undefined>} Perfil del usuario excluyendo credenciales sensibles, o undefined.
   */
  static async findById(id) {
    const queryText = `
      SELECT id, tenant_id, username, email, role, created_at 
      FROM users WHERE id = $1;
    `;
    const res = await db.query(queryText, [id]);
    return res.rows[0];
  }
}

module.exports = User;
