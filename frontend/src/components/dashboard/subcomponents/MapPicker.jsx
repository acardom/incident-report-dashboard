/**
 * @file MapPicker.jsx
 * @author Alberto Cárdeno Domínguez
 * @component MapPicker
 * @description Componente interactivo para la selección georeferenciada de ubicaciones.
 * Integra un campo de texto con la API abierta OpenStreetMap (Nominatim) para realizar
 * búsquedas de geocodificación directa e inversa. Al activar la vista de mapa, carga
 * dinámicamente la biblioteca Leaflet desde un CDN y renderiza un marcador interactivo
 * que actualiza automáticamente la dirección en español al ser arrastrado o al hacer clic.
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente que muestra una caja de entrada de texto y un mapa dinámico de Leaflet para elegir ubicaciones.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.value - Dirección o coordenadas seleccionadas actualmente.
 * @param {Function} props.onChange - Callback invocado para actualizar la ubicación en el componente padre.
 * @returns {JSX.Element} Campo de formulario con soporte para mapa y geocodificador.
 */
const MapPicker = ({ value, onChange }) => {
  // Estado reactivo para alternar la visibilidad de la sección del mapa de Leaflet
  const [showMap, setShowMap] = useState(false);
  
  // Estado para bloquear/indicar que se está realizando una búsqueda en Nominatim
  const [searching, setSearching] = useState(false);

  // Referencias mutables para almacenar las instancias de mapa y marcador de Leaflet
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  /**
   * Geocodificación Inversa: Convierte coordenadas (Lat/Lng) en una dirección postal.
   * Consulta el servicio gratuito de OpenStreetMap Nominatim.
   *
   * @param {number} lat - Latitud geográfica.
   * @param {number} lng - Longitud geográfica.
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Formatear una dirección limpia basada en la vía, número y municipio
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const house = addr.house_number || '';
        const city = addr.city || addr.town || addr.village || '';
        const cleanAddr = [road ? `${road} ${house}`.trim() : '', city].filter(Boolean).join(', ');
        // Si no se logra estructurar una limpia, usar el display_name completo
        onChange(cleanAddr || data.display_name);
      } else {
        // Fallback: mostrar coordenadas planas
        onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.error(err);
      onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  /**
   * Geocodificación Directa: Convierte una dirección de texto en coordenadas geográficas.
   * Centra el mapa de Leaflet y mueve el marcador pin.
   *
   * @param {string} queryAddress - Texto de la calle o lugar a buscar.
   */
  const geocodeAddress = async (queryAddress) => {
    if (!queryAddress || !queryAddress.trim()) return;
    
    // Si el mapa se encuentra cerrado, forzar su apertura
    if (!showMap) {
      setShowMap(true);
    }
    
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Función recursiva de espera hasta que el objeto Leaflet y mapa estén totalmente cargados
        const updateMap = () => {
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lon], 15);
            markerRef.current.setLatLng([lat, lon]);
          } else {
            setTimeout(updateMap, 50);
          }
        };
        updateMap();
      }
    } catch (err) {
      console.error('Error forward geocoding:', err);
    } finally {
      setSearching(false);
    }
  };

  // Cargador dinámico e inicializador del mapa de Leaflet (CDN script injection)
  useEffect(() => {
    if (!showMap) {
      // Destruir la instancia del mapa si se oculta para evitar fugas de memoria
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    /**
     * Inicializa los componentes de Leaflet en el contenedor DOM.
     */
    const initMap = () => {
      const mapDiv = document.getElementById('modal-leaflet-map');
      if (!mapDiv || mapRef.current) return;

      const defaultCenter = [40.416775, -3.703790]; // Madrid, España

      // Crear instancia de Leaflet Map
      const map = window.L.map('modal-leaflet-map', {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, 14);
      
      mapRef.current = map;

      // Cargar capa de teselas (Tiles) de OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Crear un marcador pin interactivo diseñado mediante CSS y SVG
      const customPinIcon = window.L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 12px; height: 12px; background-color: #8b5cf6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
            <div style="position: absolute; width: 26px; height: 26px; border: 2px dashed #8b5cf6; border-radius: 50%; animation: pin-pulse-map 1.5s infinite alternate;"></div>
          </div>
          <style>
            @keyframes pin-pulse-map {
              from { transform: scale(0.7); opacity: 0.2; }
              to { transform: scale(1.3); opacity: 0.8; }
            }
          </style>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Agregar marcador de arrastre libre
      const marker = window.L.marker(defaultCenter, { 
        draggable: true,
        icon: customPinIcon
      }).addTo(map);
      
      markerRef.current = marker;

      // Evento: Al terminar el arrastre del pin, geocodificar las coordenadas
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        await reverseGeocode(position.lat, position.lng);
      });

      // Evento: Hacer click en cualquier punto del mapa desplaza el pin y geocodifica
      map.on('click', async (e) => {
        const position = e.latlng;
        marker.setLatLng(position);
        await reverseGeocode(position.lat, position.lng);
      });

      // Geocodificar la dirección de texto si existe en la inicialización
      if (value.trim()) {
        geocodeAddress(value);
      }
    };

    // Inyectar dinámicamente los estilos CSS y el JS de Leaflet si no están cargados en el cliente
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.id = 'leaflet-css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js';
      script.onload = () => {
        initMap();
      };
      document.head.appendChild(script);
    } else {
      // Retrasar brevemente para esperar a que React monte la sección del mapa
      const timer = setTimeout(() => {
        initMap();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      // Limpieza de eventos e instancias al desmontar
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="form-label">Lugar / Ubicación del Suceso</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Ej. Calle Alcalá 140, Madrid" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        
        {/* Botón de Geocodificación directa */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
          onClick={() => geocodeAddress(value)}
          disabled={searching || !value.trim()}
          title="Buscar dirección en el mapa"
        >
          {searching ? '...' : '🔍 Buscar'}
        </button>

        {/* Botón para alternar visibilidad del mapa */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
          onClick={() => setShowMap(!showMap)}
          title="Ver en Mapa"
        >
          {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
        </button>
      </div>

      {/* Contenedor DOM para la inicialización del mapa */}
      {showMap && (
        <div 
          id="modal-leaflet-map" 
          className="glass-panel animate-fade-in" 
          style={{ 
            borderRadius: '8px', 
            height: '185px', 
            marginTop: '6px',
            border: '1px solid var(--border-color)',
            position: 'relative',
            zIndex: 10
          }}
        />
      )}
    </div>
  );
};

export default MapPicker;
