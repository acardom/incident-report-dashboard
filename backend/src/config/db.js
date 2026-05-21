/**
 * @file db.js
 * @author Alberto Cárdeno Domínguez
 * @component DbConfig
 * @description Configuración centralizada de la base de datos PostgreSQL.
 * Este archivo gestiona la creación y el mantenimiento de un pool de conexiones (`Pool`)
 * mediante la biblioteca 'pg'. Permite optimizar el rendimiento al reutilizar conexiones
 * activas para realizar consultas concurrentes sobre el esquema de la aplicación.
 * Adicionalmente, maneja la carga de variables de entorno seguras (usuario, contraseña,
 * host, puerto y habilitación de SSL para servicios en la nube como Supabase/Render/AWS).
 */

const { Pool } = require('pg');
require('dotenv').config();

// Inicialización del pool de conexiones PostgreSQL con variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  // Habilitar SSL para entornos de producción/nube que lo requieran
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Evento que se dispara al establecer una nueva conexión en el pool
pool.on('connect', () => {
  console.log('Conectado exitosamente a la base de datos PostgreSQL.');
});

// Evento para capturar y loggear errores graves en conexiones inactivas/background del pool
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de base de datos inactivo:', err);
});

module.exports = {
  // Función auxiliar simplificada para ejecutar consultas directas a través del pool
  query: (text, params) => pool.query(text, params),
  pool
};
