/**
 * @file api.js
 * @author Alberto Cárdeno Domínguez
 * @component ApiService
 * @description Cliente HTTP unificado utilizando la biblioteca Axios para interactuar con la API Rest del backend.
 * Este módulo configura:
 * 1. La URL base a partir de variables de entorno (`import.meta.env.VITE_API_URL`) con fallback a localhost.
 * 2. Un interceptor de solicitudes salientes que extrae dinámicamente el token JWT almacenado en `localStorage` e inyecta la cabecera `Authorization`.
 * 3. Un interceptor de respuestas entrantes que monitorea códigos de error HTTP de autenticación (ej. 401 Unauthorized), procediendo al cierre forzado de sesión y redireccionamiento en caso de expiración de token.
 */

import axios from 'axios';

// Definición del punto de acceso base para las llamadas HTTP de la API REST
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear una instancia de Axios con valores por defecto reutilizables
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones salientes.
 * Inserta automáticamente la cabecera 'Authorization' con el esquema Bearer
 * si el operador dispone de una sesión activa (token presente en localStorage).
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas entrantes.
 * Captura errores de red e intercepta de forma reactiva respuestas con código de estado 401 (No autorizado).
 * Si ocurre esto, purga de forma segura las credenciales obsoletas del almacenamiento local del navegador
 * y redirige al usuario a la vista de login si se encuentra en otra ubicación.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpiar datos obsoletos de sesión local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');

      // Forzar la recarga hacia la raíz para inducir la visualización del portal de acceso
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
