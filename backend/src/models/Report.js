/**
 * @file Report.js
 * @author Alberto Cárdeno Domínguez
 * @component ReportModel
 * @description Modelo de acceso a datos para la entidad de Partes de Incidentes (Incident Reports).
 * Este módulo encapsula las consultas SQL ejecutadas contra la tabla `incident_reports` en la base de datos PostgreSQL.
 * Proporciona métodos estáticos para crear, listar, buscar, actualizar y eliminar partes de incidentes,
 * asegurando en cada consulta el aislamiento por inquilino (`tenant_id`) para cumplir con la arquitectura multi-tenant.
 * También gestiona manualmente la eliminación en cascada de los croquis de accidentes (`accident_scenes`) asociados a un parte.
 */

const db = require('../config/db');

class Report {
  /**
   * Registra un nuevo parte de incidente en la base de datos.
   *
   * @param {Object} params - Parámetros de creación del reporte.
   * @param {number} params.tenantId - ID del inquilino al que pertenece el reporte.
   * @param {number} params.userId - ID del usuario operador que redacta el reporte.
   * @param {string} params.firstName - Nombre de la persona involucrada.
   * @param {string} params.lastName - Apellido de la persona involucrada.
   * @param {string} params.location - Ubicación o dirección del suceso.
   * @param {string} params.incidentTime - Fecha y hora del incidente.
   * @param {string} params.interventionType - Tipo de intervención (ej. médica, rescate, vial).
   * @returns {Promise<Object>} Retorna el registro insertado completo.
   */
  static async create({ tenantId, userId, firstName, lastName, location, incidentTime, interventionType }) {
    const queryText = `
      INSERT INTO incident_reports (tenant_id, user_id, first_name, last_name, location, incident_time, intervention_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await db.query(queryText, [
      tenantId,
      userId,
      firstName,
      lastName,
      location,
      incidentTime,
      interventionType
    ]);
    return res.rows[0];
  }

  /**
   * Obtiene todos los partes de incidentes correspondientes a un inquilino específico,
   * incluyendo el nombre del usuario que reportó el evento.
   *
   * @param {number} tenantId - ID del inquilino.
   * @returns {Promise<Array<Object>>} Lista de reportes ordenados cronológicamente de forma descendente.
   */
  static async listByTenant(tenantId) {
    const queryText = `
      SELECT ir.*, u.username as reporter_name
      FROM incident_reports ir
      LEFT JOIN users u ON ir.user_id = u.id
      WHERE ir.tenant_id = $1
      ORDER BY ir.incident_time DESC;
    `;
    const res = await db.query(queryText, [tenantId]);
    return res.rows;
  }

  /**
   * Busca un parte de incidente específico por su identificador único e ID de inquilino.
   *
   * @param {number} id - ID único del reporte.
   * @param {number} tenantId - ID del inquilino para restringir el acceso.
   * @returns {Promise<Object|undefined>} El reporte si existe y coincide con el inquilino, o undefined.
   */
  static async findByIdAndTenant(id, tenantId) {
    const queryText = `
      SELECT * FROM incident_reports 
      WHERE id = $1 AND tenant_id = $2;
    `;
    const res = await db.query(queryText, [id, tenantId]);
    return res.rows[0];
  }

  /**
   * Actualiza los datos de un parte de incidente existente que coincida con el ID del reporte e ID del inquilino.
   *
   * @param {number} id - ID único del reporte.
   * @param {number} tenantId - ID del inquilino para asegurar aislamiento.
   * @param {Object} fields - Datos del reporte a modificar.
   * @param {string} fields.firstName - Nombre de la persona involucrada.
   * @param {string} fields.lastName - Apellido de la persona involucrada.
   * @param {string} fields.location - Ubicación del incidente.
   * @param {string} fields.incidentTime - Fecha y hora del incidente.
   * @param {string} fields.interventionType - Tipo de intervención.
   * @returns {Promise<Object>} Retorna el registro actualizado.
   */
  static async update(id, tenantId, { firstName, lastName, location, incidentTime, interventionType }) {
    const queryText = `
      UPDATE incident_reports 
      SET first_name = $3, last_name = $4, location = $5, incident_time = $6, intervention_type = $7
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;
    const res = await db.query(queryText, [
      id,
      tenantId,
      firstName,
      lastName,
      location,
      incidentTime,
      interventionType
    ]);
    return res.rows[0];
  }

  /**
   * Elimina un parte de incidente y todos sus croquis de accidente asociados, validando pertenencia al inquilino.
   *
   * @param {number} id - ID del reporte.
   * @param {number} tenantId - ID del inquilino.
   * @returns {Promise<Object|undefined>} Objeto con el id del reporte eliminado si tuvo éxito, o undefined.
   */
  static async delete(id, tenantId) {
    // Eliminar primero los croquis de accidentes asociados para asegurar que se ejecute la eliminación en cascada de forma lógica
    const deleteScenesText = `
      DELETE FROM accident_scenes
      WHERE report_id = $1 AND tenant_id = $2;
    `;
    await db.query(deleteScenesText, [id, tenantId]);

    // Eliminar finalmente el parte de incidente principal
    const queryText = `
      DELETE FROM incident_reports 
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const res = await db.query(queryText, [id, tenantId]);
    return res.rows[0];
  }
}

module.exports = Report;
