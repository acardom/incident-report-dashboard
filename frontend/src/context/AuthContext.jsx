/**
 * @file AuthContext.jsx
 * @author Alberto Cárdeno Domínguez
 * @component AuthContextProvider
 * @description Contexto de React y hook personalizado para la gestión integral de autenticación y estado del inquilino (Tenant).
 * Este módulo actúa como la única fuente de verdad (Single Source of Truth) para el estado de autenticación de la aplicación en el cliente.
 * Se encarga de:
 * 1. Cargar y parsear de forma síncrona el token JWT y los datos de sesión desde el `localStorage` en el arranque.
 * 2. Realizar peticiones HTTP seguras para autenticar (login) o crear nuevas cuentas y organizaciones (register).
 * 3. Almacenar localmente las credenciales y configurar las cabeceras de autorización de Axios de forma reactiva.
 * 4. Proveer una función limpia de cierre de sesión (logout) que purga el almacenamiento del navegador.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Crear el contexto de autenticación con valor inicial nulo
const AuthContext = createContext(null);

/**
 * Proveedor de contexto que envuelve la aplicación e inyecta los estados de sesión.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que consumen el contexto.
 * @returns {JSX.Element} Proveedor de contexto AuthContext con estados y acciones.
 */
export const AuthProvider = ({ children }) => {
  // Datos del operador autenticado (id, username, email, role)
  const [user, setUser] = useState(null);
  
  // Metadatos de la organización a la que pertenece el usuario (id, name, slug)
  const [tenant, setTenant] = useState(null);
  
  // Token JWT activo usado para autorizar las solicitudes contra el backend
  const [token, setToken] = useState(null);
  
  // Estado de carga inicial mientras se validan y recuperan los datos locales de localStorage
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar leer credenciales guardadas en el almacenamiento persistente del navegador
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');

    // Si existen todos los elementos de sesión requeridos, inicializar el estado del frontend
    if (storedToken && storedUser && storedTenant) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setTenant(JSON.parse(storedTenant));
    }
    // Concluir la fase de inicialización de carga
    setLoading(false);
  }, []);

  /**
   * Realiza el inicio de sesión del operador contra el backend.
   * Envía las credenciales y el identificador de inquilino.
   *
   * @param {string} email - Correo del operador.
   * @param {string} password - Contraseña en texto plano.
   * @param {string} tenantSlug - Slug único del inquilino (ej. 'policia-madrid').
   * @returns {Promise<Object>} Promesa que resuelve a los datos de respuesta de la API.
   */
  const login = async (email, password, tenantSlug) => {
    try {
      const response = await api.post('/auth/login', { email, password, tenantSlug });
      const { token: receivedToken, data } = response.data;
      
      // Persistir información de forma local
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));

      // Actualizar estados reactivos de React
      setToken(receivedToken);
      setUser(data.user);
      setTenant(data.tenant);
      
      return response.data;
    } catch (err) {
      // Retornar mensaje de error amigable provisto por el backend o un fallback por defecto
      throw err.response?.data?.message || 'Error al iniciar sesión';
    }
  };

  /**
   * Registra un nuevo operador de manera síncrona en el sistema.
   * Si se provee un 'tenantSlug' inexistente, el backend creará el inquilino simultáneamente.
   *
   * @param {string} username - Nombre o alias del operador.
   * @param {string} email - Correo electrónico único.
   * @param {string} password - Contraseña de acceso.
   * @param {string} tenantSlug - Slug identificativo de la organización.
   * @param {string} tenantName - Nombre completo descriptivo de la organización.
   * @returns {Promise<Object>} Promesa con los datos del registro y JWT.
   */
  const register = async (username, email, password, tenantSlug, tenantName) => {
    try {
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        tenantSlug, 
        tenantName 
      });
      const { token: receivedToken, data } = response.data;

      // Persistir sesión de manera local tras un registro exitoso
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));

      // Actualizar estados locales de la aplicación
      setToken(receivedToken);
      setUser(data.user);
      setTenant(data.tenant);

      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Error al registrar usuario';
    }
  };

  /**
   * Cierra la sesión activa del operador limpiando el almacenamiento local
   * y reestableciendo todos los estados de React a nulo.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  // Empaquetar valores y callbacks para consumo del contexto
  const value = {
    user,
    tenant,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado que permite a cualquier componente acceder rápidamente a las propiedades de autenticación.
 * Lanza un error descriptivo si se intenta consumir fuera de un AuthProvider.
 *
 * @returns {Object} Contexto de autenticación activo (usuario, inquilino, funciones de login/logout, etc.).
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
