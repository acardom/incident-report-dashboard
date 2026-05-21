/**
 * @file IncidentList.jsx
 * @author Alberto Cárdeno Domínguez
 * @component IncidentList
 * @description Subcomponente para el dashboard principal que renderiza una tabla interactiva
 * con el listado completo de partes e incidentes creados bajo el Tenant. Ofrece controles de filtrado rápido
 * por tipo de incidente, búsqueda por texto de operadores/localizaciones, edición de metadatos del siniestro,
 * borrado físico y la creación directa de un croquis vectorial enlazado al parte correspondiente.
 */

import React from 'react';
import { Search, Filter, MapPin, Calendar, Edit2, Trash2, PenTool } from 'lucide-react';

/**
 * Componente que renderiza la lista y filtros para partes de incidente.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.reports - Listado completo de reportes del Tenant.
 * @param {string} props.searchQuery - Filtro de búsqueda por texto.
 * @param {Function} props.setSearchQuery - Callback para cambiar el filtro de texto.
 * @param {string} props.selectedFilterType - Tipo de siniestro seleccionado en el filtro.
 * @param {Function} props.setSelectedFilterType - Callback para cambiar el tipo de siniestro del filtro.
 * @param {Array} props.filteredReports - Lista ya filtrada de reportes que coinciden con los criterios de búsqueda.
 * @param {Function} props.handleEditClick - Callback para activar la edición de un reporte.
 * @param {Function} props.handleDeleteClick - Callback para confirmar el borrado de un reporte.
 * @param {Function} props.onOpenEditor - Callback para ir al editor de croquis (pasando opcionalmente el ID del reporte).
 * @returns {JSX.Element} Panel principal con la tabla de partes de siniestros.
 */
const IncidentList = ({
  reports,
  searchQuery,
  setSearchQuery,
  selectedFilterType,
  setSelectedFilterType,
  filteredReports,
  handleEditClick,
  handleDeleteClick,
  onOpenEditor
}) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        
        {/* Cabecera con título de sección y contador interactivo de registros */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Partes de Incidentes</h3>
          <span className="badge badge-purple">{filteredReports.length} de {reports.length} reportes</span>
        </div>

        {/* Campos de Búsqueda y Filtro rápido */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Barra de búsqueda con lupa integrada */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, ubicación o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Menú desplegable para filtrado según tipo de intervención */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Filter size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              value={selectedFilterType}
              onChange={(e) => setSelectedFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 24px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="Todos" style={{ backgroundColor: 'var(--bg-main)' }}>Todos los tipos</option>
              <option value="Accidente de Tráfico" style={{ backgroundColor: 'var(--bg-main)' }}>Accidente de Tráfico</option>
              <option value="Incendio y Salvamento" style={{ backgroundColor: 'var(--bg-main)' }}>Incendio y Salvamento</option>
              <option value="Intervención Sanitaria / Médica" style={{ backgroundColor: 'var(--bg-main)' }}>Intervención Sanitaria</option>
              <option value="Rescate Técnico / Rescate de Montaña" style={{ backgroundColor: 'var(--bg-main)' }}>Rescate Técnico</option>
              <option value="Control de Sustancias Peligrosas" style={{ backgroundColor: 'var(--bg-main)' }}>Sustancias Peligrosas</option>
              <option value="Apoyo Logístico / Protección Civil" style={{ backgroundColor: 'var(--bg-main)' }}>Protección Civil</option>
              <option value="Orden Público / Seguridad Vial" style={{ backgroundColor: 'var(--bg-main)' }}>Seguridad Vial</option>
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '0.75rem' }}>
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Tabla responsiva para visualizar los partes de incidentes */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      {filteredReports.length === 0 ? (
        // Mensaje cuando ningún parte coincide con la búsqueda
        <div style={{ padding: '40px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
          No se encontraron partes de incidentes con los filtros aplicados.
        </div>
      ) : (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Reportante</th>
              <th>Ubicación</th>
              <th>Fecha/Hora</th>
              <th>Intervención</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((rep) => (
              <tr key={rep.id}>
                {/* Nombre completo del reportante o involucrado */}
                <td style={{ fontWeight: 600 }}>{rep.first_name} {rep.last_name}</td>
                
                {/* Ubicación del incidente con icono de marcador */}
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <MapPin size={12} color="var(--text-secondary)" /> {rep.location}
                  </span>
                </td>
                
                {/* Fecha y hora del siniestro formateada */}
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <Calendar size={12} color="var(--text-secondary)" /> {new Date(rep.incident_time).toLocaleString()}
                  </span>
                </td>
                
                {/* Etiqueta distintiva del tipo de intervención */}
                <td>
                  <span className="badge badge-cyan">{rep.intervention_type}</span>
                </td>
                
                {/* Botones de acción contextuales */}
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                    {/* Botón para editar metadatos del parte */}
                    <button
                      className="btn btn-secondary"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleEditClick(rep)}
                      title="Modificar Parte de Incidente"
                    >
                      <Edit2 size={15} />
                    </button>
                    
                    {/* Botón para borrar lógicamente/físicamente el parte */}
                    <button
                      className="btn btn-danger"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                      onClick={() => handleDeleteClick(rep.id)}
                      title="Eliminar Parte de Incidente"
                    >
                      <Trash2 size={15} />
                    </button>
                    
                    {/* Botón para saltar directamente al editor con preselección del ID de este parte */}
                    <button
                      className="btn btn-primary"
                      style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => onOpenEditor(rep.id)}
                      title="Crear Croquis Relacionado"
                    >
                      <PenTool size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default IncidentList;
