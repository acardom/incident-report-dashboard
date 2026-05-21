/**
 * @file Footer.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Footer
 * @description Componente del pie de página (Footer) de la aplicación Acciparte.
 * Este componente estático se renderiza en la parte inferior del diseño principal de la aplicación.
 * Proporciona:
 * 1. La indicación de derechos de autor (copyright) calculada dinámicamente según el año actual.
 * 2. Un enlace interactivo y seguro al portfolio personal del autor Alberto Cárdeno Domínguez.
 * 3. Un resumen informativo de las principales tecnologías que componen el stack del proyecto (React, Konva, Node.js y PostgreSQL).
 * Se adapta estéticamente al tema visual del dashboard mediante el uso de variables CSS globales (`var(--border-color)`, `var(--text-muted)`, etc.).
 */

import React from 'react';

/**
 * Componente que renderiza la sección del pie de página de la interfaz de usuario.
 *
 * @returns {JSX.Element} Estructura del pie de página con estilos inline.
 */
const Footer = () => {
  return (
    <footer style={{
      marginTop: '10px',
      padding: '4px 0',
      borderTop: '1px solid var(--border-color)',
      color: 'var(--text-muted)',
      fontSize: '0.8rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Texto de derechos de autor y enlace al portafolio del autor Alberto Cárdeno Domínguez */}
      <span>&copy; {new Date().getFullYear()} <a href="https://cardenoalberto.es" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>albeerto cárdeno domínguez</a> - Reconstrucción de Escenas y Multi-Tenant</span>
      
      {/* Indicador de Stack Tecnológico utilizado */}
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        Tecnología: React + Konva + Node.js + PostgreSQL
      </span>
    </footer>
  );
};

export default Footer;
