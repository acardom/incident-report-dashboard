/**
 * @file reportRoutes.js
 * @author Alberto Cárdeno Domínguez
 * @component ReportRoutes
 * @description Definición de rutas y endpoints de Express para la gestión de Partes de Incidentes.
 * Este archivo agrupa y expone las rutas RESTful destinadas al ciclo de vida CRUD de los partes de incidentes.
 * Todas las rutas expuestas en este enrutador se encuentran protegidas globalmente por el middleware de autenticación `protect`.
 * Los controladores asociados aplican de forma automática la segmentación por inquilino (`tenantId`) inyectada en la sesión del operador.
 */

const express = require('express');
const { createReport, getReports, updateReport, deleteReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

// Inicialización del router de Express para partes de incidentes
const router = express.Router();

// Middleware global del router: garantiza protección JWT y lectura de metadatos del inquilino para todas las rutas subsiguientes
router.use(protect);

// Rutas para la raíz de la entidad ('/'): listado de incidentes y creación de nuevos reportes
router.route('/')
  .get(getReports)
  .post(createReport);

// Rutas parametrizadas por ID ('/:id'): modificación y eliminación física de reportes y sus croquis asociados
router.route('/:id')
  .put(updateReport)
  .delete(deleteReport);

module.exports = router;
