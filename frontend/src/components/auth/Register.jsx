/**
 * @file Register.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Register
 * @description Formulario de registro para la creación de nuevos espacios de trabajo (Tenants) y cuentas de administrador.
 * Este componente proporciona la interfaz de usuario para que una nueva organización se dé de alta.
 * Solicita los metadatos de la organización (Nombre del Tenant y URL Slug para el enrutado multi-tenant)
 * y los detalles de la cuenta del usuario administrador inicial (nombre de operador, correo electrónico y contraseña con re-confirmación).
 * Implementa validaciones frontend rigurosas: formato de email, longitud mínima de la contraseña (8 caracteres) y requisitos de complejidad (mayúsculas, minúsculas y números).
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Componente que renderiza el formulario de registro y creación de inquilinos.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onToggleView - Callback para conmutar a la vista de inicio de sesión.
 * @returns {JSX.Element} Elemento del formulario estructurado.
 */
const Register = ({ onToggleView }) => {
  // Consumir la función de registro desde el contexto de autenticación
  const { register } = useAuth();
  
  // Estados locales para los campos de datos del usuario operador
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados locales para los datos del inquilino (Tenant) a crear
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenantName, setTenantName] = useState('');
  
  // Estado local para alternar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Estados locales de control de flujo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Manejador de envío del formulario de registro.
   * Realiza validaciones locales exhaustivas antes de llamar al backend.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validar que todos los campos requeridos estén llenos
    if (!username || !email || !password || !confirmPassword || !tenantSlug || !tenantName) {
      setError('Por favor complete todos los campos.');
      return;
    }

    // 2. Validación sintáctica de formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor proporcione un correo electrónico válido.');
      return;
    }

    // 3. Validación de longitud mínima de seguridad para la contraseña
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // 4. Validación de complejidad de la contraseña (mayúsculas, minúsculas y dígitos)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError('La contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número.');
      return;
    }

    // 5. Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Intentar realizar el registro del inquilino y operador mediante el backend
      await register(username, email, password, tenantSlug, tenantName);
    } catch (err) {
      // Capturar y propagar el error provisto por el backend (ej. slug ya registrado)
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--primary)' }}>
          Crear Workspace
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Crea un nuevo inquilino y cuenta de administrador
        </p>
      </div>

      {/* Renderizado condicional del banner de error */}
      {error && (
        <div 
          className="animate-slide-down"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '14px',
            borderRadius: '12px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '15px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Error de registro</span>
          </div>
          <span style={{ paddingLeft: '24px', opacity: 0.9 }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Sección: Datos del Tenant (Nombre y URL Slug) en disposición grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre del Tenant</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. Policía Madrid" 
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">URL Slug</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="policia-madrid" 
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Campo: Nombre del Operador */}
        <div className="form-group">
          <label className="form-label">Nombre del Oficial/Usuario</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ej. Oficial Gómez" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Campo: Correo Electrónico Corporativo */}
        <div className="form-group">
          <label className="form-label">Email Corporativo</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="correo@ejemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Campo: Contraseña con Toggle de visualización */}
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="form-input" 
              style={{ paddingRight: '45px' }}
              placeholder="Mín. 8 caracteres (A-Z, a-z, 0-9)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Campo: Repetición/Confirmación de Contraseña */}
        <div className="form-group">
          <label className="form-label">Repetir Contraseña</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Repite la contraseña" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* Botón de envío, deshabilitado si está procesando la llamada al API */}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }} disabled={loading}>
          {loading ? 'Creando espacio...' : 'Registrar'}
        </button>
      </form>

      {/* Enlace para regresar a la vista de inicio de sesión */}
      <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        ¿Ya registrado?{' '}
        <button 
          onClick={onToggleView} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary-hover)', 
            fontWeight: 700, 
            cursor: 'pointer',
            padding: 0
          }}
        >
          Iniciar Sesión
        </button>
      </p>
    </div>
  );
};

export default Register;
