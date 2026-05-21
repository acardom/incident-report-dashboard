/**
 * @file Tenant.js
 * @author Alberto Cárdeno Domínguez
 * @component TenantModel
 * @description Modelo de acceso a datos para la entidad de Inquilinos/Clientes (Tenants).
 * Este módulo contiene la lógica de negocio a nivel de base de datos para los registros de `tenants` (espacios de trabajo).
 * Cada inquilino representa un cliente independiente del sistema (por ejemplo, diferentes ayuntamientos, regiones o empresas).
 * El modelo expone métodos para dar de alta inquilinos, buscar por su identificador slug amigable en la URL, y listar
 * las cuentas activas para dar soporte a la infraestructura multi-tenant.
 */

const db = require('../config/db');

class Tenant {
  /**
   * Crea un nuevo inquilino en la base de datos.
   *
   * @param {string} name - Nombre descriptivo de la organización/inquilino (ej. "Policía de Madrid").
   * @param {string} slug - Identificador de URL único y amigable (ej. "policia-madrid").
   * @returns {Promise<Object>} El registro del inquilino recién creado.
   */
  static async create(name, slug) {
    const queryText = `
      INSERT INTO tenants (name, slug)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const res = await db.query(queryText, [name, slug]);
    return res.rows[0];
  }

  /**
   * Obtiene un inquilino a partir de su 'slug' identificativo.
   * Útil para resolver el inquilino que solicita autenticarse o registrarse desde la URL.
   *
   * @param {string} slug - Slug a buscar.
   * @returns {Promise<Object|undefined>} El registro del inquilino correspondiente, o undefined si no existe.
   */
  static async findBySlug(slug) {
    const queryText = `
      SELECT * FROM tenants WHERE slug = $1;
    `;
    const res = await db.query(queryText, [slug]);
    return res.rows[0];
  }

  /**
   * Obtiene un inquilino a partir de su ID secuencial único de base de datos.
   *
   * @param {number} id - ID del inquilino.
   * @returns {Promise<Object|undefined>} El registro del inquilino, o undefined.
   */
  static async findById(id) {
    const queryText = `
      SELECT * FROM tenants WHERE id = $1;
    `;
    const res = await db.query(queryText, [id]);
    return res.rows[0];
  }

  /**
   * Lista todos los inquilinos configurados en el sistema ordenados alfabéticamente.
   *
   * @returns {Promise<Array<Object>>} Colección de todos los registros de inquilinos.
   */
  static async listAll() {
    const queryText = `
      SELECT * FROM tenants ORDER BY name ASC;
    `;
    const res = await db.query(queryText);
    return res.rows;
  }
}

module.exports = Tenant;
