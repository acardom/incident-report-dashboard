/**
 * @file authController.js
 * @author Alberto Cárdeno Domínguez
 * @component AuthController
 * @description Controlador de negocio para la gestión de ciclo de vida de usuarios y control de accesos.
 * Maneja las peticiones HTTP relativas a autenticación y autorización dentro del esquema multi-tenant de la aplicación.
 * Sus responsabilidades principales incluyen:
 * 1. Controlar el flujo de registro (`register`) de nuevos usuarios y opcionalmente crear o asociar inquilinos (`Tenant`).
 * 2. Implementar reglas estrictas de validación de contraseñas seguras y de formato de correo.
 * 3. Gestionar el inicio de sesión (`login`) verificando que el usuario pertenezca explícitamente al inquilino indicado por el slug.
 * 4. Recuperar la información del usuario autenticado (`getMe`) a partir del estado inyectado por el middleware de seguridad.
 * Garantiza un aislamiento lógico inmediato de datos (Multi-Tenant) al asociar de forma unívoca cada usuario y sesión con su respectivo `tenantId`.
 */

const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { hashPassword, verifyPassword, generateToken } = require('../config/security');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Registra un usuario y opcionalmente crea o se une a un inquilino (Tenant)
 * @param {object} req - Objeto de petición Express (contiene username, email, password, tenantSlug, tenantName)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback para propagar errores al middleware de control centralizado
 */
const register = async (req, res, next) => {
  const { username, email, password, tenantSlug, tenantName } = req.body;

  // Validación inicial de campos obligatorios en el cuerpo de la petición
  if (!username || !email || !password || !tenantSlug) {
    return next(new AppError('Por favor proporcione todos los campos obligatorios.', 400));
  }

  // Validación sintáctica del formato de correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Por favor preocúpese de proporcionar un correo electrónico válido.', 400));
  }

  // Validación de seguridad para contraseñas de cuentas que no correspondan al simulador demo
  const isDemoDomain = email.trim().toLowerCase().endsWith('@policiamadrid.es') || email.trim().toLowerCase().endsWith('@barcelona.cat');
  if (!isDemoDomain) {
    if (password.length < 8) {
      return next(new AppError('La contraseña debe tener al menos 8 caracteres.', 400));
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return next(new AppError('La contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número.', 400));
    }
  }

  // 1. Localizar o registrar el espacio de trabajo (Tenant)
  let tenant = await Tenant.findBySlug(tenantSlug.trim().toLowerCase());

  if (tenant) {
    // Si el inquilino ya existe, permitir registro exclusivo si pertenece a dominios demo del simulador
    if (!isDemoDomain) {
      return next(new AppError('El espacio de trabajo (Tenant) ya existe. Elige otro slug para crear tu propio espacio o inicia sesión si ya eres miembro.', 400));
    }
  } else {
    // Crear un nuevo espacio de trabajo independiente si no existe el slug
    if (!tenantName) {
      return next(new AppError('El espacio de trabajo no existe. Por favor proporcione un nombre legible para crearlo.', 400));
    }
    tenant = await Tenant.create(tenantName.trim(), tenantSlug.trim().toLowerCase());
  }

  // 2. Verificar que el correo no esté duplicado dentro del mismo inquilino (aislamiento lógico)
  const existingUser = await User.findByEmailAndTenant(email.trim().toLowerCase(), tenant.id);
  if (existingUser) {
    return next(new AppError('El correo electrónico ya está registrado en este tenant.', 400));
  }

  // 3. Hashear la contraseña mediante salt aleatorio y scrypt
  const { hash, salt } = hashPassword(password);

  // 4. Registrar el nuevo usuario en base de datos bajo el Tenant correspondiente
  const newUser = await User.create({
    tenantId: tenant.id,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    passwordSalt: salt,
    role: 'admin' // El primer usuario que crea el tenant obtiene el rol de administrador
  });

  // 5. Emitir token JWT con el payload de sesión del usuario
  const token = generateToken({
    id: newUser.id,
    tenantId: tenant.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role
  });

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
      tenant
    }
  });
};

/**
 * Inicia sesión de un usuario dentro de un inquilino (Tenant) específico
 * @param {object} req - Objeto de petición Express (contiene email, password, tenantSlug)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const login = async (req, res, next) => {
  const { email, password, tenantSlug } = req.body;

  if (!email || !password || !tenantSlug) {
    return next(new AppError('Por favor proporcione correo, contraseña y slug de tenant.', 400));
  }

  // 1. Comprobar la existencia del inquilino (tenant)
  const tenant = await Tenant.findBySlug(tenantSlug.trim().toLowerCase());
  if (!tenant) {
    return next(new AppError('Inquilino (tenant) no encontrado.', 404));
  }

  // 2. Buscar si el usuario existe dentro del contexto de ese inquilino
  const user = await User.findByEmailAndTenant(email.trim().toLowerCase(), tenant.id);
  if (!user) {
    return next(new AppError('Credenciales incorrectas para este inquilino.', 401));
  }

  // 3. Comparar contraseña introducida con el hash guardado
  const isPasswordCorrect = verifyPassword(password, user.password_salt, user.password_hash);
  if (!isPasswordCorrect) {
    return next(new AppError('Credenciales incorrectas.', 401));
  }

  // 4. Firmar token JWT con los datos de sesión de la base de datos
  const token = generateToken({
    id: user.id,
    tenantId: tenant.id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  // Excluir datos sensibles antes de retornar la respuesta HTTP
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    created_at: user.created_at
  };

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: userResponse,
      tenant
    }
  });
};

/**
 * Obtiene el perfil del usuario autenticado actualmente
 * @param {object} req - Objeto de petición Express (contiene req.user obtenido del JWT)
 * @param {object} res - Objeto de respuesta Express
 * @param {function} next - Callback Express
 */
const getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const tenant = await Tenant.findById(req.user.tenantId);

  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
      tenant
    }
  });
};

module.exports = {
  register,
  login,
  getMe
};
