/**
 * @file Dashboard.jsx
 * @author Alberto Cárdeno Domínguez
 * @component Dashboard
 * @description Panel de control (Dashboard) principal de la aplicación.
 * Permite a los operadores autorizados gestionar partes de incidentes, visualizar estadísticas clave (KPIs),
 * filtrar reportes de siniestros por tipo de intervención y texto libre, y administrar croquis interactivos viales.
 * Además, implementa diálogos personalizados de confirmación de borrado con portal de React, la previsualización
 * rápida de escenas reconstruidas mediante Konva y la descarga asíncrona de croquis a imágenes en formato PNG.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, PenTool, Trash2 } from 'lucide-react';
import api from '../../services/api';
import IncidentFormModal from './IncidentFormModal';
import { Stage, Layer } from 'react-konva';
import CustomShape from '../editor/CustomShape';

// Subcomponentes auxiliares del panel de control
import KpiStats from './subcomponents/KpiStats';
import IncidentList from './subcomponents/IncidentList';
import CroquisGrid from './subcomponents/CroquisGrid';
import ScenePreviewModal from './subcomponents/ScenePreviewModal';

/**
 * Componente principal que renderiza el panel de control del inquilino (Tenant) autenticado.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onOpenEditor - Callback invocado para abrir el editor de croquis para una escena nueva o vinculada.
 * @param {Function} props.onLoadScene - Callback invocado para cargar una escena vectorial preexistente en el editor.
 * @returns {JSX.Element} Estructura interactiva del panel de control.
 */
const Dashboard = ({ onOpenEditor, onLoadScene }) => {
  // Consumir el contexto del operador autenticado y el Tenant activo
  const { tenant } = useAuth();

  // Estados reactivos para el listado de partes y croquis viales
  const [reports, setReports] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados reactivos para controlar la visibilidad del modal de creación/edición de partes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState(null);

  // Estados de filtrado y búsqueda para la sección de partes e incidentes
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterType, setSelectedFilterType] = useState('Todos');

  // Estados de búsqueda, previsualización y exportación para croquis y escenas
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [previewScene, setPreviewScene] = useState(null);
  const [downloadScene, setDownloadScene] = useState(null);

  // Diálogo personalizado de confirmación de borrado
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Referencia al contenedor Stage de Konva usado en segundo plano para generar descargas
  const downloadStageRef = useRef(null);

  // Efecto secundario para disparar la descarga de la escena en formato PNG de manera asíncrona
  useEffect(() => {
    if (downloadScene && downloadStageRef.current) {
      const timer = setTimeout(() => {
        try {
          // Generar la URL de la imagen en base64 con alta densidad de píxeles
          const uri = downloadStageRef.current.toDataURL({ pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `${downloadScene.name}.png`;
          link.href = uri;
          // Insertar temporalmente el enlace en el DOM para simular el click de descarga
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error("Error al exportar PNG:", err);
          alert("Error al generar la imagen PNG del croquis.");
        } finally {
          // Limpiar la referencia de descarga activa
          setDownloadScene(null);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [downloadScene]);

  /**
   * Obtiene de forma asíncrona los datos necesarios para el dashboard (partes e incidentes)
   * desde la API, filtrando implícitamente por el Tenant asociado al token JWT.
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const reportsRes = await api.get('/reports');
      const scenesRes = await api.get('/scenes');
      setReports(reportsRes.data.data.reports);
      setScenes(scenesRes.data.data.scenes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cada vez que cambie el Tenant activo
  useEffect(() => {
    fetchDashboardData();
  }, [tenant]);

  /**
   * Manejador para abrir el formulario de parte en modo edición.
   *
   * @param {Object} report - Objeto con los datos del reporte a modificar.
   */
  const handleEditClick = (report) => {
    setReportToEdit(report);
    setIsModalOpen(true);
  };

  /**
   * Abre un diálogo de confirmación para eliminar un parte de incidente.
   *
   * @param {number|string} reportId - ID único del parte a eliminar.
   */
  const handleDeleteClick = (reportId) => {
    setConfirmDialog({
      title: '¿Eliminar Parte de Incidente?',
      message: '¿Está seguro de que desea eliminar este parte de incidente? Esta acción borrará permanentemente todos los datos asociados.',
      onConfirm: async () => {
        try {
          await api.delete(`/reports/${reportId}`);
          fetchDashboardData();
        } catch (err) {
          console.error('Error deleting report:', err);
          alert('Error al eliminar el reporte de incidente.');
        }
      }
    });
  };

  /**
   * Abre un diálogo de confirmación para eliminar un croquis vectorial.
   *
   * @param {number|string} sceneId - ID único del croquis a eliminar.
   */
  const handleDeleteSceneClick = (sceneId) => {
    setConfirmDialog({
      title: '¿Eliminar Croquis?',
      message: '¿Está seguro de que desea eliminar este croquis? Esta acción no se puede deshacer y el croquis se perderá permanentemente.',
      onConfirm: async () => {
        try {
          await api.delete(`/scenes/${sceneId}`);
          fetchDashboardData();
        } catch (err) {
          console.error('Error deleting scene:', err);
          alert('Error al eliminar el croquis.');
        }
      }
    });
  };

  /**
   * Inicia la secuencia para descargar un croquis específico.
   *
   * @param {Object} scene - Objeto de escena a descargar.
   */
  const handleDownloadSceneClick = (scene) => {
    setDownloadScene(scene);
  };

  /**
   * Recarga la información del panel de control cuando se crea o actualiza un parte.
   */
  const handleReportCreated = () => {
    fetchDashboardData();
  };

  // Filtrado de reportes e incidentes según término de búsqueda y tipo de intervención
  const filteredReports = reports.filter((rep) => {
    const repDate = new Date(rep.incident_time).toLocaleDateString();
    const repTime = new Date(rep.incident_time).toLocaleTimeString();
    const matchesSearch =
      `${rep.first_name} ${rep.last_name} ${rep.location} ${rep.intervention_type} ${rep.reporter_name || ''} ${repDate} ${repTime}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesType = !selectedFilterType || selectedFilterType === 'Todos' || rep.intervention_type === selectedFilterType;

    return matchesSearch && matchesType;
  });

  // Filtrado de croquis o reconstrucciones según término de búsqueda (nombre de escena, ubicación o involucrado)
  const filteredScenes = scenes.filter((scene) => {
    const query = sceneSearchQuery.toLowerCase();
    const fullName = `${scene.incident_first_name || ''} ${scene.incident_last_name || ''}`.toLowerCase();
    return (
      scene.name.toLowerCase().includes(query) ||
      (scene.incident_location && scene.incident_location.toLowerCase().includes(query)) ||
      (scene.incident_type && scene.incident_type.toLowerCase().includes(query)) ||
      fullName.includes(query)
    );
  });

  // Calcular el número de partes que ya cuentan con un croquis asociado
  const reportsWithScenesCount = reports.filter(rep =>
    scenes.some(scene => Number(scene.report_id) === Number(rep.id))
  ).length;

  // Calcular porcentaje de cobertura de croquis sobre el total de partes creados
  const coveragePercentage = reports.length > 0
    ? Math.round((reportsWithScenesCount / reports.length) * 100)
    : 0;

  // Renderizar estado de carga mientras se obtienen los datos de la base de datos
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando panel del inquilino...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, padding: '0 0 30px 0' }}>

      {/* Cabecera del Panel de Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Panel de Control</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gestiona los partes y reconstrucciones para <strong>{tenant?.name}</strong>
          </p>
        </div>

        {/* Acciones principales de creación y edición global */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Crear Parte
          </button>
          <button className="btn btn-primary" onClick={() => onOpenEditor()}>
            <PenTool size={16} /> Editor Croquis
          </button>
        </div>
      </div>

      {/* Sección superior con métricas clave (KPIs) del inquilino */}
      <KpiStats
        reportsCount={reports.length}
        scenesCount={scenes.length}
        coveragePercentage={coveragePercentage}
        reportsWithScenesCount={reportsWithScenesCount}
      />

      {/* Cuadrícula principal de contenidos en dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flex: 1, alignItems: 'stretch' }}>

        {/* Columna de Partes de Incidentes (Lista y filtros interactivos) */}
        <IncidentList
          reports={reports}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilterType={selectedFilterType}
          setSelectedFilterType={setSelectedFilterType}
          filteredReports={filteredReports}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          onOpenEditor={onOpenEditor}
        />

        {/* Columna lateral de Croquis guardados en el Workspace */}
        <CroquisGrid
          scenes={scenes}
          sceneSearchQuery={sceneSearchQuery}
          setSceneSearchQuery={setSceneSearchQuery}
          filteredScenes={filteredScenes}
          onLoadScene={onLoadScene}
          setPreviewScene={setPreviewScene}
          handleDownloadSceneClick={handleDownloadSceneClick}
          handleDeleteSceneClick={handleDeleteSceneClick}
        />

      </div>

      {/* Modal para crear o actualizar un parte de siniestro */}
      <IncidentFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setReportToEdit(null); }}
        onReportCreated={handleReportCreated}
        reportToEdit={reportToEdit}
      />

      {/* Escenario de Konva oculto del flujo de pantalla para la renderización de imágenes PNG */}
      {downloadScene && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}>
          <Stage
            ref={downloadStageRef}
            width={800}
            height={600}
          >
            <Layer>
              {downloadScene.scene_data && downloadScene.scene_data.map((el) => (
                <CustomShape
                  key={el.id}
                  shapeProps={el}
                  isSelected={false}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      )}

      {/* Modal interactivo de Vista Previa de Croquis */}
      <ScenePreviewModal
        previewScene={previewScene}
        setPreviewScene={setPreviewScene}
        handleDownloadSceneClick={handleDownloadSceneClick}
        onLoadScene={onLoadScene}
      />

      {/* Diálogo personalizado de confirmación de borrado (inyectado al body con un Portal) */}
      {confirmDialog && createPortal(
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
          zIndex: 999999
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '420px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.12), var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error, #ef4444)' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171'
              }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {confirmDialog.title}
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, textAlign: 'left' }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                }}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#ef4444', border: '1px solid #dc2626', color: '#fff' }}
              >
                Confirmar y Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
