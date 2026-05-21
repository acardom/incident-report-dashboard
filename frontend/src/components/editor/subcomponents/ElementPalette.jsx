/**
 * @file ElementPalette.jsx
 * @author Alberto Cárdeno Domínguez
 * @component ElementPalette
 * @description Paleta lateral interactiva que contiene la biblioteca de figuras y elementos vectoriales
 * disponibles para reconstruir accidentes de tráfico (vehículos, vías, aceras, señales y obstáculos).
 * Este módulo gestiona:
 * 1. El filtrado en tiempo real de los elementos mediante un buscador de texto.
 * 2. Menús desplegables agrupados por categorías lógicas (Vehículos, Entorno, Señales, etc.).
 * 3. La instanciación reactiva de figuras sobre el lienzo CAD de Konva al hacer clic en los botones.
 */

import React from 'react';
import { Search, Plus, Type, Car, Map, Route, Signpost, AlertTriangle } from 'lucide-react';

/**
 * Componente que renderiza la paleta de elementos arrastrables o insertables.
 *
 * @param {Object} props - Propiedades recibidas del componente editor.
 * @param {Array} props.allAssets - Listado total de objetos vectoriales del catálogo.
 * @param {string} props.assetSearchQuery - Cadena de búsqueda para filtrar la biblioteca.
 * @param {Function} props.setAssetSearchQuery - Callback para actualizar el estado del buscador.
 * @param {Object} props.expandedCategories - Estado de visibilidad de las categorías colapsables.
 * @param {Function} props.toggleCategory - Función para expandir o colapsar una pestaña de la paleta.
 * @param {Function} props.addElement - Callback para insertar una figura específica en el lienzo de Konva.
 * @returns {JSX.Element} Panel lateral con biblioteca de figuras.
 */
const ElementPalette = ({
  allAssets,
  assetSearchQuery,
  setAssetSearchQuery,
  expandedCategories,
  toggleCategory,
  addElement
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
      
      {/* Cabecera del panel y buscador interactivo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Elementos Escena
        </h3>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar elemento..."
            value={assetSearchQuery}
            onChange={(e) => setAssetSearchQuery(e.target.value)}
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
      </div>

      {/* Biblioteca de elementos agrupados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {assetSearchQuery.trim() !== '' ? (
          // Vista filtrada en base a la búsqueda en tiempo real
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allAssets
              .filter(asset => asset.label.toLowerCase().includes(assetSearchQuery.toLowerCase()))
              .map(asset => (
                <button
                  key={asset.type}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }}
                  onClick={() => addElement(asset.type)}
                >
                  <Plus size={12} style={{ color: asset.iconColor }} /> {asset.label}
                </button>
              ))
            }
            {/* Feedback visual si el filtrado no coincide con ningún asset */}
            {allAssets.filter(asset => asset.label.toLowerCase().includes(assetSearchQuery.toLowerCase())).length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                No se encontraron elementos
              </span>
            )}
          </div>
        ) : (
          // Acordeón por categorías lógicas si no hay consulta de búsqueda activa
          <>
            {/* Grupo de Anotaciones y Texto */}
            <div>
              <div
                onClick={() => toggleCategory('text')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.text ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.text ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <Type size={14} style={{ color: expandedCategories.text ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>ANOTACIÓN</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.text ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.text && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('text')}>
                    <Plus size={12} style={{ color: '#a855f7' }} /> Insertar Nota Texto
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Vehículos terrestres */}
            <div>
              <div
                onClick={() => toggleCategory('vehicles')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.vehicles ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.vehicles ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <Car size={14} style={{ color: expandedCategories.vehicles ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>VEHÍCULOS</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.vehicles ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.vehicles && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('vehicle_car')}>
                    <Plus size={12} style={{ color: '#3b82f6' }} /> Coche Turismo
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('vehicle_truck')}>
                    <Plus size={12} style={{ color: '#3b82f6' }} /> Camión / Furgón
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('vehicle_police')}>
                    <Plus size={12} style={{ color: '#3b82f6' }} /> Coche Patrulla
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('vehicle_moto')}>
                    <Plus size={12} style={{ color: '#3b82f6' }} /> Motocicleta
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Entorno, Carreteras y Edificaciones */}
            <div>
              <div
                onClick={() => toggleCategory('env')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.env ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.env ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <Map size={14} style={{ color: expandedCategories.env ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>ENTORNO Y VÍAS</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.env ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.env && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_grass')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Zona Verde (Césped)
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_road_straight')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Carretera Recta
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_road_cross')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Intersección Cruce
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_road_roundabout')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Rotonda
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_sidewalk')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Acera
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_tree')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Árbol
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('env_building')}>
                    <Plus size={12} style={{ color: '#22c55e' }} /> Edificio
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Marcas viales longitudinales y horizontales */}
            <div>
              <div
                onClick={() => toggleCategory('markings')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.markings ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.markings ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <Route size={14} style={{ color: expandedCategories.markings ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>MARCAS VIALES</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.markings ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.markings && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_line_dash')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Línea Discontinua
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_line_solid')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Línea Continua
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_crosswalk')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Paso Peatones
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_traffic_light')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Semáforo
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_arrow')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Flecha Dirección
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_stop_ground')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Suelo: STOP
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_yield_ground')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Suelo: CEDA
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('ref_yellow_grid')}>
                    <Plus size={12} style={{ color: '#cbd5e1' }} /> Cuadrícula Amarilla
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Señalización vertical reguladora */}
            <div>
              <div
                onClick={() => toggleCategory('signs')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.signs ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.signs ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <Signpost size={14} style={{ color: expandedCategories.signs ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>SEÑALES DE TRÁFICO</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.signs ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.signs && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('sign_speed')}>
                    <Plus size={12} style={{ color: '#ef4444' }} /> Señal Velocidad
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('sign_stop')}>
                    <Plus size={12} style={{ color: '#ef4444' }} /> Señal STOP
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('sign_yield')}>
                    <Plus size={12} style={{ color: '#ef4444' }} /> Señal CEDA
                  </button>
                </div>
              )}
            </div>

            {/* Grupo de Obstáculos de carretera */}
            <div>
              <div
                onClick={() => toggleCategory('obstacles')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: expandedCategories.obstacles ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem', color: expandedCategories.obstacles ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <AlertTriangle size={14} style={{ color: expandedCategories.obstacles ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  <span>OBSTÁCULOS</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {expandedCategories.obstacles ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories.obstacles && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', paddingBottom: '8px' }}>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('obstacle_cone')}>
                    <Plus size={12} style={{ color: '#f97316' }} /> Cono Tráfico
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('obstacle_barrier')}>
                    <Plus size={12} style={{ color: '#f97316' }} /> Valla / Barrera
                  </button>
                  <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '6px 12px' }} onClick={() => addElement('obstacle_container')}>
                    <Plus size={12} style={{ color: '#f97316' }} /> Contenedor Basura
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ElementPalette;
