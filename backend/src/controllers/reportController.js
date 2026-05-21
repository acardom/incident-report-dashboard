/**
 * @file reportController.js
 * @author Alberto Cárdeno Domínguez
 * @component ReportController
 * @description Controlador de negocio para la gestión CRUD de partes de incidentes (incident_reports).
 * Este módulo contiene las funciones controladoras de Express que interactúan con el modelo `Report`.
 * Implementa un control estricto de aislamiento lógico basándose en el identificador `tenantId`
 * extraído del token JWT del usuario solicitante, impidiendo que usuarios de un espacio de trabajo
 * accedan, modifiquen o eliminen partes correspondientes a otros espacios (inquilinos).
 */

const Report = require('../models/Report');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Crea un nuevo parte de incidente asociado al tenant y usuario autenticados
 * @param {object} req - Objeto de petición Express (contiene cuerpo con datos del incidente)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express para errores
 */
const createReport = async (req, res, next) => {
  const { firstName, lastName, location, incidentTime, interventionType } = req.body;
  // Extraer credenciales inyectadas por el middleware de autenticación JWT
  const { tenantId, id: userId } = req.user;

  // Validación de la presencia de todos los campos obligatorios
  if (!firstName || !lastName || !location || !incidentTime || !interventionType) {
    return next(new AppError('Faltan campos obligatorios para el reporte de incidentes.', 400));
  }

  // Insertar reporte en PostgreSQL
  const report = await Report.create({
    tenantId,
    userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    location: location.trim(),
    incidentTime: new Date(incidentTime),
    interventionType: interventionType.trim()
  });

  res.status(201).json({
    status: 'success',
    data: {
      report
    }
  });
};

/**
 * Obtiene todos los partes de incidentes filtrados automáticamente para el inquilino (Tenant) autenticado
 * @param {object} req - Objeto de petición Express
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const getReports = async (req, res, next) => {
  const { tenantId } = req.user;
  
  // Listar registros en la base de datos pertenecientes únicamente al inquilino autenticado
  const reports = await Report.listByTenant(tenantId);

  res.status(200).json({
    status: 'success',
    results: reports.length,
    data: {
      reports
    }
  });
};

/**
 * Actualiza un parte de incidente existente si pertenece al tenant del usuario autenticado
 * @param {object} req - Objeto de petición Express (contiene id en params y cuerpo de actualización)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const updateReport = async (req, res, next) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { firstName, lastName, location, incidentTime, interventionType } = req.body;

  if (!firstName || !lastName || !location || !incidentTime || !interventionType) {
    return next(new AppError('Faltan campos obligatorios para actualizar el reporte.', 400));
  }

  // Ejecutar actualización con validación de inquilino para evitar accesos cruzados
  const report = await Report.update(id, tenantId, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    location: location.trim(),
    incidentTime: new Date(incidentTime),
    interventionType: interventionType.trim()
  });

  if (!report) {
    return next(new AppError('Reporte no encontrado o no autorizado.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
};

/**
 * Elimina un parte de incidente (y por cascada sus croquis asociados) verificando pertenencia al tenant
 * @param {object} req - Objeto de petición Express (contiene id del reporte en params)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const deleteReport = async (req, res, next) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  // Borrado con protección multi-tenant en base de datos
  const deleted = await Report.delete(id, tenantId);

  if (!deleted) {
    return next(new AppError('Reporte no encontrado o no autorizado.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Reporte eliminado correctamente.'
  });
};

module.exports = {
  createReport,
  getReports,
  updateReport,
  deleteReport
};
