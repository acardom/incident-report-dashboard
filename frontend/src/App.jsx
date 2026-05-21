/**
 * @file App.jsx
 * @author Alberto Cárdeno Domínguez
 * @component App
 * @description Componente raíz del Frontend de la aplicación Acciparte (Incident Report & Reconstructor).
 * Este módulo sirve como punto de entrada de la interfaz de usuario en React, orquestando:
 * 1. El proveedor de contexto global de autenticación (`AuthProvider`).
 * 2. El flujo de vistas según el estado de sesión (Portal de Autenticación / Registro vs. Espacio de Trabajo Principal).
 * 3. La navegación SPA (Single Page Application) interna entre el Panel de Control (Dashboard) y el Lienzo Interactivo 2D (SceneEditor).
 * 4. La inicialización y carga de escenas vectoriales previamente guardadas en la base de datos o su enlace a reportes.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import SceneEditor from './components/editor/SceneEditor';
import SimulationPanel from './components/simulation/SimulationPanel';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Logo from './assets/Logo.svg';
import { CheckCircle } from 'lucide-react';

/**
 * Componente interno que consume el contexto de autenticación y gestiona el enrutamiento visual.
 * 
 * @returns {JSX.Element} Estructura de la aplicación adaptada al estado del usuario.
 */
const AppContent = () => {
  // Consumir el estado de autenticación y carga del operador
  const { isAuthenticated, user, tenant, logout, loading } = useAuth();
  
  // Estado para alternar entre inicio de sesión ('login') y registro ('register') en el portal de acceso
  const [authView, setAuthView] = useState('login'); 
  
  // Estado para la navegación interna de la aplicación: 'dashboard' o 'editor'
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estado que almacena los datos vectoriales de la escena seleccionada para modificar en el editor
  const [loadedScene, setLoadedScene] = useState(null);
  
  // Almacena el ID del parte de incidente que se enlazará por defecto al crear un nuevo croquis
  const [defaultReportId, setDefaultReportId] = useState(null);

  // Renderizar pantalla de carga mientras se verifica el token JWT persistido en el localStorage
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '15px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(139, 92, 246, 0.1)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)' }}>Cargando portal seguro...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Vista de Autenticación / Acceso cuando el operador no ha iniciado sesión
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Fondos decorativos con efectos de brillo y gradiente neon/glassmorphism */}
        <div className="neon-glow-bg" />
        <div className="neon-glow-bg-cyan" />

        {/* Panel de animación interactivo en segundo plano que muestra colisiones físicas */}
        <SimulationPanel />

        <div className={`auth-container ${authView === 'register' ? 'register-mode' : ''}`}>
          {/* Columna Izquierda: Panel informativo sobre las capacidades de la plataforma */}
          <div className="auth-info-pane">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '35px' }}>
                <img src={Logo} alt="Acciparte Logo" style={{ height: '35px', filter: 'brightness(0) invert(1)' }} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
                  ACCIPARTE
                </span>
              </div>

              <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: '16px', letterSpacing: '-0.8px' }}>
                Reconstrucción Vial e Incidentes 2D
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '32px' }}>
                Acceso corporativo seguro al panel de diseño de croquis y administración lógica de partes para aseguradoras, policía y peritos viales.
              </p>

              {/* Listado de características de seguridad y funcionales de la aplicación */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--secondary)', marginTop: '2px' }}>
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Aislamiento Lógico Multi-Tenant</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Garantizado por Row-Level Security en PostgreSQL y JWT. Fugas imposibles.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--secondary)', marginTop: '2px' }}>
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Editor Vectorial Konva 2D</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Dibuja coches, semáforos, marcas y vallas con soporte de escala, rotación e historial.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--secondary)', marginTop: '2px' }}>
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Partes en Dos Pasos (Wizard)</h4>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>Formulario estructurado y validado para la recolección rápida de incidentes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Derechos de autor y enlace al portfolio del creador Alberto Cárdeno Domínguez */}
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Evaluación Técnica &copy; {new Date().getFullYear()} <a href="https://cardenoalberto.es" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>albeerto cárdeno domínguez</a>. Todos los derechos reservados.
            </div>
          </div>

          {/* Columna Derecha: Renderizado del formulario según la subvista seleccionada */}
          <div className="auth-form-pane">
            {authView === 'login' ? (
              <Login onToggleView={() => setAuthView('register')} />
            ) : (
              <Register onToggleView={() => setAuthView('login')} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Panel Principal / Espacio de Trabajo Privado para Operadores Autenticados
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '0 20px' }}>

      {/* Barra de Navegación Superior de la Aplicación */}
      <Navbar
        user={user}
        tenant={tenant}
        logout={logout}
        onNavigateHome={() => { setCurrentView('dashboard'); setLoadedScene(null); }}
      />

      {/* Área del Contenido Principal: Enrutamiento SPA condicional */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'dashboard' ? (
          <Dashboard
            onOpenEditor={(reportId = null) => {
              // Abrir el editor vacío (o enlazado a un reporte específico) para crear un nuevo croquis
              setLoadedScene(null);
              setDefaultReportId(reportId);
              setCurrentView('editor');
            }}
            onLoadScene={(scene) => {
              // Cargar una escena vectorial existente para edición
              setLoadedScene(scene);
              setDefaultReportId(null);
              setCurrentView('editor');
            }}
          />
        ) : (
          <SceneEditor
            initialScene={loadedScene}
            defaultReportId={defaultReportId}
            onBackToDashboard={() => {
              // Regresar al Panel de Control limpiando los estados temporales de edición
              setLoadedScene(null);
              setDefaultReportId(null);
              setCurrentView('dashboard');
            }}
          />
        )}
      </main>

      {/* Pie de página con enlaces institucionales */}
      <Footer />

    </div>
  );
};

/**
 * Componente principal contenedor que envuelve la aplicación en el proveedor de contexto global.
 * 
 * @returns {JSX.Element} Estructura jerárquica con el contexto inicializado.
 */
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
