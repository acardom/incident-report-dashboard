/**
 * @file SaveExportPanel.jsx
 * @author Alberto Cárdeno Domínguez
 * @component SaveExportPanel
 * @description Panel lateral de administración, guardado y exportación de croquis vectoriales.
 * Este componente permite al usuario:
 * 1. Asignar o editar el nombre del croquis actual.
 * 2. Buscar, filtrar y asociar el croquis a un parte de incidente específico del Tenant.
 * 3. Ejecutar la acción de guardado en la base de datos remota mediante el API, controlando estados de carga y éxito.
 * 4. Exportar los datos vectoriales del lienzo en formato plano JSON para su posterior importación o respaldo.
 * 5. Descargar la representación gráfica del croquis como una imagen en alta definición PNG.
 * Integra un control dropdown personalizado y un buscador interactivo para optimizar la selección de partes de incidentes.
 */

import React from 'react';
import { Search, ChevronDown, Save, CheckCircle, Download } from 'lucide-react';

/**
 * Componente que renderiza el panel de persistencia y exportación del editor.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.sceneName - Nombre del croquis asignado por el usuario.
 * @param {Function} props.setSceneName - Callback para actualizar el nombre del croquis.
 * @param {number|string} props.associatedReportId - ID del parte de incidente asociado al croquis.
 * @param {Function} props.setAssociatedReportId - Callback para actualizar la asociación del parte.
 * @param {Array<Object>} props.reports - Listado de partes de incidentes disponibles en el Tenant.
 * @param {string} props.reportSearchQuery - Texto de búsqueda para filtrar los partes.
 * @param {Function} props.setReportSearchQuery - Callback para actualizar la búsqueda de partes.
 * @param {boolean} props.isDropdownOpen - Estado de apertura del menú desplegable de partes.
 * @param {Function} props.setIsDropdownOpen - Callback para alternar la visibilidad del menú desplegable.
 * @param {React.RefObject} props.dropdownRef - Referencia de React para gestionar clics fuera del dropdown.
 * @param {Function} props.saveToDatabase - Acción para guardar la escena actual en la base de datos remota.
 * @param {Function} props.exportJSON - Acción para descargar los metadatos vectoriales en un archivo JSON.
 * @param {Function} props.exportImage - Acción para descargar la representación visual en un archivo PNG.
 * @param {boolean} props.loading - Indicador de procesamiento activo para el guardado.
 * @param {boolean} props.saveSuccess - Indicador de éxito tras realizar el guardado.
 * @param {string} props.error - Mensaje de error a mostrar si el guardado falla.
 * @returns {JSX.Element} Panel de guardado y botones de exportación.
 */
const SaveExportPanel = ({
  sceneName,
  setSceneName,
  associatedReportId,
  setAssociatedReportId,
  reports,
  reportSearchQuery,
  setReportSearchQuery,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  saveToDatabase,
  exportJSON,
  exportImage,
  loading,
  saveSuccess,
  error
}) => {
  // Buscar el parte de incidente seleccionado actualmente en base a su ID
  const selectedReport = reports.find(r => String(r.id) === String(associatedReportId));
  const isValidReportSelected = !!selectedReport;
  
  // Texto dinámico para el trigger del dropdown (muestra info detallada si hay selección)
  const triggerText = isValidReportSelected
    ? `${selectedReport.intervention_type} - ${selectedReport.first_name} ${selectedReport.last_name} - ${selectedReport.location} (${new Date(selectedReport.incident_time).toLocaleDateString()})`
    : '-- Selecciona un parte --';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sección 1: Formulario de Conexión y Guardado en Base de Datos */}
      <div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
          Guardar Escena
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Campo de Texto: Nombre identificativo para el croquis de accidente */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre del Croquis</label>
            <input
              type="text"
              className="form-input"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
            />
          </div>

          {/* Campo de Selección: Parte de Incidente Relacionado con buscador integrado */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Parte de Incidente Relacionado</label>
            
            {/* Input interactivo para realizar búsquedas instantáneas */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar incidente..."
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Contenedor del dropdown customizado */}
            <div className="custom-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className="custom-dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  borderColor: error && !associatedReportId ? 'var(--error)' : 'var(--border-color)'
                }}
              >
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginRight: '8px',
                  color: selectedReport ? 'var(--text-primary)' : 'var(--text-muted)'
                }}>
                  {triggerText}
                </span>
                <ChevronDown size={16} style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  color: 'var(--text-muted)'
                }} />
              </button>

              {/* Menú desplegable con listado filtrado de partes de incidentes */}
              {isDropdownOpen && (
                <div className="custom-dropdown-menu animate-slide-down">
                  {reports.length === 0 ? (
                    // Mostrar si no hay partes registrados en la base de datos del Tenant
                    <div style={{ padding: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                      No hay partes disponibles. Cree uno primero.
                    </div>
                  ) : (
                    <>
                      {/* Filtrar y mapear partes de incidentes que coincidan con la búsqueda */}
                      {reports
                        .filter((rep) => {
                          const repDate = new Date(rep.incident_time).toLocaleDateString();
                          const searchStr = `${rep.intervention_type} ${rep.first_name} ${rep.last_name} ${rep.location} ${repDate}`.toLowerCase();
                          return searchStr.includes(reportSearchQuery.toLowerCase());
                        }).length === 0 ? (
                        // Caso cuando la búsqueda no coincide con ningún registro
                        <div style={{ padding: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                          No se encontraron resultados
                        </div>
                      ) : (
                        // Renderizar los elementos que cumplen la búsqueda
                        reports
                          .filter((rep) => {
                            const repDate = new Date(rep.incident_time).toLocaleDateString();
                            const searchStr = `${rep.intervention_type} ${rep.first_name} ${rep.last_name} ${rep.location} ${repDate}`.toLowerCase();
                            return searchStr.includes(reportSearchQuery.toLowerCase());
                          })
                          .map((rep) => {
                            const isSelected = String(rep.id) === String(associatedReportId);
                            return (
                              <button
                                key={rep.id}
                                type="button"
                                className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setAssociatedReportId(rep.id);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'left', display: 'block' }}>
                                  {rep.intervention_type} - {rep.first_name} {rep.last_name}
                                </span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.8, textAlign: 'left', display: 'block' }}>
                                  {rep.location} ({new Date(rep.incident_time).toLocaleDateString()})
                                </span>
                              </button>
                            );
                          })
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gestión de notificaciones visuales de error o éxito */}
          {error && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</span>}
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> Escena guardada en base de datos.
            </span>
          )}

          {/* Advertencia visual si no se ha asociado a ningún parte de incidente */}
          {(!isValidReportSelected || reports.length === 0) && (
            <span style={{ color: 'var(--warning, #f59e0b)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              ⚠️ Necesita crear y seleccionar un parte de incidente para poder guardar la escena.
            </span>
          )}

          {/* Botón principal de guardado en la nube */}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }} onClick={saveToDatabase} disabled={loading || !isValidReportSelected || reports.length === 0}>
            <Save size={16} /> Guardar en la Nube
          </button>
        </div>
      </div>

      {/* Sección 2: Panel de Exportación y Descarga de Archivos */}
      <div style={{ marginTop: 'auto' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
          Exportación
        </h3>
        
        {/* Botones organizados en cuadrícula de 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Exportación a JSON */}
          <button className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.8rem' }} onClick={exportJSON}>
            <Download size={14} /> Exportar JSON
          </button>
          
          {/* Descarga directa de la imagen PNG */}
          <button className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem' }} onClick={exportImage}>
            <Download size={14} /> Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveExportPanel;
