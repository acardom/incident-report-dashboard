/**
 * @file IncidentFormModal.jsx
 * @author Alberto Cárdeno Domínguez
 * @component IncidentFormModal
 * @description Modal interactivo en dos pasos (Wizard) para la creación y edición de partes de incidentes.
 * Permite a los operadores registrar el nombre, apellidos, localización (con MapPicker integrado) y detalles
 * operativos como tipo de siniestro y fecha/hora del incidente. Se conecta a la API REST del backend con soporte
 * para operaciones de creación (POST) y actualización (PUT) respetando el aislamiento de inquilinos (Tenants).
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import MapPicker from './subcomponents/MapPicker';

/**
 * Componente modal de tipo formulario guiado en dos pasos (Wizard) para partes de incidentes.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal debe mostrarse en pantalla.
 * @param {Function} props.onClose - Callback invocado para cerrar el modal y limpiar estados.
 * @param {Function} props.onReportCreated - Callback invocado tras crear/editar con éxito el reporte para recargar el dashboard.
 * @param {Object} [props.reportToEdit] - Objeto opcional que contiene un reporte existente para modificar.
 * @returns {JSX.Element|null} Estructura modal inyectada mediante portal de React, o null si no está abierto.
 */
const IncidentFormModal = ({ isOpen, onClose, onReportCreated, reportToEdit }) => {
  // Estado para controlar el paso actual del formulario guiado (1: Datos básicos, 2: Detalles operativos)
  const [step, setStep] = useState(1);
  
  // Estados reactivos correspondientes al Paso 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  
  // Estados reactivos correspondientes al Paso 2
  const [interventionType, setInterventionType] = useState('Accidente de Tráfico');
  const [incidentTime, setIncidentTime] = useState(new Date().toISOString().slice(0, 16));

  // Estados de control para la solicitud de red
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar y cargar el estado cuando cambia la visibilidad o se selecciona un reporte para edición
  useEffect(() => {
    if (isOpen) {
      if (reportToEdit) {
        // Rellenar datos en modo edición
        setFirstName(reportToEdit.first_name || '');
        setLastName(reportToEdit.last_name || '');
        setLocation(reportToEdit.location || '');
        setInterventionType(reportToEdit.intervention_type || 'Accidente de Tráfico');
        
        // Formatear correctamente la fecha para el input datetime-local
        if (reportToEdit.incident_time) {
          const d = new Date(reportToEdit.incident_time);
          const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setIncidentTime(localISO);
        } else {
          setIncidentTime(new Date().toISOString().slice(0, 16));
        }
      } else {
        // Limpiar campos en modo creación
        setFirstName('');
        setLastName('');
        setLocation('');
        setInterventionType('Accidente de Tráfico');
        setIncidentTime(new Date().toISOString().slice(0, 16));
      }
      setStep(1);
      setError('');
    }
  }, [isOpen, reportToEdit]);

  // Si el modal está configurado como cerrado, no renderizar nada en el DOM
  if (!isOpen) return null;

  /**
   * Valida la información del Paso 1 y avanza al Paso 2 si es correcto.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleNext = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !location.trim()) {
      setError('Por favor complete todos los campos de texto del Paso 1.');
      return;
    }
    setError('');
    setStep(2);
  };

  /**
   * Retrocede al Paso 1 del formulario interactivo.
   */
  const handleBack = () => {
    setError('');
    setStep(1);
  };

  /**
   * Envía la información recopilada del parte al servidor (Creación o Edición).
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incidentTime || !interventionType) {
      setError('Por favor configure la hora del incidente y tipo de intervención.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        firstName,
        lastName,
        location,
        incidentTime,
        interventionType
      };

      let response;
      if (reportToEdit) {
        // Petición PUT para actualizar un registro de siniestro existente
        response = await api.put(`/reports/${reportToEdit.id}`, payload);
      } else {
        // Petición POST para dar de alta un nuevo parte de incidente
        response = await api.post('/reports', payload);
      }
      
      // Notificar al componente padre de la creación del reporte
      onReportCreated(response.data.data.report);
      // Cerrar modal
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Tipos de siniestro/intervención soportados en la plataforma
  const interventionTypes = [
    'Accidente de Tráfico',
    'Incendio y Salvamento',
    'Intervención Sanitaria / Médica',
    'Rescate Técnico / Rescate de Montaña',
    'Control de Sustancias Peligrosas',
    'Apoyo Logístico / Protección Civil',
    'Orden Público / Seguridad Vial'
  ];

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '500px',
        maxWidth: '90%',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', textAlign: 'left', fontWeight: '700' }}>
          {reportToEdit ? 'Modificar Parte de Incidente' : 'Nuevo Parte de Incidente'}
        </h2>

        {/* Barra de Progreso Visual */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{
            height: '6px',
            flex: 1,
            backgroundColor: step >= 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            transition: 'background-color 0.3s'
          }} />
          <div style={{
            height: '6px',
            flex: 1,
            backgroundColor: step >= 2 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            transition: 'background-color 0.3s'
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Paso {step} de 2
          </span>
        </div>

        {/* Notificaciones de error de la API o de la validación interna */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Renderizado Condicional: Formulario Paso 1 (Datos del Reportante y Ubicación) */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nombre del Reportante</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Juan" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos del Reportante</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Pérez Gómez" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            
            {/* Componente para la selección de ubicación física o mapa */}
            <MapPicker value={location} onChange={setLocation} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Renderizado Condicional: Formulario Paso 2 (Datos del Suceso y envío final) */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Intervención / Incidente</label>
              <select 
                className="form-input form-select"
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
              >
                {interventionTypes.map((type, idx) => (
                  <option key={idx} value={type} style={{ backgroundColor: 'var(--bg-main)' }}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hora y Fecha del Suceso</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={loading}>
                <ArrowLeft size={16} /> Atrás
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : (reportToEdit ? 'Guardar Cambios' : 'Crear Parte')} <CheckCircle2 size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default IncidentFormModal;
