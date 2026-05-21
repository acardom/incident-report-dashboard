/**
 * @file index.js
 * @author Alberto Cárdeno Domínguez
 * @component App
 * @description Punto de entrada principal y bootstrap del servidor Express para el Dashboard de Partes de Incidentes.
 * Este archivo inicializa la aplicación Express, configura las directivas de seguridad CORS,
 * establece los middlewares globales de parsing de JSON, y registra los enrutadores principales de la aplicación
 * (/api/auth, /api/reports, /api/scenes). Adicionalmente, implementa un endpoint de health check para monitoreo
 * de salud del servidor y de conectividad con PostgreSQL, gestiona las rutas inexistentes, e instala el manejador
 * de errores centralizado.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('express-async-errors'); // Captura automáticamente los errores en funciones de controladores asíncronos para enviarlos al errorHandler

const db = require('./config/db');
const { errorHandler, AppError } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const sceneRoutes = require('./routes/sceneRoutes');

// Instanciación de la aplicación Express
const app = express();

// Middlewares globales de utilidad y seguridad
app.use(cors({
  origin: '*', // Permitir solicitudes desde cualquier origen para simplificar el despliegue y desarrollo local
  credentials: true
}));
app.use(express.json()); // Parser para analizar los cuerpos de las solicitudes en formato JSON

// Ruta de health check para comprobar que la API y la base de datos están operativas
app.get('/api/health', async (req, res) => {
  try {
    // Probar la conexión ejecutando una consulta simple de tiempo en la base de datos
    const dbTest = await db.query('SELECT NOW()');
    res.status(200).json({
      status: 'success',
      message: 'El servidor está sano',
      dbTime: dbTest.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Fallo en la conexión a la base de datos',
      details: err.message
    });
  }
});

// Registro de las rutas modulares de la API
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/scenes', sceneRoutes);

// Captura de rutas no definidas para retornar error 404 estandarizado
app.all('*', (req, res, next) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl} en este servidor.`, 404));
});

// Middleware final de manejo global de excepciones
app.use(errorHandler);

// Arranque del servidor en el puerto especificado en el entorno
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`El servidor está corriendo en el puerto ${PORT}`);
});
