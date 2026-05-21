/**
 * @file CroquisGrid.jsx
 * @author Alberto Cárdeno Domínguez
 * @component CroquisGrid
 * @description Panel lateral del dashboard que renderiza una cuadrícula con el listado de croquis viales y
 * escenas de reconstrucción vectorial del inquilino (Tenant). Permite realizar búsquedas interactivas en tiempo
 * real por nombre, ubicación e involucrados, previsualizar la escena de Konva, descargar en PNG y borrar.
 */

import React from 'react';
import { Search, PenTool, Eye, Download, Trash2 } from 'lucide-react';

/**
 * Componente que renderiza el listado y filtro de croquis guardados.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.scenes - Listado completo de escenas/croquis del Tenant.
 * @param {string} props.sceneSearchQuery - Cadena de búsqueda para filtrar escenas.
 * @param {Function} props.setSceneSearchQuery - Callback para actualizar la cadena de búsqueda.
 * @param {Array} props.filteredScenes - Lista ya filtrada de escenas que cumplen el criterio de búsqueda.
 * @param {Function} props.onLoadScene - Callback para cargar la escena en el editor vectorial.
 * @param {Function} props.setPreviewScene - Callback para asignar la escena activa en el modal de vista previa.
 * @param {Function} props.handleDownloadSceneClick - Callback para descargar la escena como imagen PNG.
 * @param {Function} props.handleDeleteSceneClick - Callback para solicitar la eliminación de la escena.
 * @returns {JSX.Element} Panel lateral con buscador y tarjetas de croquis.
 */
const CroquisGrid = ({
  scenes,
  sceneSearchQuery,
  setSceneSearchQuery,
  filteredScenes,
  onLoadScene,
  setPreviewScene,
  handleDownloadSceneClick,
  handleDeleteSceneClick
}) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', gap: '16px' }}>
      
      {/* Cabecera del panel lateral con contador de croquis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Croquis Guardados</h3>
        <span className="badge badge-cyan">{scenes.length} diseños</span>
      </div>

      {/* Buscador de croquis */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Buscar croquis..."
          value={sceneSearchQuery}
          onChange={(e) => setSceneSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px 6px 30px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Listado con scroll vertical dedicado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
        {filteredScenes.length === 0 ? (
          // Vista vacía cuando no hay resultados de búsqueda o croquis creados
          <div style={{ padding: '40px 20px', color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            Ninguna escena guardada.
          </div>
        ) : (
          // Mapear cada una de las escenas encontradas
          filteredScenes.map((scene) => (
            <div key={scene.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              
              {/* Metadatos básicos: nombre de la reconstrucción y fecha de creación */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{scene.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(scene.created_at).toLocaleDateString()}</span>
              </div>
              
              {/* Relación con reporte y su localización si está vinculada */}
              {scene.incident_location && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Asociado a: {scene.incident_first_name ? `${scene.incident_first_name} ${scene.incident_last_name} (${scene.incident_type}) en ` : ''}{scene.incident_location}
                </span>
              )}

              {/* Botonera de acciones específicas del croquis */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                {/* Botón para cargar en el lienzo de edición */}
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
                  onClick={() => onLoadScene(scene)}
                  title="Abrir en Editor"
                >
                  <PenTool size={14} />
                  <span>Editar</span>
                </button>
                
                {/* Botón para abrir el modal de vista previa rápida de Konva */}
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setPreviewScene(scene)}
                  title="Visualizar Croquis"
                >
                  <Eye size={15} />
                </button>

                {/* Botón para descargar el croquis como imagen PNG */}
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleDownloadSceneClick(scene)}
                  title="Descargar PNG"
                >
                  <Download size={15} />
                </button>

                {/* Botón de borrado permanente con colores de alerta */}
                <button 
                  className="btn btn-danger" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    padding: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    color: '#fca5a5' 
                  }}
                  onClick={() => handleDeleteSceneClick(scene.id)}
                  title="Eliminar Croquis"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CroquisGrid;
