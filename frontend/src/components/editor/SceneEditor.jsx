/**
 * @file SceneEditor.jsx
 * @author Alberto Cárdeno Domínguez
 * @component SceneEditor
 * @description Módulo de control principal para el Lienzo Interactivo y Reconstructor de Accidentes 2D.
 * Este componente orquesta el área de trabajo CAD (Computer-Aided Design) y gestiona:
 * 1. El estado unificado de los elementos vectoriales presentes en la escena.
 * 2. Un sistema completo de deshacer/rehacer (Undo/Redo) mediante un historial lineal de pasos.
 * 3. Los modos de operación interactiva: arrastre y selección estándar vs. modo de dibujo libre a mano alzada.
 * 4. La proyección de coordenadas físicas a virtuales basadas en los niveles de zoom y traslación del canvas (Pan & Zoom).
 * 5. La integración de atajos de teclado globales para mejorar la productividad del perito (Delete, Backspace, Ctrl+Z, Ctrl+Y).
 * 6. La comunicación con los subcomponentes del editor: `ElementPalette` (paleta lateral), `Toolbar` (controles del lienzo),
 *    `PropertyInspector` (editor de atributos del elemento seleccionado) y `SaveExportPanel` (persistencia y exportación en PNG/JSON).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';
import CustomShape from './CustomShape';

// Subcomponentes del editor
import ElementPalette from './subcomponents/ElementPalette';
import Toolbar from './subcomponents/Toolbar';
import PropertyInspector from './subcomponents/PropertyInspector';
import SaveExportPanel from './subcomponents/SaveExportPanel';

// Listado de assets predefinidos organizados por categorías para su inserción en el lienzo
const allAssets = [
  { type: 'text', label: 'Insertar Nota Texto', category: 'text', iconColor: '#a855f7' },
  { type: 'vehicle_car', label: 'Coche Turismo', category: 'vehicles', iconColor: '#3b82f6' },
  { type: 'vehicle_truck', label: 'Camión / Furgón', category: 'vehicles', iconColor: '#3b82f6' },
  { type: 'vehicle_police', label: 'Coche Patrulla', category: 'vehicles', iconColor: '#3b82f6' },
  { type: 'vehicle_moto', label: 'Motocicleta', category: 'vehicles', iconColor: '#3b82f6' },
  { type: 'env_grass', label: 'Zona Verde (Césped)', category: 'env', iconColor: '#22c55e' },
  { type: 'env_road_straight', label: 'Carretera Recta', category: 'env', iconColor: '#22c55e' },
  { type: 'env_road_cross', label: 'Intersección Cruce', category: 'env', iconColor: '#22c55e' },
  { type: 'env_road_roundabout', label: 'Rotonda', category: 'env', iconColor: '#22c55e' },
  { type: 'env_sidewalk', label: 'Acera', category: 'env', iconColor: '#22c55e' },
  { type: 'env_tree', label: 'Árbol', category: 'env', iconColor: '#22c55e' },
  { type: 'env_building', label: 'Edificio', category: 'env', iconColor: '#22c55e' },
  { type: 'ref_line_dash', label: 'Línea Discontinua', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_line_solid', label: 'Línea Continua', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_crosswalk', label: 'Paso Peatones', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_traffic_light', label: 'Semáforo', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_arrow', label: 'Flecha Dirección', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_stop_ground', label: 'Suelo: STOP', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_yield_ground', label: 'Suelo: CEDA', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'ref_yellow_grid', label: 'Cuadrícula Amarilla', category: 'markings', iconColor: '#cbd5e1' },
  { type: 'sign_speed', label: 'Señal Velocidad', category: 'signs', iconColor: '#ef4444' },
  { type: 'sign_stop', label: 'Señal STOP', category: 'signs', iconColor: '#ef4444' },
  { type: 'sign_yield', label: 'Señal Ceda el Paso', category: 'signs', iconColor: '#ef4444' },
  { type: 'obstacle_cone', label: 'Cono de Tráfico', category: 'obstacles', iconColor: '#f97316' },
  { type: 'obstacle_barrier', label: 'Barrera / Valla', category: 'obstacles', iconColor: '#f97316' },
  { type: 'obstacle_container', label: 'Contenedor Residuos', category: 'obstacles', iconColor: '#f97316' }
];

/**
 * Componente SceneEditor.
 *
 * @param {Object} props - Propiedades recibidas del contenedor.
 * @param {Object} props.initialScene - Escena precargada desde la BD para edición (nulo si es nueva).
 * @param {number} props.defaultReportId - ID del reporte asociado por defecto (wizard del dashboard).
 * @param {Function} props.onBackToDashboard - Callback para regresar al panel principal.
 * @returns {JSX.Element} Espacio de trabajo del editor gráfico.
 */
const SceneEditor = ({ initialScene, defaultReportId, onBackToDashboard }) => {
  // Lista de elementos vectoriales cargados en el lienzo
  const [elements, setElements] = useState(initialScene ? initialScene.scene_data : []);
  
  // ID del elemento seleccionado en el lienzo
  const [selectedId, setSelectedId] = useState(null);

  // Control de las pestañas/categorías colapsables de la paleta lateral de assets
  const [expandedCategories, setExpandedCategories] = useState({
    text: false,
    vehicles: false,
    env: false,
    markings: false,
    signs: false,
    obstacles: false
  });

  /**
   * Alterna el estado de expansión de una categoría de la paleta de elementos.
   *
   * @param {string} cat - Nombre identificativo de la categoría.
   */
  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Nombre de la escena actual para almacenamiento y exportación
  const [sceneName, setSceneName] = useState(initialScene ? initialScene.name : 'Escena Accidente 1');
  
  // ID del reporte policial/aseguradora al que pertenece este croquis
  const [associatedReportId, setAssociatedReportId] = useState(
    initialScene ? (initialScene.report_id || '') : (defaultReportId || '')
  );
  
  // Listado total de reportes disponibles en el Tenant para vinculación
  const [reports, setReports] = useState([]);

  // Nivel de zoom aplicado sobre el lienzo de Konva
  const [zoom, setZoom] = useState(1);
  
  // Coordenadas de traslación horizontal y vertical (Pan) del espacio de trabajo
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  // Bandera de ajuste de coordenadas a la rejilla CAD (múltiplos de 20 píxeles)
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Estados que definen la configuración del pincel en el modo dibujo libre
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(4);

  // Referencias mutables para mantener el estado del trazo activo de dibujo
  const isDrawing = useRef(false);
  const currentLineId = useRef(null);

  // Criterios de búsqueda y filtrado interactivo
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Pilas para almacenar el historial de estados de cara a las funciones Deshacer/Rehacer
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Estados de control de peticiones y persistencia
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sceneId, setSceneId] = useState(initialScene ? initialScene.id : null);

  // Control de visibilidad del desplegable para búsqueda y selección de reportes asociados
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Efecto para cerrar el desplegable de partes de incidentes al hacer clic fuera del mismo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Referencias a los contenedores DOM del Canvas para recalcular las dimensiones reactivamente
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 480 });

  // Escuchar cambios de tamaño del navegador para actualizar el contenedor de Konva
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    const timer = setTimeout(updateDimensions, 100);

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Cargar partes de incidentes del Tenant en el arranque para vincular la escena
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data.data.reports);
      } catch (err) {
        console.error('Error fetching reports:', err);
      }
    };
    fetchReports();
  }, []);

  // Atajos de teclado del sistema (Suprimir/Retroceso para borrar, Ctrl+Z deshacer, Ctrl+Y rehacer)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Evitar interceptar atajos si el foco del operador está sobre campos de texto
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteElement(selectedId);
        }
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, elements, history, historyStep]);

  /**
   * Registra una modificación en el lienzo y agrega el nuevo estado a la pila de deshacer,
   * purgando cualquier estado de rehacer obsoleto.
   *
   * @param {Array} newElements - Conjunto actualizado de elementos vectoriales.
   */
  const updateStateAndHistory = (newElements) => {
    setElements(newElements);

    const newHistory = history.slice(0, historyStep + 1);
    setHistory([...newHistory, newElements]);
    setHistoryStep(newHistory.length);
  };

  /**
   * Retrocede un paso en el historial de modificaciones del lienzo.
   */
  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setElements(history[prevStep]);
      setSelectedId(null);
    }
  };

  /**
   * Avanza un paso en el historial de modificaciones del lienzo.
   */
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setElements(history[nextStep]);
      setSelectedId(null);
    }
  };

  /**
   * Añade un nuevo elemento gráfico predefinido en las coordenadas centrales virtuales del lienzo.
   *
   * @param {string} type - Tipo de asset a instanciar (ej. 'vehicle_car', 'ref_traffic_light').
   */
  const addElement = (type) => {
    // Proyectar el centro del lienzo visible teniendo en cuenta el zoom y la traslación actual
    const centerStageX = (-stagePos.x + 300) / zoom;
    const centerStageY = (-stagePos.y + 200) / zoom;

    // Paleta de colores predeterminada por tipo de figura
    const colors = {
      vehicle_car: '#3b82f6',
      vehicle_truck: '#10b981',
      vehicle_police: '#1f2937',
      vehicle_moto: '#ec4899',
      obstacle_cone: '#f97316',
      obstacle_barrier: '#f59e0b',
      ref_line_dash: '#ffffff',
      ref_line_solid: '#ffffff',
      ref_traffic_light: '#1f2937',
      ref_crosswalk: '#ffffff',
      text: '#ffffff'
    };

    const newElement = {
      id: `el_${Date.now()}`,
      type,
      name: `${type.split('_').join(' ')} ${elements.length + 1}`,
      // Alinear opcionalmente a la rejilla de píxeles
      x: snapToGrid ? Math.round(centerStageX / 20) * 20 : centerStageX,
      y: snapToGrid ? Math.round(centerStageY / 20) * 20 : centerStageY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      color: colors[type] || '#ffffff',
      text: type === 'text' ? 'Escribe tu nota aquí' : ''
    };

    updateStateAndHistory([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  /**
   * Elimina de forma lógica un elemento del lienzo basándose en su identificador único.
   *
   * @param {string} id - ID único del elemento a borrar.
   */
  const deleteElement = (id) => {
    const updated = elements.filter(el => el.id !== id);
    updateStateAndHistory(updated);
    setSelectedId(null);
  };

  /**
   * Gestiona el cambio de propiedades individuales de un elemento (posición, escala, color).
   *
   * @param {Object} changedProp - Elemento con sus campos ya modificados.
   */
  const handleElementChange = (changedProp) => {
    let finalProp = { ...changedProp };

    // Si la alineación de rejilla está activa, forzar redondeo a múltiplos de 20px
    if (snapToGrid) {
      finalProp.x = Math.round(finalProp.x / 20) * 20;
      finalProp.y = Math.round(finalProp.y / 20) * 20;
    }

    const updated = elements.map((el) => el.id === changedProp.id ? finalProp : el);
    updateStateAndHistory(updated);
  };

  /**
   * Modifica el factor de escala o nivel de zoom del área de trabajo.
   *
   * @param {number} factor - Coeficiente multiplicador (ej. 1.2 o 0.8).
   */
  const handleZoom = (factor) => {
    setZoom((prev) => Math.max(0.2, Math.min(4, prev * factor)));
  };

  /**
   * Restablece la vista de cámara del editor a su estado por defecto (sin zoom y sin desplazamiento).
   */
  const resetStageView = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  /**
   * Deselecciona cualquier elemento activo al hacer clic en un área vacía de la superficie de dibujo.
   *
   * @param {Object} e - Evento de interacción del ratón de Konva.
   */
  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  /**
   * Manejador de evento lanzado al pulsar el ratón en la superficie para iniciar el trazado de líneas a mano alzada.
   */
  const handleStageMouseDown = (e) => {
    if (!isDrawingMode) {
      checkDeselect(e);
      return;
    }

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Convertir la coordenada física de la pantalla a la coordenada virtual del lienzo escalado
    const x = (point.x - stagePos.x) / zoom;
    const y = (point.y - stagePos.y) / zoom;

    isDrawing.current = true;

    const newLineId = `line_${Date.now()}`;
    currentLineId.current = newLineId;

    const newLine = {
      id: newLineId,
      type: 'freehand_line',
      name: `Trazo libre ${elements.length + 1}`,
      points: [x, y],
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      color: drawColor,
      strokeWidth: drawStrokeWidth
    };

    setElements([...elements, newLine]);
  };

  /**
   * Manejador de evento lanzado al desplazar el cursor para ir agregando puntos a la línea a mano alzada.
   */
  const handleStageMouseMove = (e) => {
    if (!isDrawingMode || !isDrawing.current || !currentLineId.current) {
      return;
    }

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const x = (point.x - stagePos.x) / zoom;
    const y = (point.y - stagePos.y) / zoom;

    setElements(prevElements =>
      prevElements.map(el => {
        if (el.id === currentLineId.current) {
          const currentPoints = el.points;
          const lastX = currentPoints[currentPoints.length - 2];
          const lastY = currentPoints[currentPoints.length - 1];
          // Evitar añadir puntos redundantes si el puntero no se ha desplazado significativamente
          if (lastX !== x || lastY !== y) {
            return {
              ...el,
              points: [...currentPoints, x, y]
            };
          }
        }
        return el;
      })
    );
  };

  /**
   * Finaliza la captura de puntos del trazo libre a mano alzada y guarda el estado en el historial.
   */
  const handleStageMouseUp = () => {
    if (!isDrawingMode || !isDrawing.current) {
      return;
    }
    isDrawing.current = false;
    currentLineId.current = null;

    // Persistir el trazo cerrado en la pila de histórico para permitir su restauración
    setElements(prev => {
      const newHistory = history.slice(0, historyStep + 1);
      setHistory([...newHistory, prev]);
      setHistoryStep(newHistory.length);
      return prev;
    });
  };

  /**
   * Captura el estado gráfico del lienzo y desencadena la descarga de una imagen PNG a alta definición.
   */
  const exportImage = () => {
    setSelectedId(null); // Quitar manejadores de transformación antes de la captura

    setTimeout(() => {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${sceneName}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 100);
  };

  /**
   * Serializa y descarga localmente los datos estructurados en formato JSON.
   */
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const link = document.createElement('a');
    link.download = `${sceneName}.json`;
    link.href = dataStr;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Envía los datos vectoriales del lienzo al backend para almacenarlos asociados a un parte de accidente.
   */
  const saveToDatabase = async () => {
    if (!sceneName.trim()) {
      setError('El nombre de la escena es obligatorio.');
      return;
    }

    const isValidReportSelected = associatedReportId && reports.some(r => String(r.id) === String(associatedReportId));
    if (!isValidReportSelected || reports.length === 0) {
      setError('Seleccione un parte para guardar');
      return;
    }

    setLoading(true);
    setError('');
    setSaveSuccess(false);

    try {
      const payload = {
        name: sceneName.trim(),
        sceneData: elements,
        reportId: associatedReportId ? parseInt(associatedReportId) : null
      };

      if (sceneId) {
        // Actualizar croquis preexistente
        await api.put(`/scenes/${sceneId}`, payload);
      } else {
        // Registrar croquis nuevo y ligar el ID devuelto por el backend
        const res = await api.post('/scenes', payload);
        const newId = res.data?.data?.scene?.id || res.data?.id;
        if (newId) setSceneId(newId);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Seleccione un parte para guardar');
    } finally {
      setLoading(false);
    }
  };

  // Buscar el objeto concreto seleccionado actualmente
  const selectedElement = elements.find(el => el.id === selectedId);

  // Configuración de la rejilla CAD del lienzo
  const gridLines = [];
  const minorSize = 40;   // Intervalo de líneas menores
  const majorSize = 200;  // Intervalo de líneas mayores (más gruesas y visibles)

  // Trazar líneas menores de la cuadrícula
  for (let i = -3000; i < 3000; i += minorSize) {
    if (i % majorSize !== 0) {
      gridLines.push(<Line key={`v-min-${i}`} points={[i, -3000, i, 3000]} stroke="rgba(148, 163, 184, 0.04)" strokeWidth={1} />);
      gridLines.push(<Line key={`h-min-${i}`} points={[-3000, i, 3000, i]} stroke="rgba(148, 163, 184, 0.04)" strokeWidth={1} />);
    }
  }
  // Trazar líneas mayores de la cuadrícula para facilitar la orientación
  for (let i = -3000; i < 3000; i += majorSize) {
    gridLines.push(<Line key={`v-maj-${i}`} points={[i, -3000, i, 3000]} stroke="rgba(148, 163, 184, 0.12)" strokeWidth={1.5} />);
    gridLines.push(<Line key={`h-maj-${i}`} points={[-3000, i, 3000, i]} stroke="rgba(148, 163, 184, 0.12)" strokeWidth={1.5} />);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', textAlign: 'left' }}>
      
      {/* Botón de retorno rápido al Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={onBackToDashboard}>
          ← Volver al Dashboard
        </button>
        <span style={{ marginLeft: '15px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Editor Activo: <strong style={{ color: 'var(--text-primary)' }}>{sceneName}</strong>
        </span>
      </div>

      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: '20px', height: 'calc(100vh - 185px)' }}>

        {/* COLUMNA IZQUIERDA: PALETA DE ELEMENTOS VIALES */}
        <ElementPalette
          allAssets={allAssets}
          assetSearchQuery={assetSearchQuery}
          setAssetSearchQuery={setAssetSearchQuery}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          addElement={addElement}
        />

        {/* COLUMNA CENTRAL: LIENZO INTERACTIVO DE KONVA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Barra de herramientas superior del lienzo */}
          <Toolbar
            zoom={zoom}
            handleZoom={handleZoom}
            resetStageView={resetStageView}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={(mode) => {
              setIsDrawingMode(mode);
              if (mode) setSelectedId(null);
            }}
            drawColor={drawColor}
            setDrawColor={setDrawColor}
            drawStrokeWidth={drawStrokeWidth}
            setDrawStrokeWidth={setDrawStrokeWidth}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            historyStep={historyStep}
            historyLength={history.length}
          />

          {/* Área CAD del Canvas */}
          <div ref={containerRef} className="glass-panel cad-workspace" style={{ flex: 1, overflow: 'hidden', position: 'relative', border: '1px solid var(--border-color)', minHeight: '400px' }}>
            
            {/* Botón flotante de borrado rápido de la selección */}
            {selectedId && (
              <button
                className="btn btn-danger"
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => deleteElement(selectedId)}
                title="Eliminar elemento"
              >
                <Trash2 size={12} /> Eliminar
              </button>
            )}

            {/* Escenario de Konva */}
            <Stage
              ref={stageRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{ position: 'absolute', top: 0, left: 0, cursor: isDrawingMode ? 'crosshair' : 'grab' }}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onTouchStart={handleStageMouseDown}
              onTouchMove={handleStageMouseMove}
              onTouchEnd={handleStageMouseUp}
              scaleX={zoom}
              scaleY={zoom}
              x={stagePos.x}
              y={stagePos.y}
              draggable={!selectedId && !isDrawingMode} // Permitir arrastre global del lienzo solo en modo Pan libre
              onDragEnd={(e) => {
                if (e.target === stageRef.current) {
                  setStagePos({ x: e.target.x(), y: e.target.y() });
                }
              }}
            >
              <Layer>
                {/* Cuadrícula de asistencia */}
                {gridLines}

                {/* Figuras vectoriales instanciadas */}
                {elements.map((el) => (
                  <CustomShape
                    key={el.id}
                    shapeProps={el}
                    isSelected={el.id === selectedId}
                    onSelect={() => setSelectedId(el.id)}
                    onChange={handleElementChange}
                  />
                ))}
              </Layer>
            </Stage>

            {/* Panel de ayuda contextual flotante */}
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'var(--text-muted)', fontSize: '0.75rem', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span>• Arrastra el fondo para moverte (Pan)</span>
              <span>• Haz clic en un elemento para seleccionarlo / rotarlo / escalarlo</span>
              <span>• Usa [Supr] o [Retroceso] para borrar</span>
              <span>• Usa [Ctrl+Z] y [Ctrl+Y] para historial</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PERSISTENCIA E INSPECCIÓN DE PROPIEDADES */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

          {/* Panel de guardado y exportación de croquis */}
          <SaveExportPanel
            sceneName={sceneName}
            setSceneName={setSceneName}
            associatedReportId={associatedReportId}
            setAssociatedReportId={setAssociatedReportId}
            reports={reports}
            reportSearchQuery={reportSearchQuery}
            setReportSearchQuery={setReportSearchQuery}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            dropdownRef={dropdownRef}
            saveToDatabase={saveToDatabase}
            exportJSON={exportJSON}
            exportImage={exportImage}
            loading={loading}
            saveSuccess={saveSuccess}
            error={error}
          />

          {/* Inspector de propiedades físicas de la figura seleccionada */}
          <PropertyInspector
            selectedElement={selectedElement}
            handleElementChange={handleElementChange}
          />

        </div>
      </div>
    </div>
  );
};

export default SceneEditor;

