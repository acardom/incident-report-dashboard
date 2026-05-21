/**
 * @file schema.sql
 * @author Alberto Cárdeno Domínguez
 * @description Script SQL de definición de datos (DDL) e inicialización para la base de datos PostgreSQL.
 * Este archivo establece la estructura relacional que soporta la funcionalidad multi-tenant de la aplicación.
 * Define cuatro tablas principales:
 * 1. `tenants`: Representa los inquilinos u organizaciones independientes.
 * 2. `users`: Operadores asociados a un inquilino con control de acceso basado en contraseñas cifradas.
 * 3. `incident_reports`: Partes de incidentes redactados por operadores, ligados a un inquilino.
 * 4. `accident_scenes`: Croquis interactivos almacenados en formato JSONB vinculados a un reporte y a un inquilino.
 * Además, incluye índices optimizados para búsquedas frecuentes por `tenant_id` y datos de semilla de ejemplo.
 */

-- Eliminar tablas en orden inverso de dependencias si existen (para reinicio fácil en desarrollo)
DROP TABLE IF EXISTS accident_scenes CASCADE;
DROP TABLE IF EXISTS incident_reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 1. Tabla de Inquilinos (Tenants)
-- Almacena las organizaciones clientes que acceden al sistema de manera aislada.
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Nombre comercial o institucional (ej. 'Policía Local de Sevilla')
    slug VARCHAR(50) UNIQUE NOT NULL, -- Slug usado en subdominios o URLs de enrutado (ej. 'policia-sevilla')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para optimizar la resolución del inquilino a partir de la ruta URL
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- 2. Tabla de Usuarios (Users)
-- Operadores del sistema asociados obligatoriamente a un único inquilino.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- Clave foránea al inquilino (eliminación en cascada)
    username VARCHAR(50) NOT NULL, -- Nombre completo o alias del operador
    email VARCHAR(100) NOT NULL, -- Correo para inicio de sesión
    password_hash VARCHAR(255) NOT NULL, -- Hash derivado de la contraseña
    password_salt VARCHAR(100) NOT NULL, -- Sal aleatoria utilizada en la derivación de clave
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')), -- Rol de privilegios
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email) -- El email es único dentro de cada inquilino
);

-- Índice para acelerar la búsqueda de usuarios dentro de un inquilino específico
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 3. Tabla de Partes de Incidentes (Incident Reports)
-- Registros de sucesos e intervenciones que redactan los operadores del sistema.
CREATE TABLE incident_reports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- Aislamiento por inquilino
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Operador que redactó el reporte (pasa a NULL si el operador se elimina)
    first_name VARCHAR(100) NOT NULL, -- Nombre del afectado/implicado
    last_name VARCHAR(100) NOT NULL, -- Apellidos del afectado/implicado
    location VARCHAR(255) NOT NULL, -- Lugar geográfico o coordenadas del suceso
    incident_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Fecha y hora real del incidente
    intervention_type VARCHAR(100) NOT NULL, -- Categoría de la intervención (médica, vial, orden público)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para optimizar consultas de reportes filtrados por inquilino
CREATE INDEX idx_reports_tenant ON incident_reports(tenant_id);

-- 4. Tabla de Croquis de Accidentes (Accident Scenes)
-- Diagramas interactivos vectoriales creados con Konva.js asociados a un parte de incidente.
CREATE TABLE accident_scenes (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- Aislamiento por inquilino
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Diseñador del diagrama
    report_id INTEGER REFERENCES incident_reports(id) ON DELETE CASCADE, -- Relación directa con el parte de incidente (eliminación en cascada)
    name VARCHAR(150) NOT NULL, -- Nombre descriptivo del croquis (ej. 'Colisión Rotonda Principal')
    scene_data JSONB NOT NULL, -- Estructura de datos JSON enriched que contiene las formas, vehículos y señales del lienzo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para optimizar consultas de croquis filtrados por inquilino
CREATE INDEX idx_scenes_tenant ON accident_scenes(tenant_id);

-- Datos de semilla (Inquilinos iniciales para pruebas del sistema)
INSERT INTO tenants (name, slug) VALUES 
('Policía Local Madrid', 'policia-madrid'),
('Bomberos Barcelona', 'bomberos-bcn');

-- Nota de seguridad:
-- Los usuarios y contraseñas no se inyectan directamente en este script de base de datos SQL
-- para permitir el autoregistro seguro y dinámico por medio del formulario web del frontend,
-- evitando almacenar secretos de forma estática en el código del esquema.
