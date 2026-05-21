/**
 * @file SimulationPanel.jsx
 * @author Alberto Cárdeno Domínguez
 * @component SimulationPanel
 * @description Panel flotante de simulación interactiva para pruebas rápidas y demostración de aislamiento multi-tenant.
 * Este componente es una herramienta de asistencia para la evaluación técnica. Permite al usuario:
 * 1. Conectarse de forma instantánea ("One-Click Login") utilizando cuentas preconfiguradas de demostración
 *    (Policía Local Madrid y Bomberos Barcelona) sin necesidad de rellenar manualmente los formularios.
 * 2. Si las cuentas demo no existen en una base de datos recién inicializada, el simulador las registra automáticamente
 *    a través del API antes de realizar el inicio de sesión.
 * 3. Probar el aislamiento físico/lógico del Backend alternando entre inquilinos ("Probar Aislamiento") mientras se está
 *    autenticado, demostrando de forma reactiva cómo cambian los croquis y partes listados.
 * 4. Visualizar resúmenes de seguridad sobre las cabeceras JWT y las políticas RLS (Row-Level Security) activas en el sistema.
 */

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, RefreshCw, LogIn, Building, UserCheck, X } from 'lucide-react';
import api from '../../services/api';

/**
 * Componente que renderiza el panel flotante de simulación y acceso rápido multi-tenant.
 *
 * @returns {JSX.Element} Panel interactivo flotante (FAB + Cajón lateral).
 */
const SimulationPanel = () => {
  // Consumir estados y métodos del contexto de autenticación global
  const { user, tenant, logout, login, isAuthenticated } = useAuth();
  
  // Estados locales para controlar la visibilidad del panel y las animaciones de transición
  const [isOpen, setIsOpen] = useState(false);
  const [buttonTextState, setButtonTextState] = useState('closed');
  const [isTextVisible, setIsTextVisible] = useState(true);
  
  // Gestión de errores y estado de carga de peticiones HTTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Referencia para limpiar y controlar temporizadores de animación
  const timeoutRef = useRef(null);

  /**
   * Alterna la apertura y cierre del panel lateral aplicando una pequeña demora
   * para coordinar las transiciones de texto (fade in/out) del botón flotante.
   */
  const toggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    setIsTextVisible(false); // Ocultar el texto inmediatamente para iniciar la animación

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Esperar a que termine la transición de opacidad antes de cambiar el texto y rediseñar el botón
    timeoutRef.current = setTimeout(() => {
      setButtonTextState(nextOpen ? 'open' : 'closed');
      setIsTextVisible(true); // Mostrar el nuevo texto con una suave transición
    }, 350);
  };

  // Contraseña común utilizada por conveniencia para las cuentas de simulación
  const password = 'password123';

  // Configuración de las dos organizaciones (Tenants) de demostración predefinidas
  const demoAccounts = {
    'policia-madrid': {
      name: 'Policía Local Madrid',
      email: 'contacto@policiamadrid.es',
      username: 'Agente Madrid',
      password: 'password123',
    },
    'bomberos-bcn': {
      name: 'Bomberos Barcelona',
      email: 'bombers@barcelona.cat',
      username: 'Oficial Bombers',
      password: 'password123',
    }
  };

  /**
   * Realiza el inicio de sesión rápido. Si detecta que el usuario de demostración
   * no existe en la base de datos (por ejemplo, en instalaciones limpias), realiza
   * el alta de forma transparente y seguidamente inicia sesión.
   *
   * @param {string} slug - Identificador único de la organización demo ('policia-madrid' o 'bomberos-bcn').
   */
  const handleQuickLogin = async (slug) => {
    setError('');
    setLoading(true);
    const demo = demoAccounts[slug];
    try {
      // 1. Intentar inicio de sesión directo con la cuenta de demostración
      await login(demo.email, password, slug);
    } catch (err) {
      // 2. Si falla debido a que el usuario no existe (error de credenciales en base de datos limpia), registrar automáticamente
      try {
        await api.post('/auth/register', {
          username: demo.username,
          email: demo.email,
          password: password,
          tenantSlug: slug,
          tenantName: demo.name
        });
        // 3. Re-intentar el inicio de sesión inmediatamente después de registrar la organización y usuario
        await login(demo.email, password, slug);
      } catch (regErr) {
        // Capturar cualquier error de red o base de datos en caso de fallo crítico
        setError('Error al iniciar simulación: ' + (regErr.response?.data?.message || regErr.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón de Acción Flotante (FAB) con cambios de color y ancho adaptativo según estado */}
      <button 
        className="simulator-fab" 
        onClick={toggleOpen}
        title="Panel de Simulación Multi-Tenant"
        style={{ 
          border: isOpen ? '2px solid var(--primary)' : '2px solid var(--secondary)',
          width: isOpen ? '160px' : '205px'
        }}
      >
        <div className={`fab-content ${!isTextVisible ? 'hidden' : ''}`}>
          {buttonTextState === 'open' ? (
            <>
              <X size={16} />
              <span>Cerrar Simulador</span>
            </>
          ) : (
            <>
              <Shield size={16} style={{ color: 'var(--secondary)' }} />
              <span>Simulador Multi-Tenant</span>
            </>
          )}
        </div>
      </button>

      {/* Panel deslizante lateral (Drawer) del simulador */}
      {isOpen && (
        <div className="glass-panel simulator-drawer" style={{ textAlign: 'left' }}>
          
          {/* Cabecera del panel con icono e indicador */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Simulador Tenant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Renderizado condicional según el estado de sesión */}
          {isAuthenticated ? (
            // A. VISTA CUANDO EL OPERADOR ESTÁ AUTENTICADO
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Bloque Informativo sobre el Contexto de la Sesión Activa */}
              <div style={{ background: 'rgba(5, 7, 12, 0.45)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Building size={13} />
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Workspace Actual:</span>
                </div>
                <p style={{ color: 'var(--secondary)', fontWeight: 800, paddingLeft: '19px', marginTop: '2px' }}>
                  {tenant?.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>({tenant?.slug})</span>
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  <UserCheck size={13} />
                  <span style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Usuario Conectado:</span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, paddingLeft: '19px', marginTop: '2px' }}>
                  {user?.username} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({user?.role})</span>
                </p>
              </div>

              {/* Explicación Técnica de la Capa de Seguridad Activa */}
              <div style={{
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                <strong>Seguridad Activa:</strong> Las consultas a la base de datos están limitadas mediante filtrado estricto al <strong>Tenant ID: {tenant?.id}</strong>.
              </div>

              {/* Banner de error para fallos en cambios rápidos de tenant */}
              {error && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px', textAlign: 'center' }}>
                  {error}
                </p>
              )}

              {/* Acciones Rápidas: Botón para alternar inquilinos y botón de salida */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '8px', marginTop: '4px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.78rem', padding: '8px 6px', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleQuickLogin(tenant?.slug === 'policia-madrid' ? 'bomberos-bcn' : 'policia-madrid')}
                  disabled={loading}
                  title="Cambia al otro inquilino demo para comprobar que los datos están 100% aislados"
                >
                  <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none', color: 'var(--secondary)' }} /> Probar Aislamiento (Demo)
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={logout}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            // B. VISTA CUANDO NO HAY SESIÓN ACTIVA (Acceso rápido por botones)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.8rem' }}>
                Prueba el aislamiento de datos alternando entre estos dos Tenants preconfigurados de demostración:
              </p>
              
              {/* Botones de Acceso Rápido con gradientes personalizados diferenciados */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ justifyContent: 'flex-start', background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', boxShadow: 'none' }}
                  onClick={() => handleQuickLogin('policia-madrid')}
                  disabled={loading}
                >
                  <LogIn size={14} /> Policía Local Madrid
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ justifyContent: 'flex-start', background: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)', boxShadow: 'none' }}
                  onClick={() => handleQuickLogin('bomberos-bcn')}
                  disabled={loading}
                >
                  <LogIn size={14} /> Bomberos Barcelona
                </button>
              </div>

              {/* Visualización de errores si falla el auto-registro o login */}
              {error && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>
                  {error}
                </p>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                O crea tu propio Tenant rellenando el formulario de registro.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SimulationPanel;
