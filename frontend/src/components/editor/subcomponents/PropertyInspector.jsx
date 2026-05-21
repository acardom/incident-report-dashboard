/**
 * @file PropertyInspector.jsx
 * @author Alberto Cárdeno Domínguez
 * @component PropertyInspector
 * @description Panel inspector de propiedades para el elemento seleccionado activamente en el lienzo de reconstrucción.
 * Este componente permite al usuario ajustar de forma dinámica los atributos visuales y posicionales del elemento
 * seleccionado (vehículos, texto, señales de tráfico, líneas de referencia, etc.). 
 * Ofrece controles interactivos tales como:
 * 1. Campo de texto dinámico para notas o edición de límites de velocidad en señales.
 * 2. Paleta interactiva para la selección de color del elemento (vehículos, texto o líneas).
 * 3. Deslizador (range slider) para el control preciso de la rotación en un rango de 0° a 360°.
 * 4. Indicadores de coordenadas (X, Y) para conocer la posición exacta del elemento en el canvas de Konva.
 * Si no hay ningún elemento seleccionado, el componente muestra un mensaje explicativo invitando a seleccionar uno.
 */

import React from 'react';

/**
 * Componente que renderiza los controles de edición de propiedades para elementos del lienzo.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.selectedElement - Objeto que representa el elemento seleccionado actualmente en el lienzo.
 * @param {Function} props.handleElementChange - Función callback para notificar y persistir los cambios del elemento en el lienzo.
 * @returns {JSX.Element} Panel con controles de formulario o mensaje de selección.
 */
const PropertyInspector = ({ selectedElement, handleElementChange }) => {
  // Si no hay ningún elemento seleccionado en el lienzo, mostrar un panel vacío con un texto indicativo
  if (!selectedElement) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selecciona un elemento en el lienzo para ajustar sus propiedades.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera del Inspector de Propiedades */}
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
        Propiedades Elemento
      </h3>
      
      {/* Contenedor principal de controles con espacio vertical uniforme */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
        
        {/* Mostrar el tipo de elemento seleccionado formateado */}
        <div>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo</label>
          <p style={{ color: 'var(--secondary)', fontWeight: 600 }}>{selectedElement.type.replace('_', ' ').toUpperCase()}</p>
        </div>

        {/* Control dinámico para entrada de texto: notas de texto o límites de velocidad en señales */}
        {selectedElement.type === 'text' || selectedElement.type === 'sign_speed' ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>
              {selectedElement.type === 'sign_speed' ? 'Límite de Velocidad (Km/h)' : 'Contenido de Nota'}
            </label>
            <input
              type="text"
              className="form-input"
              value={selectedElement.text || ''}
              onChange={(e) => handleElementChange({ ...selectedElement, text: e.target.value })}
            />
          </div>
        ) : null}

        {/* Selector de color interactivo si el elemento admite cambios de color (vehículos, texto o líneas) */}
        {selectedElement.type.startsWith('vehicle') || selectedElement.type === 'text' || selectedElement.type.startsWith('ref_line') ? (
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((c) => (
                <button
                  key={c}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: selectedElement.color === c ? '2px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleElementChange({ ...selectedElement, color: c })}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Deslizador de ajuste preciso para la rotación (0 a 360 grados) */}
        <div>
          <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Rotación</span>
            <span>{Math.round(selectedElement.rotation)}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={selectedElement.rotation}
            onChange={(e) => handleElementChange({ ...selectedElement, rotation: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Indicadores numéricos de posición (coordenadas X e Y) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <span className="form-label" style={{ fontSize: '0.7rem' }}>Posición X</span>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedElement.x}</p>
          </div>
          <div style={{ flex: 1 }}>
            <span className="form-label" style={{ fontSize: '0.7rem' }}>Posición Y</span>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedElement.y}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInspector;
