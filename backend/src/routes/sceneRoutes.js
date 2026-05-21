/**
 * @file sceneRoutes.js
 * @author Alberto Cárdeno Domínguez
 * @component SceneRoutes
 * @description Definición de rutas y endpoints de Express para la gestión de Croquis/Escenas de Accidente.
 * Este archivo establece las rutas RESTful para administrar los diagramas interactivos y vectoriales de accidentes.
 * Al igual que los reportes, el acceso a estas rutas está protegido mediante el middleware `protect`.
 * Asegura que todas las acciones de lectura, escritura y borrado se ejecuten exclusivamente en el contexto del
 * inquilino correspondiente, previniendo fugas de datos entre organizaciones ajenas.
 */

const express = require('express');
const { createScene, getScenes, updateScene, deleteScene } = require('../controllers/sceneController');
const { protect } = require('../middlewares/auth');

// Inicialización del router de Express para croquis y escenas
const router = express.Router();

// Middleware global del router: garantiza protección JWT y lectura de metadatos del inquilino para todas las rutas subsiguientes
router.use(protect);

// Rutas para la raíz de la entidad ('/'): obtención y registro de escenas de accidente
router.route('/')
  .get(getScenes)
  .post(createScene);

// Rutas parametrizadas por ID ('/:id'): modificación y eliminación de escenas específicas
router.route('/:id')
  .put(updateScene)
  .delete(deleteScene);

module.exports = router;
