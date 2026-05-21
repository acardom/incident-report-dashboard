/**
 * @file errorHandler.js
 * @author Alberto Cárdeno Domínguez
 * @component ErrorHandler
 * @description Manejador global de errores y clase de excepción personalizada AppError.
 * Este archivo centraliza la gestión de excepciones de la aplicación, proporcionando una interfaz coherente
 * para capturar, registrar y retornar errores al cliente. Se distingue entre errores "operacionales"
 * (errores previstos en la lógica de negocio, como fallos de validación o credenciales incorrectas)
 * y errores de infraestructura o bugs no controlados (errores de red, base de datos caída, etc.),
 * garantizando que los detalles sensibles del stack trace no se expongan en entornos de producción.
 */

/**
 * Clase de excepción personalizada para representar errores operacionales del sistema.
 * Hereda de la clase nativa Error e inicializa metadatos adicionales para facilitar la respuesta HTTP.
 * 
 * @extends Error
 */
class AppError extends Error {
  /**
   * Crea una instancia de AppError.
   * @param {string} message - Mensaje detallado del error comprensible para el usuario/cliente.
   * @param {number} statusCode - Código de estado HTTP correspondiente (ej. 400, 401, 403, 404, 500).
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // Define el estado como 'fail' (para errores del cliente, 4xx) o 'error' (para errores internos, 5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Identifica que el error es operacional (previsto) y no un fallo de código no controlado
    this.isOperational = true;

    // Captura de forma segura el stack trace omitiendo el constructor de esta clase
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware central de Express para el manejo de errores.
 * Captura todos los errores propagados mediante la función `next(err)` en la cadena de middleware.
 * Registra el fallo en la consola y envía una respuesta formateada en JSON de manera segura.
 *
 * @param {Error|AppError} err - Objeto de error capturado.
 * @param {Object} req - Objeto de solicitud HTTP de Express.
 * @param {Object} res - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función callback para el siguiente middleware (requerido por la firma de Express).
 * @returns {void} Envía una respuesta HTTP estructurada con el código de error y el mensaje.
 */
const errorHandler = (err, req, res, next) => {
  // Establecer valores por defecto si no están definidos en el objeto de error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Mostrar el error completo en la consola del servidor para propósitos de depuración y monitoreo
  console.error('ERROR 💥:', err);

  // Enviar respuesta estructurada al cliente
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Error Interno del Servidor',
    // Incluir la traza de llamadas (stack trace) únicamente si el entorno está configurado en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  errorHandler
};
