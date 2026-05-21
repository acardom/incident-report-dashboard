/**
 * @file Toolbar.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Toolbar
 * @description Barra de herramientas de control para el lienzo interactivo de reconstrucción.
 * Este componente proporciona al operador los controles fundamentales de edición del lienzo:
 * 1. Control del Zoom: Acercar, alejar y centrar vista (restablecer zoom y coordenadas a los valores por defecto).
 * 2. Rejilla Magnética (Snap to Grid): Alternar alineación de elementos a la cuadrícula de 20px para un posicionamiento ordenado.
 * 3. Modo de Dibujo Libre (Freehand): Activar/desactivar el modo de dibujo a mano alzada en el canvas.
 * 4. Selector de Parámetros de Dibujo: Controlar de manera reactiva el color de la línea y el grosor del trazo (fino, medio, grueso, extra).
 * 5. Historial de Cambios: Acciones de deshacer (Undo) y rehacer (Redo) integradas con los atajos de teclado y la pila de estados.
 */

import React from 'react';
import { ZoomIn, ZoomOut, Crosshair, Pencil, RotateCcw, RotateCw } from 'lucide-react';

/**
 * Componente que renderiza los controles del lienzo.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {number} props.zoom - Nivel de escala/zoom actual en el lienzo (ej. 1.0).
 * @param {Function} props.handleZoom - Callback para modificar la escala del lienzo.
 * @param {Function} props.resetStageView - Callback para centrar y restablecer la cámara del lienzo.
 * @param {boolean} props.snapToGrid - Estado que determina si la alineación a cuadrícula está activa.
 * @param {Function} props.setSnapToGrid - Callback para alternar el ajuste magnético de rejilla.
 * @param {boolean} props.isDrawingMode - Estado que determina si el usuario está en el modo de dibujo libre.
 * @param {Function} props.setIsDrawingMode - Callback para alternar el modo de dibujo libre.
 * @param {string} props.drawColor - Color hexadecimal seleccionado para el trazo libre.
 * @param {Function} props.setDrawColor - Callback para actualizar el color de trazo.
 * @param {number} props.drawStrokeWidth - Grosor en píxeles de la línea de dibujo libre.
 * @param {Function} props.setDrawStrokeWidth - Callback para actualizar el grosor del trazo.
 * @param {Function} props.handleUndo - Función para retroceder en el historial de cambios (Ctrl+Z).
 * @param {Function} props.handleRedo - Función para avanzar en el historial de cambios (Ctrl+Y).
 * @param {number} props.historyStep - Índice del estado actual dentro de la pila de historial.
 * @param {number} props.historyLength - Cantidad total de estados almacenados en el historial.
 * @returns {JSX.Element} Barra de herramientas superior con botones e indicadores.
 */
const Toolbar = ({
  zoom,
  handleZoom,
  resetStageView,
  snapToGrid,
  setSnapToGrid,
  isDrawingMode,
  setIsDrawingMode,
  drawColor,
  setDrawColor,
  drawStrokeWidth,
  setDrawStrokeWidth,
  handleUndo,
  handleRedo,
  historyStep,
  historyLength
}) => {
  return (
    <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '56px' }}>
      
      {/* Sección Izquierda: Zoom, Rejilla y Dibujo Libre */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Controles de Cámara (Zoom In / Out / Reset) */}
        <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} onClick={() => handleZoom(1.15)} title="Acercar">
          <ZoomIn size={16} />
        </button>
        <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} onClick={() => handleZoom(0.85)} title="Alejar">
          <ZoomOut size={16} />
        </button>
        <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} onClick={resetStageView} title="Centrar Vista">
          <Crosshair size={16} />
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom: {Math.round(zoom * 100)}%</span>

        {/* Separador visual */}
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 5px' }} />

        {/* Control: Ajuste magnético a rejilla (Snap) */}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
          Alineación Rejilla (Snap)
        </label>

        {/* Separador visual */}
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 5px' }} />

        {/* Control: Alternador del Modo de Dibujo a Mano Alzada */}
        <button
          className={`btn ${isDrawingMode ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: isDrawingMode ? '1.5px solid var(--secondary)' : '1px solid var(--border-color)'
          }}
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          title="Dibujo a mano alzada en el mapa"
        >
          <Pencil size={14} style={{ color: isDrawingMode ? 'var(--secondary)' : 'var(--text-muted)' }} />
          <span>{isDrawingMode ? 'Modo Dibujo Activo' : 'Dibujo Libre'}</span>
        </button>

        {/* Panel de Opciones de Dibujo (solo visible si el Modo Dibujo está activado) */}
        {isDrawingMode && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            
            {/* Color del Trazo Libre */}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Color:</span>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            />
            
            {/* Grosor de la línea */}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Grosor:</span>
            <select
              value={drawStrokeWidth}
              onChange={(e) => setDrawStrokeWidth(Number(e.target.value))}
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                borderRadius: '4px',
                padding: '2px 4px',
                outline: 'none'
              }}
            >
              <option value={2}>Fino (2px)</option>
              <option value={4}>Medio (4px)</option>
              <option value={8}>Grueso (8px)</option>
              <option value={12}>Extra (12px)</option>
            </select>
          </div>
        )}
      </div>

      {/* Sección Derecha: Botones de Deshacer y Rehacer (Historial) */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Deshacer (se deshabilita si estamos en el estado inicial) */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px', borderRadius: '6px' }}
          onClick={handleUndo}
          disabled={historyStep === 0}
          title="Deshacer (Ctrl+Z)"
        >
          <RotateCcw size={16} />
        </button>
        
        {/* Rehacer (se deshabilita si estamos en el último cambio de la pila) */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px', borderRadius: '6px' }}
          onClick={handleRedo}
          disabled={historyStep >= historyLength - 1}
          title="Rehacer (Ctrl+Y)"
        >
          <RotateCw size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
