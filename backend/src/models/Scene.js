/**
 * @file Scene.js
 * @author Alberto Cárdeno Domínguez
 * @component SceneModel
 * @description Modelo de acceso a datos para la entidad de Croquis/Escenas de Accidente (Accident Scenes).
 * Este archivo gestiona la persistencia de los diagramas y objetos interactivos del croquis (representados como JSON)
 * en la tabla `accident_scenes`. Implementa métodos CRUD estáticos integrando de forma rigurosa la validación del
 * `tenant_id` para garantizar que las consultas respeten la segregación lógica del entorno multi-inquilino.
 * Asimismo, expone relaciones con usuarios creadores y partes de incidente para fines de visualización enriquecida.
 */

const db = require('../config/db');

class Scene {
  /**
   * Registra un nuevo croquis de accidente en el sistema.
   *
   * @param {Object} params - Datos de creación del croquis.
   * @param {number} params.tenantId - ID del inquilino propietario.
   * @param {number} params.userId - ID del operador que diseña la escena.
   * @param {number|null} [params.reportId] - ID del parte de incidente asociado (opcional).
   * @param {string} params.name - Nombre identificativo de la escena o croquis.
   * @param {Object|Array} params.sceneData - Datos vectoriales o JSON con las formas, vehículos y anotaciones colocadas en el lienzo.
   * @returns {Promise<Object>} Retorna el registro insertado completo.
   */
  static async create({ tenantId, userId, reportId, name, sceneData }) {
    const queryText = `
      INSERT INTO accident_scenes (tenant_id, user_id, report_id, name, scene_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await db.query(queryText, [
      tenantId,
      userId,
      reportId || null,
      name,
      JSON.stringify(sceneData)
    ]);
    return res.rows[0];
  }

  /**
   * Lista todos los croquis pertenecientes a un inquilino, enriqueciendo los resultados
   * con información sobre el creador de la escena y el incidente relacionado.
   *
   * @param {number} tenantId - ID del inquilino.
   * @returns {Promise<Array<Object>>} Lista de escenas ordenadas por fecha de creación (de más reciente a más antigua).
   */
  static async listByTenant(tenantId) {
    const queryText = `
      SELECT ac.*, u.username as creator_name, 
             ir.location as incident_location, 
             ir.first_name as incident_first_name, 
             ir.last_name as incident_last_name, 
             ir.intervention_type as incident_type
      FROM accident_scenes ac
      LEFT JOIN users u ON ac.user_id = u.id
      LEFT JOIN incident_reports ir ON ac.report_id = ir.id
      WHERE ac.tenant_id = $1
      ORDER BY ac.created_at DESC;
    `;
    const res = await db.query(queryText, [tenantId]);
    return res.rows;
  }

  /**
   * Busca un croquis de accidente específico por su ID único e ID del inquilino.
   *
   * @param {number} id - ID de la escena.
   * @param {number} tenantId - ID del inquilino para restringir acceso.
   * @returns {Promise<Object|undefined>} La escena encontrada si existe y pertenece al inquilino, o undefined.
   */
  static async findByIdAndTenant(id, tenantId) {
    const queryText = `
      SELECT * FROM accident_scenes 
      WHERE id = $1 AND tenant_id = $2;
    `;
    const res = await db.query(queryText, [id, tenantId]);
    return res.rows[0];
  }

  /**
   * Elimina un croquis del sistema previa comprobación de identidad de inquilino.
   *
   * @param {number} id - ID del croquis.
   * @param {number} tenantId - ID del inquilino.
   * @returns {Promise<Object|undefined>} El registro eliminado si existió.
   */
  static async delete(id, tenantId) {
    const queryText = `
      DELETE FROM accident_scenes 
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;
    const res = await db.query(queryText, [id, tenantId]);
    return res.rows[0];
  }

  /**
   * Actualiza el nombre, los datos vectoriales del lienzo y/o el reporte asociado a una escena existente.
   *
   * @param {number} id - ID único del croquis.
   * @param {number} tenantId - ID del inquilino para aislamiento de datos.
   * @param {Object} fields - Campos actualizables.
   * @param {string} fields.name - Nuevo nombre de la escena.
   * @param {Object|Array} fields.sceneData - Nuevo JSON descriptivo de los elementos del lienzo.
   * @param {number|null} [fields.reportId] - Nuevo reporte asociado (opcional).
   * @returns {Promise<Object>} Retorna el registro actualizado.
   */
  static async update(id, tenantId, { name, sceneData, reportId }) {
    const queryText = `
      UPDATE accident_scenes
      SET name = $1, scene_data = $2, report_id = $3
      WHERE id = $4 AND tenant_id = $5
      RETURNING *;
    `;
    const res = await db.query(queryText, [
      name,
      JSON.stringify(sceneData),
      reportId || null,
      id,
      tenantId
    ]);
    return res.rows[0];
  }
}

module.exports = Scene;
