/**
 * @file Login.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Login
 * @description Formulario de autenticación (Login) para operadores corporativos.
 * Este componente gestiona el formulario de inicio de sesión de la aplicación Acciparte.
 * Recopila tres datos obligatorios: el Workspace ID (slug del inquilino), el correo corporativo y la contraseña.
 * Utiliza el contexto de autenticación global para solicitar el acceso y maneja estados locales de carga,
 * errores de red o credenciales incorrectas, y visibilidad de contraseña (mostrar/ocultar).
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Componente que renderiza el formulario de inicio de sesión.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onToggleView - Callback para alternar a la vista de registro / alta de inquilino.
 * @returns {JSX.Element} Elemento del formulario estructurado.
 */
const Login = ({ onToggleView }) => {
  // Consumir el callback de inicio de sesión desde el contexto
  const { login } = useAuth();
  
  // Estados locales para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  
  // Estado local para alternar la visualización del input de contraseña en texto plano
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados locales de control de flujo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Manejador de envío del formulario de inicio de sesión.
   * Valida la presencia de datos básicos e invoca el login de AuthContext.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de seguridad local antes de despachar la petición
    if (!email || !password || !tenantSlug) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Intentar iniciar sesión contra el backend
      await login(email, password, tenantSlug);
    } catch (err) {
      // Capturar y mostrar errores de validación del backend (ej. contraseña incorrecta)
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--primary)' }}>
          Iniciar Sesión
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Ingresa a tu espacio de trabajo (Tenant)
        </p>
      </div>

      {/* Renderizado condicional del banner de error si falla la autenticación */}
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
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Error de inicio de sesión</span>
          </div>
          <span style={{ paddingLeft: '24px', opacity: 0.9 }}>
            {error === 'Credenciales incorrectas.' || error === 'Credenciales incorrectas para este inquilino.'
              ? 'Algunos de los datos introducidos no son correctos. Por favor, verifica el correo, contraseña o Workspace ID.'
              : error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Campo: Workspace ID (Slug del Tenant) */}
        <div className="form-group">
          <label className="form-label">Workspace ID (Slug)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ej. policia-madrid" 
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            required
          />
        </div>

        {/* Campo: Correo Corporativo */}
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

        {/* Campo: Contraseña con Toggle de visibilidad */}
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="form-input" 
              style={{ paddingRight: '45px' }}
              placeholder="••••••••" 
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

        {/* Botón de envío, deshabilitado durante la carga de red */}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </button>
      </form>

      {/* Enlace para alternar vistas al formulario de registro */}
      <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        ¿No tienes cuenta?{' '}
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
          Crear Workspace
        </button>
      </p>
    </div>
  );
};

export default Login;
