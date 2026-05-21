/**
 * @file CustomShape.jsx
 * @author Alberto Cárdeno Domínguez
 * @component CustomShape
 * @description Renderiza y gestiona las distintas formas geométricas y vectoriales
 * personalizadas dentro del lienzo interactivo basado en la librería Konva (react-konva).
 * Este componente soporta múltiples tipos de objetos dibujables en el croquis, tales como:
 * 1. Vehículos (automóviles de pasajeros, camiones de carga articulados, patrullas de policía con sirenas luminiscentes y motocicletas).
 * 2. Elementos urbanos y del entorno (vallas de obras, conos de tráfico reflectantes, parcelas de césped con texturas,
 *    tramos de carretera rectos, intersecciones en cruz, glorietas giratorias, aceras peatonales, vegetación/árboles y estructuras de edificios).
 * 3. Líneas de referencia y señalizaciones (líneas de carril discontinuas o continuas, semáforos verticales tricolores,
 *    pasos de peatones tipo cebra, flechas direccionales, inscripciones de calzada como STOP o Ceda el Paso, y rejillas amarillas de intersección).
 * 4. Dibujo libre a mano alzada y anotaciones de texto configurables.
 *
 * El componente interactúa dinámicamente con los transformadores de Konva, permitiendo al perito o usuario
 * realizar rotaciones, traslaciones y escalados directamente sobre el lienzo, notificando los cambios
 * de vuelta al controlador de la escena a través de callbacks.
 */

import React, { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line, Text, Transformer } from 'react-konva';

/**
 * Componente funcional para renderizar formas e iconos individuales dentro de la escena interactiva.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.shapeProps - Atributos específicos de la figura (tipo, color, posición, dimensiones, rotación, etc.).
 * @param {boolean} props.isSelected - Bandera para indicar si la figura está seleccionada actualmente en el lienzo.
 * @param {Function} props.onSelect - Callback que se ejecuta cuando el usuario hace clic o toca el elemento.
 * @param {Function} props.onChange - Callback invocado para actualizar las propiedades del elemento tras arrastrarlo o escalarlo.
 * @returns {JSX.Element} Fragmento de React con el elemento Konva renderizado y su transformador asociado si procede.
 */
const CustomShape = ({ shapeProps, isSelected, onSelect, onChange }) => {
  // Referencias a los nodos de Konva para vincularlos con el componente Transformer
  const shapeRef = useRef();
  const trRef = useRef();

  // Efecto que controla la visualización del transformador interactivo de escala y rotación
  useEffect(() => {
    if (isSelected) {
      // Adjuntar el nodo de la figura actual al transformador de selección activa
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  /**
   * Manejador de evento lanzado cuando finaliza el arrastre (drag & drop) del componente.
   * Actualiza las coordenadas de la figura en el estado de la escena.
   *
   * @param {Object} e - Evento nativo de arrastre de Konva.
   */
  const handleDragEnd = (e) => {
    onChange({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y()
    });
  };

  /**
   * Manejador lanzado al finalizar una transformación interactiva (escala o rotación).
   * Extrae la escala del nodo para reajustar sus dimensiones y evitar distorsiones de renderizado.
   */
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Notificar al componente padre los nuevos valores espaciales de la figura transformada
    onChange({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: scaleX,
      scaleY: scaleY
    });
  };

  // Desestructuración de propiedades de la figura para simplificar el renderizado vectorial
  const { type, color, x, y, rotation, scaleX = 1, scaleY = 1, text } = shapeProps;

  /**
   * Función interna encargada de construir los nodos gráficos de Konva según la tipología del elemento.
   * 
   * @returns {JSX.Element|null} El elemento vectorial de Konva a dibujar en el lienzo o null en caso de tipo desconocido.
   */
  const renderItem = () => {
    switch (type) {
      // VEHÍCULO: Automóvil estándar de pasajeros
      case 'vehicle_car':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Cuerpo principal o chasis del coche */}
            <Rect width={80} height={40} fill={color || '#ef4444'} cornerRadius={8} stroke="#111827" strokeWidth={2} shadowColor="black" shadowBlur={5} shadowOpacity={0.3} x={-40} y={-20} />
            {/* Parabrisas delantero con efecto de transparencia parcial */}
            <Rect width={15} height={32} fill="#e2e8f0" cornerRadius={2} x={-10} y={-16} opacity={0.8} />
            {/* Luneta trasera de cristal templado */}
            <Rect width={10} height={32} fill="#e2e8f0" cornerRadius={2} x={-30} y={-16} opacity={0.8} />
            {/* Faros delanteros derecho e izquierdo de luz halógena */}
            <Rect width={4} height={8} fill="#fef08a" x={38} y={-16} />
            <Rect width={4} height={8} fill="#fef08a" x={38} y={8} />
            {/* Parachoques delantero que ayuda a denotar la dirección de avance */}
            <Line points={[40, -10, 42, 0, 40, 10]} stroke="#111827" strokeWidth={2} />
          </Group>
        );
      
      // VEHÍCULO: Camión de carga pesada o mercancías
      case 'vehicle_truck':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Contenedor o remolque trasero de gran tamaño */}
            <Rect width={120} height={50} fill={color || '#3b82f6'} cornerRadius={4} stroke="#111827" strokeWidth={2} x={-70} y={-25} shadowColor="black" shadowBlur={6} shadowOpacity={0.3} />
            {/* Cabina motora delantera */}
            <Rect width={30} height={46} fill="#f3f4f6" cornerRadius={4} stroke="#111827" strokeWidth={2} x={50} y={-23} />
            {/* Parabrisas delantero de la cabina */}
            <Rect width={8} height={36} fill="#e2e8f0" x={68} y={-18} opacity={0.9} />
            {/* Indicadores laterales de las ruedas del camión */}
            <Rect width={16} height={4} fill="#111827" x={-50} y={-29} />
            <Rect width={16} height={4} fill="#111827" x={-50} y={25} />
            <Rect width={16} height={4} fill="#111827" x={10} y={-29} />
            <Rect width={16} height={4} fill="#111827" x={10} y={25} />
          </Group>
        );
      
      // VEHÍCULO: Coche de policía / Patrullero de emergencias
      case 'vehicle_police':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Cuerpo del patrullero con color corporativo oscuro */}
            <Rect width={80} height={40} fill="#1f2937" cornerRadius={8} stroke="#111827" strokeWidth={2} x={-40} y={-20} shadowColor="black" shadowBlur={5} shadowOpacity={0.3} />
            {/* Panel de puertas laterales blancas para identificación oficial */}
            <Rect width={30} height={38} fill="#ffffff" x={-15} y={-19} />
            {/* Rótulo de texto oficial 'POLICIA' */}
            <Text text="POLICIA" fontSize={8} fontFamily="Outfit" fontStyle="bold" fill="#1f2937" x={-15} y={-4} align="center" width={30} />
            {/* Parabrisas delantero */}
            <Rect width={14} height={32} fill="#e2e8f0" cornerRadius={2} x={-8} y={-16} opacity={0.8} />
            {/* Sirenas luminosas de emergencia (módulos rojo y azul destellantes) */}
            <Rect width={6} height={16} fill="#ef4444" cornerRadius={1} x={-3} y={-8} />
            <Rect width={6} height={8} fill="#3b82f6" cornerRadius={1} x={-3} y={0} />
          </Group>
        );
      
      // VEHÍCULO: Motocicleta / Ciclomotor
      case 'vehicle_moto':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Chasis principal estilizado de la motocicleta */}
            <Rect width={50} height={12} fill={color || '#10b981'} cornerRadius={3} stroke="#111827" strokeWidth={2} x={-25} y={-6} />
            {/* Neumático delantero */}
            <Circle radius={6} fill="#1f2937" stroke="#111827" strokeWidth={2} x={22} y={0} />
            {/* Neumático trasero */}
            <Circle radius={6} fill="#1f2937" stroke="#111827" strokeWidth={2} x={-22} y={0} />
            {/* Casco/Cuerpo del motorista visto en perspectiva cenital */}
            <Circle radius={7} fill="#f3f4f6" stroke="#111827" strokeWidth={1.5} x={0} y={0} />
          </Group>
        );
      
      // OBSTÁCULO: Cono vial reflectante de seguridad
      case 'obstacle_cone':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Base pesada de soporte de caucho negro */}
            <Rect width={22} height={22} fill="#1f2937" x={-11} y={-11} cornerRadius={2} />
            {/* Cuerpo del cono visto desde arriba con banda reflectante blanca en el medio */}
            <Circle radius={8} fill="#f97316" stroke="#ffffff" strokeWidth={2} x={0} y={0} />
            <Circle radius={4} fill="#ffffff" x={0} y={0} />
          </Group>
        );
      
      // OBSTÁCULO: Barrera / Valla de obras peatonal o vial
      case 'obstacle_barrier':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Cuerpo horizontal de la barrera de seguridad vial */}
            <Rect width={100} height={12} fill="#f59e0b" stroke="#111827" strokeWidth={2} x={-50} y={-6} cornerRadius={2} />
            {/* Rayas reflectantes diagonales de color blanco para advertencia */}
            <Line points={[-40, -4, -32, 4]} stroke="#ffffff" strokeWidth={3} />
            <Line points={[-20, -4, -12, 4]} stroke="#ffffff" strokeWidth={3} />
            <Line points={[0, -4, 8, 4]} stroke="#ffffff" strokeWidth={3} />
            <Line points={[20, -4, 28, 4]} stroke="#ffffff" strokeWidth={3} />
            <Line points={[40, -4, 48, 4]} stroke="#ffffff" strokeWidth={3} />
            {/* Pies metálicos de soporte de la valla */}
            <Rect width={8} height={18} fill="#4b5563" x={-45} y={-9} />
            <Rect width={8} height={18} fill="#4b5563" x={37} y={-9} />
          </Group>
        );
      
      // ENTORNO: Zona ajardinada / Césped
      case 'env_grass':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Superficie base de césped verde */}
            <Rect width={150} height={150} fill="#15803d" cornerRadius={4} opacity={0.6} x={-75} y={-75} stroke="#166534" strokeWidth={1} />
            {/* Pequeños trazos vectoriales que simulan briznas de hierba dispersas */}
            <Line points={[-60, -60, -55, -65]} stroke="#166534" strokeWidth={1.5} />
            <Line points={[50, 40, 55, 35]} stroke="#166534" strokeWidth={1.5} />
            <Line points={[-30, 50, -25, 45]} stroke="#166534" strokeWidth={1.5} />
          </Group>
        );
      
      // ENTORNO: Calzada / Tramo de carretera recto
      case 'env_road_straight':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Superficie de asfalto gris oscuro */}
            <Rect width={240} height={120} fill="#334155" x={-120} y={-60} stroke="#1e293b" strokeWidth={1} />
          </Group>
        );
      
      // ENTORNO: Intersección / Cruce de carreteras
      case 'env_road_cross':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Tramo asfáltico horizontal */}
            <Rect width={240} height={120} fill="#334155" x={-120} y={-60} />
            {/* Tramo asfáltico vertical superpuesto */}
            <Rect width={120} height={240} fill="#334155" x={-60} y={-120} />
          </Group>
        );
      
      // ENTORNO: Rotonda / Glorieta de circulación giratoria
      case 'env_road_roundabout':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Anillo exterior de la calzada circular */}
            <Circle radius={170} fill="#334155" stroke="#1e293b" strokeWidth={1} />
            {/* Isla central de ajardinamiento y señalización perimetral */}
            <Circle radius={50} fill="#15803d" stroke="#64748b" strokeWidth={4} />
            <Circle radius={18} fill="#166534" opacity={0.8} />
          </Group>
        );
      
      // ENTORNO: Acera peatonal
      case 'env_sidewalk':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Acera de hormigón */}
            <Rect width={200} height={40} fill="#cbd5e1" stroke="#475569" strokeWidth={1} x={-100} y={-20} />
            {/* Líneas divisorias verticales que marcan las juntas de las losas de piedra */}
            <Line points={[-60, -20, -60, 20]} stroke="#94a3b8" strokeWidth={1} />
            <Line points={[-20, -20, -20, 20]} stroke="#94a3b8" strokeWidth={1} />
            <Line points={[20, -20, 20, 20]} stroke="#94a3b8" strokeWidth={1} />
            <Line points={[60, -20, 60, 20]} stroke="#94a3b8" strokeWidth={1} />
          </Group>
        );
      
      // ENTORNO: Vegetación / Árbol decorativo o pantalla acústica
      case 'env_tree':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Follaje concéntrico multinivel para simular volumen 3D */}
            <Circle radius={25} fill="#166534" opacity={0.8} stroke="#14532d" strokeWidth={1} />
            <Circle radius={20} fill="#15803d" opacity={0.9} />
            <Circle radius={14} fill="#22c55e" />
            {/* Tronco central visible en perspectiva cenital */}
            <Circle radius={4} fill="#78350f" />
          </Group>
        );
      
      // ENTORNO: Estructura de edificio / Obstáculo sólido de construcción
      case 'env_building':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Contorno del edificio y sombra proyectada */}
            <Rect width={120} height={100} fill="#475569" stroke="#1e293b" strokeWidth={3} x={-60} y={-50} shadowColor="black" shadowBlur={8} shadowOpacity={0.3} />
            <Rect width={110} height={90} fill="#64748b" x={-55} y={-45} />
            {/* Diagonales arquitectónicas cruzadas para simbolizar altura/volumen */}
            <Line points={[-55, -45, 55, 45]} stroke="#475569" strokeWidth={1} />
            <Line points={[-55, 45, 55, -45]} stroke="#475569" strokeWidth={1} />
          </Group>
        );
      
      // OBSTÁCULO: Contenedor urbano de reciclaje o basura
      case 'obstacle_container':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Cubierta principal verde del contenedor */}
            <Rect width={50} height={30} fill="#166534" cornerRadius={3} stroke="#111827" strokeWidth={2} x={-25} y={-15} shadowColor="black" shadowBlur={4} shadowOpacity={0.2} />
            {/* Compartimentos o tapas practicables superiores */}
            <Rect width={22} height={26} fill="#14532d" cornerRadius={1} x={-23} y={-13} />
            <Rect width={22} height={26} fill="#14532d" cornerRadius={1} x={1} y={-13} />
            {/* Asas laterales metálicas para manipulación por el camión de recogida */}
            <Line points={[-25, -5, -28, -5, -28, 5, -25, 5]} stroke="#111827" strokeWidth={1.5} />
            <Line points={[25, -5, 28, -5, 28, 5, 25, 5]} stroke="#111827" strokeWidth={1.5} />
          </Group>
        );
      
      // REFERENCIA: Línea divisoria discontinua de carril
      case 'ref_line_dash':
        return (
          <Line ref={shapeRef} x={x} y={y} points={[-100, 0, 100, 0]} stroke={color || '#ffffff'} strokeWidth={4} dash={[15, 10]} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd} />
        );
      
      // REFERENCIA: Línea continua divisoria de carril o arcén
      case 'ref_line_solid':
        return (
          <Line ref={shapeRef} x={x} y={y} points={[-100, 0, 100, 0]} stroke={color || '#ffffff'} strokeWidth={4} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd} />
        );
      
      // REFERENCIA: Semáforo vertical regulador
      case 'ref_traffic_light':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Poste o soporte metálico de anclaje a tierra */}
            <Rect width={6} height={50} fill="#64748b" x={-3} y={0} />
            {/* Codo o brida de anclaje de la caja */}
            <Rect width={10} height={6} fill="#475569" x={-5} y={0} />
            {/* Caja de óptica estanca del semáforo */}
            <Rect width={18} height={42} fill="#111827" stroke="#374151" strokeWidth={1.5} cornerRadius={4} x={-9} y={-35} shadowColor="black" shadowBlur={4} shadowOpacity={0.2} />
            {/* Foco rojo superior (Fase de parada obligatoria) */}
            <Circle radius={4.5} fill="#ef4444" x={0} y={-26} shadowColor="#ef4444" shadowBlur={10} shadowOpacity={0.9} />
            {/* Foco ámbar/naranja intermedio (Fase de precaución) */}
            <Circle radius={4.5} fill="#f59e0b" x={0} y={-14} shadowColor="#f59e0b" shadowBlur={10} shadowOpacity={0.9} />
            {/* Foco verde inferior (Fase de vía libre) */}
            <Circle radius={4.5} fill="#22c55e" x={0} y={-2} shadowColor="#22c55e" shadowBlur={10} shadowOpacity={0.9} />
          </Group>
        );
      
      // REFERENCIA: Paso de peatones de cebra
      case 'ref_crosswalk':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Franjas paralelas blancas reflectantes */}
            <Rect width={60} height={10} fill="#ffffff" x={-30} y={-35} opacity={0.8} />
            <Rect width={60} height={10} fill="#ffffff" x={-30} y={-20} opacity={0.8} />
            <Rect width={60} height={10} fill="#ffffff" x={-30} y={-5} opacity={0.8} />
            <Rect width={60} height={10} fill="#ffffff" x={-30} y={10} opacity={0.8} />
            <Rect width={60} height={10} fill="#ffffff" x={-30} y={25} opacity={0.8} />
          </Group>
        );
      
      // REFERENCIA: Flecha de dirección o guiado de carril
      case 'ref_arrow':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Vástago o cuerpo lineal de la flecha */}
            <Line points={[-30, 0, 10, 0]} stroke={color || '#ffffff'} strokeWidth={6} />
            {/* Punta de flecha apuntando a la derecha */}
            <Line points={[0, -12, 20, 0, 0, 12]} stroke={color || '#ffffff'} strokeWidth={6} lineCap="round" lineJoin="round" />
          </Group>
        );
      
      // REFERENCIA: Marcación de pare STOP sobre la calzada
      case 'ref_stop_ground':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Letras estiradas verticalmente para corregir el efecto de perspectiva del conductor */}
            <Text text="STOP" fontSize={24} fontFamily="Outfit" fontStyle="bold" fill="#ffffff" opacity={0.8} scaleY={2.2} x={-60} y={-25} align="center" width={120} wrap="none" />
          </Group>
        );
      
      // REFERENCIA: Marcación de Ceda el Paso pintada en calzada
      case 'ref_yield_ground':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Triángulo equilátero invertido característico del Ceda el Paso */}
            <Line points={[-15, 20, 15, 20, 0, -20]} closed stroke="#ffffff" strokeWidth={4} fill="transparent" opacity={0.8} />
          </Group>
        );
      
      // REFERENCIA: Cuadrícula amarilla de no bloquear cruce (Rejilla de intersección)
      case 'ref_yellow_grid':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Marco perimetral amarillo discontinuo */}
            <Rect width={120} height={120} stroke="#eab308" strokeWidth={3} fill="rgba(234, 179, 8, 0.05)" x={-60} y={-60} dash={[8, 4]} />
            {/* Diagonales principales de advertencia */}
            <Line points={[-60, -60, 60, 60]} stroke="#eab308" strokeWidth={2} opacity={0.7} />
            <Line points={[-60, 60, 60, -60]} stroke="#eab308" strokeWidth={2} opacity={0.7} />
            {/* Líneas auxiliares de trama interior de la cuadrícula */}
            <Line points={[-60, -20, 20, 60]} stroke="#eab308" strokeWidth={1.5} opacity={0.6} />
            <Line points={[-20, -60, 60, 20]} stroke="#eab308" strokeWidth={1.5} opacity={0.6} />
            <Line points={[20, -60, -60, 20]} stroke="#eab308" strokeWidth={1.5} opacity={0.6} />
            <Line points={[60, -20, -20, 60]} stroke="#eab308" strokeWidth={1.5} opacity={0.6} />
          </Group>
        );
      
      // SEÑALIZACIÓN: Señal vertical circular de límite de velocidad máxima
      case 'sign_speed':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Borde circular rojo reglamentario */}
            <Circle radius={25} fill="#ef4444" stroke="#b91c1c" strokeWidth={1} shadowColor="black" shadowBlur={3} shadowOpacity={0.2} />
            {/* Disco interior blanco */}
            <Circle radius={18} fill="#ffffff" />
            {/* Texto indicador de velocidad (ej. '50', '30' u '80') */}
            <Text text={text || '50'} fontSize={15} fontFamily="Outfit" fontStyle="bold" fill="#000000" align="center" x={-15} y={-7} width={30} />
          </Group>
        );
      
      // SEÑALIZACIÓN: Señal vertical octogonal de STOP (Parada obligatoria)
      case 'sign_stop':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Trazado octogonal regular rojo con ribete blanco */}
            <Line points={[-10, -24, 10, -24, 24, -10, 24, 10, 10, 24, -10, 24, -24, 10, -24, -10]} closed fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} shadowColor="black" shadowBlur={3} shadowOpacity={0.2} />
            {/* Inscripción interna STOP */}
            <Text text="STOP" fontSize={11} fontFamily="Outfit" fontStyle="bold" fill="#ffffff" align="center" x={-20} y={-5} width={40} />
          </Group>
        );
      
      // SEÑALIZACIÓN: Señal vertical triangular de Ceda el Paso
      case 'sign_yield':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            {/* Triángulo equilátero invertido con orla roja y fondo blanco */}
            <Line points={[-25, -20, 25, -20, 0, 22]} closed fill="#ffffff" stroke="#ef4444" strokeWidth={4} shadowColor="black" shadowBlur={3} shadowOpacity={0.2} />
          </Group>
        );
      
      // ANOTACIÓN: Línea trazada a mano alzada (dibujo libre de huellas, trayectorias)
      case 'freehand_line':
        return (
          <Line
            ref={shapeRef}
            x={x}
            y={y}
            points={shapeProps.points || []}
            stroke={color || '#ffffff'}
            strokeWidth={shapeProps.strokeWidth || 4}
            lineCap="round"
            lineJoin="round"
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
      
      // ANOTACIÓN: Caja de texto libre para notas, nombres de calles o aclaraciones
      case 'text':
        return (
          <Group ref={shapeRef} x={x} y={y} rotation={rotation} scaleX={scaleX} scaleY={scaleY} draggable onClick={onSelect} onTap={onSelect} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}>
            <Text text={text || 'Nota / Texto'} fontSize={16} fontFamily="Outfit" fontStyle="bold" fill={color || '#ffffff'} align="center" x={-60} y={-10} width={120} />
          </Group>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Renderizado de la figura vectorial correspondiente */}
      {renderItem()}
      
      {/* Mostrar el manejador de transformación sólo cuando el elemento está seleccionado */}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Impedir que las dimensiones se reduzcan a menos de 5 píxeles para evitar valores negativos
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default CustomShape;

