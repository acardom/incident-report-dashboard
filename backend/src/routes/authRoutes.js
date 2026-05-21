/**
 * @file authRoutes.js
 * @author Alberto Cárdeno Domínguez
 * @component AuthRoutes
 * @description Definición de rutas y endpoints de Express para autenticación y gestión de sesiones.
 * Este archivo enruta las solicitudes HTTP relacionadas con la gestión de usuarios hacia sus correspondientes
 * controladores de autenticación. Define las rutas públicas para el autoregistro de operadores y el inicio de sesión (login),
 * así como la ruta privada protegida mediante middleware para recuperar la información del perfil del operador autenticado actual (/me).
 */

const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Inicialización del router de Express
const router = express.Router();

// Ruta de autoregistro de nuevos operadores vinculados a un inquilino
router.post('/register', register);

// Ruta de autenticación que genera el JWT de acceso
router.post('/login', login);

// Ruta protegida que recupera el perfil detallado del operador autenticado
router.get('/me', protect, getMe);

module.exports = router;
