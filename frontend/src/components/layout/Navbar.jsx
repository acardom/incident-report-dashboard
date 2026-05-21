/**
 * @file Navbar.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Navbar
 * @description Barra de navegación superior (Header/Navbar) de la interfaz de usuario de Acciparte.
 * Este componente proporciona la barra de control e identidad visual en la parte superior de la aplicación.
 * Sus funcionalidades clave incluyen:
 * 1. Logotipo corporativo interactivo que permite regresar rápidamente a la pantalla de control principal (Dashboard) mediante la función `onNavigateHome`.
 * 2. Visualización reactiva del perfil del operador actualmente conectado (`user.username`).
 * 3. Identificación visual clara de la organización o espacio de trabajo activo (`tenant.name`), reforzando el contexto multi-tenant.
 * 4. Botón de desconexión rápida (Cerrar Sesión / Salir) que invoca la función `logout` para limpiar de forma segura el estado de autenticación.
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import Logo from '../../assets/Logo.svg';

/**
 * Componente que renderiza la barra de navegación superior.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.user - Objeto con la información del operador autenticado (nombre, rol, etc.).
 * @param {Object} props.tenant - Objeto con la información del inquilino u organización activa.
 * @param {Function} props.logout - Función callback para cerrar sesión y purgar credenciales.
 * @param {Function} props.onNavigateHome - Función callback para regresar al Dashboard.
 * @returns {JSX.Element} Estructura del Header con panel de vidrio (glass-panel).
 */
const Navbar = ({ user, tenant, logout, onNavigateHome }) => {
  return (
    <header className="glass-panel" style={{
      margin: '20px 0',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      borderRadius: '12px',
      minHeight: '68px'
    }}>
      {/* Contenedor del Logotipo e Identidad Visual. Al hacer clic redirige al panel de control */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={onNavigateHome}
      >
        <img src={Logo} alt="Acciparte Logo" style={{ height: '32px' }} />
        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
          Acciparte
        </span>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px', color: 'var(--text-primary)', borderLeft: '1px solid var(--border-color)', paddingLeft: '10px' }}>
          reconstruct
        </span>
      </div>

      {/* Sección Derecha: Resumen del perfil de usuario y botón de salida */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '24px', padding: '12px 0' }}>
        
        {/* Información textual del Operador y de la Organización (Tenant) activa */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right', fontSize: '0.85rem' }}>
          <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tenant?.name}</span>
        </div>

        {/* Botón de acción para el cierre de sesión persistente */}
        <button 
          className="btn-logout" 
          onClick={logout}
          style={{
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px'
          }}
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </header>
  );
};

export default Navbar;
