/**
 * @file auth.js
 * @author Alberto Cárdeno Domínguez
 * @component AuthMiddleware
 * @description Middleware de protección mediante JSON Web Tokens (JWT) y control de accesos basado en roles.
 * Este módulo actúa como el guardián de seguridad en la capa de red del backend. Se encarga de interceptar las
 * solicitudes entrantes destinadas a rutas protegidas, verificar la validez de las credenciales firmadas digitalmente,
 * extraer la identidad del usuario y su correspondiente 'tenantId' para garantizar el aislamiento multi-inquilino (multi-tenant),
 * y aplicar restricciones basadas en privilegios de rol (por ejemplo, 'admin', 'operator') sobre endpoints específicos.
 */

const { verifyToken } = require('../config/security');
const { AppError } = require('./errorHandler');

/**
 * Middleware para proteger rutas que requieren autenticación previa.
 * Verifica la existencia y validez de un token JWT en las cabeceras HTTP de autorización (Authorization: Bearer <Token>).
 * Si el token es correcto, inyecta la información decodificada del usuario en el objeto de la solicitud (`req.user`)
 * para su posterior procesamiento en los controladores (incluyendo el ID de inquilino para el aislamiento de datos).
 *
 * @param {Object} req - Objeto de solicitud HTTP de Express.
 * @param {Object} res - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función callback para invocar el siguiente middleware en la cadena.
 * @returns {void} Llama a next() si el token es válido o a next(AppError) si hay fallos de autorización.
 */
const protect = (req, res, next) => {
  try {
    let token;
    // Comprobar si la cabecera Authorization está presente y comienza con la palabra clave 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Extraer el token puro quitando el prefijo 'Bearer '
      token = req.headers.authorization.split(' ')[1];
    }

    // Si no se encuentra ningún token, rechazar la petición con un error de no autorizado (401)
    if (!token) {
      return next(new AppError('No autorizado. Token no proporcionado.', 401));
    }

    // Verificar y decodificar el token utilizando la función segura de configuración
    const decoded = verifyToken(token);

    // Inyectar la información estructurada del usuario autenticado en la solicitud (req.user)
    // Esto incluye el 'tenantId' que es fundamental para filtrar y delimitar los datos de cada cliente
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    // Dar paso al siguiente controlador/middleware en la pila de Express
    next();
  } catch (err) {
    // Si la verificación del token falla (firma inválida, expiración, etc.), retornar un error 401
    return next(new AppError('Token inválido o expirado. Inicie sesión nuevamente.', 401));
  }
};

/**
 * Middleware de control de acceso para restringir endpoints basándose en roles específicos de usuario.
 * Debe ejecutarse obligatoriamente después del middleware `protect`.
 *
 * @param {...string} roles - Lista de roles permitidos (ej. 'admin', 'operator').
 * @returns {Function} Middleware de Express que valida el rol del usuario actual.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Validar que exista un usuario autenticado y que su rol figure dentro de la lista de permitidos
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción.', 403));
    }
    // Si cumple con los requerimientos de rol, continuar con la ejecución
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
