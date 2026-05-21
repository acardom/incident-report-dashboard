/**
 * @file security.js
 * @author Alberto Cárdeno Domínguez
 * @component SecurityConfig
 * @description Módulo de utilidades de seguridad criptográfica de la aplicación.
 * Este archivo implementa el hashing de contraseñas mediante el algoritmo derivador de claves
 * `scrypt` provisto por el módulo nativo 'crypto' de Node.js, garantizando resistencia contra
 * ataques de fuerza bruta y de tablas arcoíris mediante el uso de sales (salts) aleatorias de 16 bytes.
 * También gestiona la creación y verificación de tokens de sesión JWT (JSON Web Tokens) usando la clave
 * secreta del sistema, definiendo la firma digital con expiración de 24 horas.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Clave secreta obtenida del entorno o fallback para desarrollo local
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

/**
 * Genera el hash de una contraseña usando scrypt de forma síncrona
 * Genera una sal de 16 bytes aleatorios para mitigar ataques de diccionario.
 * @param {string} password - Contraseña en texto plano introducida por el usuario
 * @returns {{hash: string, salt: string}} Objeto con el hash y el salt resultantes en formato hexadecimal
 */
const hashPassword = (password) => {
  // Generar sal criptográfica aleatoria de 16 bytes
  const salt = crypto.randomBytes(16).toString('hex');
  // Obtener la clave derivada síncrona de 64 bytes
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
};

/**
 * Verifica una contraseña contra el salt y el hash almacenados en la base de datos
 * @param {string} password - Contraseña en texto plano a verificar
 * @param {string} salt - Sal original con la que se hasheó la contraseña
 * @param {string} hash - Hash almacenado a comparar
 * @returns {boolean} True si coinciden, false en caso contrario
 */
const verifyPassword = (password, salt, hash) => {
  // Aplicar el mismo scrypt con la sal almacenada
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === checkHash;
};

/**
 * Genera un token JWT firmado digitalmente para la sesión del usuario
 * @param {object} payload - Datos a codificar dentro del token (ej. userId, tenantId, role)
 * @returns {string} Token firmado con duración de 24 horas
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verifica la validez y firma digital de un token JWT recibido en la cabecera
 * @param {string} token - Token JWT a verificar
 * @returns {object} Payload decodificado del token si la firma es válida
 * @throws {Error} Si el token ha expirado o la firma es inválida
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};
