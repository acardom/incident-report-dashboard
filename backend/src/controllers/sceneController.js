/**
 * @file sceneController.js
 * @author Alberto Cárdeno Domínguez
 * @component SceneController
 * @description Controlador de negocio para la administración del ciclo de vida de croquis (scenes).
 * Provee la lógica de enrutamiento Express para almacenar y manipular la estructura geométrica JSON
 * generada por el lienzo interactivo del editor. Integra el control de acceso multi-tenant validando
 * el `tenantId` en cada operación de creación, consulta, modificación y borrado físico, garantizando
 * el aislamiento estricto de los croquis y permitiendo asociarlos opcionalmente a un parte de incidente específico.
 */

const Scene = require('../models/Scene');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Guarda / Crea un nuevo croquis de escena de accidente vinculado al tenant y usuario autenticados
 * @param {object} req - Objeto de petición Express (contiene nombre, datos estructurados JSON del croquis y ID del reporte)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const createScene = async (req, res, next) => {
  const { name, sceneData, reportId } = req.body;
  const { tenantId, id: userId } = req.user;

  // Validación de la presencia del nombre y los elementos serializados del lienzo
  if (!name || !sceneData) {
    return next(new AppError('El nombre de la escena y el modelo de datos (JSON) son requeridos.', 400));
  }

  // Insertar croquis en base de datos
  const scene = await Scene.create({
    tenantId,
    userId,
    reportId,
    name: name.trim(),
    sceneData
  });

  res.status(201).json({
    status: 'success',
    data: {
      scene
    }
  });
};

/**
 * Obtiene todos los croquis guardados para el inquilino (Tenant) autenticado
 * @param {object} req - Objeto de petición Express
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const getScenes = async (req, res, next) => {
  const { tenantId } = req.user;

  // Consultar croquis asociados únicamente al Tenant actual
  const scenes = await Scene.listByTenant(tenantId);

  res.status(200).json({
    status: 'success',
    results: scenes.length,
    data: {
      scenes
    }
  });
};

/**
 * Actualiza un croquis de escena de accidente existente
 * @param {object} req - Objeto de petición Express
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const updateScene = async (req, res, next) => {
  const { id } = req.params;
  const { name, sceneData, reportId } = req.body;
  const { tenantId } = req.user;

  if (!name || !sceneData) {
    return next(new AppError('El nombre de la escena y el modelo de datos (JSON) son requeridos.', 400));
  }

  // Actualizar datos del croquis en base de datos con verificación de aislamiento
  const updated = await Scene.update(parseInt(id), tenantId, {
    name: name.trim(),
    sceneData,
    reportId
  });

  if (!updated) {
    return next(new AppError('No se encontró el croquis o no pertenece a este inquilino.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { scene: updated }
  });
};

/**
 * Elimina un croquis de escena de accidente guardado
 * @param {object} req - Objeto de petición Express
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const deleteScene = async (req, res, next) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  // Ejecución de borrado en la base de datos validando el inquilino
  const deletedScene = await Scene.delete(parseInt(id), tenantId);

  if (!deletedScene) {
    return next(new AppError('No se encontró el croquis o no pertenece a este inquilino.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Croquis eliminado correctamente'
  });
};

module.exports = {
  createScene,
  getScenes,
  updateScene,
  deleteScene
};
