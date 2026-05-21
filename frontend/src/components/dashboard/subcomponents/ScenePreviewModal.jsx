/**
 * @file ScenePreviewModal.jsx
 * @author Alberto Cárdeno Domínguez
 * @component ScenePreviewModal
 * @description Modal de previsualización que dibuja de forma interactiva una reconstrucción vectorial.
 * Utiliza Konva para instanciar un escenario síncrono (Stage y Layer) de solo lectura, calculando dinámicamente
 * las dimensiones máximas y mínimas de los objetos vectoriales de la escena para aplicar un auto-zoom y
 * centrado perfecto del croquis en el lienzo. Permite además descargar como PNG o cargar en el editor principal.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { Stage, Layer } from 'react-konva';
import CustomShape from '../../editor/CustomShape';

/**
 * Componente modal para visualizar una escena vectorial.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.previewScene - Escena seleccionada para previsualización (o null para ocultar).
 * @param {Function} props.setPreviewScene - Callback para cerrar o alternar la escena de vista previa.
 * @param {Function} props.handleDownloadSceneClick - Callback para descargar la escena mostrada.
 * @param {Function} props.onLoadScene - Callback para cargar la escena en el editor principal de croquis.
 * @returns {JSX.Element|null} Modal estructurado o null si no se ha asignado escena de previsualización.
 */
const ScenePreviewModal = ({ previewScene, setPreviewScene, handleDownloadSceneClick, onLoadScene }) => {
  // Retornar nulo si no hay ninguna escena seleccionada para previsualización
  if (!previewScene) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '640px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Cabecera del modal con nombre del croquis y datos de ubicación del siniestro */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Vista Previa: {previewScene.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
              {previewScene.incident_location ? `Asociado a: ${previewScene.incident_location}` : 'Sin reporte asociado'}
            </p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setPreviewScene(null)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Espacio de trabajo de solo lectura para dibujar la escena con Konva */}
        <div
          className="cad-workspace"
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            height: '360px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {(() => {
            const elements = previewScene.scene_data || [];
            if (elements.length === 0) {
              return (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Escena sin elementos</div>
              );
            }

            // Calcular los límites bounding-box de la escena (x, y mínimos y máximos)
            // de modo que podamos escalar y centrar automáticamente el croquis
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            elements.forEach(el => {
              const ex = el.x !== undefined ? el.x : 0;
              const ey = el.y !== undefined ? el.y : 0;
              if (el.points && el.points.length > 0) {
                // Para líneas manuales (freehand), los puntos son relativos a la coordenada base
                for (let i = 0; i < el.points.length; i += 2) {
                  const px = ex + el.points[i];
                  const py = ey + el.points[i + 1];
                  if (px < minX) minX = px;
                  if (py < minY) minY = py;
                  if (px > maxX) maxX = px;
                  if (py > maxY) maxY = py;
                }
              } else {
                // Para figuras estándar, estimar los límites basados en el centro y las dimensiones
                const w = el.width || (el.radius ? el.radius * 2 : 80);
                const h = el.height || (el.radius ? el.radius * 2 : 80);
                if (ex - w / 2 < minX) minX = ex - w / 2;
                if (ey - h / 2 < minY) minY = ey - h / 2;
                if (ex + w / 2 > maxX) maxX = ex + w / 2;
                if (ey + h / 2 > maxY) maxY = ey + h / 2;
              }
            });

            // Añadir un margen (padding) a los límites calculados
            const padding = 60;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            const sceneW = maxX - minX;
            const sceneH = maxY - minY;

            const previewW = 600;
            const previewH = 340;

            // Calcular factor de escala para ajustar la escena al contenedor del modal
            const scaleX = previewW / sceneW;
            const scaleY = previewH / sceneH;
            const scale = Math.min(scaleX, scaleY, 1.5); // Limitar escala superior a 1.5x

            // Calcular desplazamiento del escenario (Stage offset) para centrado perfecto
            const stageX = -minX * scale + (previewW - sceneW * scale) / 2;
            const stageY = -minY * scale + (previewH - sceneH * scale) / 2;

            return (
              <Stage
                width={previewW}
                height={previewH}
                listening={false} // Desactivar interactividad para solo lectura
                scaleX={scale}
                scaleY={scale}
                x={stageX}
                y={stageY}
              >
                <Layer>
                  {elements.map((el) => (
                    <CustomShape
                      key={el.id}
                      shapeProps={el}
                      isSelected={false}
                    />
                  ))}
                </Layer>
              </Stage>
            );
          })()}
        </div>

        {/* Acciones del pie de página del modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setPreviewScene(null)}
          >
            Cerrar
          </button>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => handleDownloadSceneClick(previewScene)}
          >
            <Download size={14} /> Descargar PNG
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onLoadScene(previewScene);
              setPreviewScene(null);
            }}
          >
            Abrir en Editor
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScenePreviewModal;
