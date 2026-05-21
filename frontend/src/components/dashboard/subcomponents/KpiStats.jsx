/**
 * @file KpiStats.jsx
 * @author Alberto Cárdeno Domínguez
 * @component KpiStats
 * @description Subcomponente para el dashboard que renderiza las tarjetas de indicadores clave de rendimiento (KPIs).
 * Visualiza métricas descriptivas sobre el volumen total de partes registrados, escenas diseñadas en el lienzo
 * y el porcentaje de cobertura de croquis con respecto a los partes de siniestros, usando iconos vectoriales.
 */

import React from 'react';
import { FileText, CheckCircle, PenTool } from 'lucide-react';

/**
 * Componente que renderiza paneles KPI resumen para el operador.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {number} props.reportsCount - Cantidad de partes registrados.
 * @param {number} props.scenesCount - Cantidad de croquis guardados.
 * @param {number} props.coveragePercentage - Porcentaje de partes que cuentan con un croquis.
 * @param {number} props.reportsWithScenesCount - Cantidad exacta de partes vinculados a un croquis.
 * @returns {JSX.Element} Cuadrícula de KPIs.
 */
const KpiStats = ({ reportsCount, scenesCount, coveragePercentage, reportsWithScenesCount }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
      
      {/* Tarjetas del Lado Izquierdo (ocupa 2/3 del ancho total): Partes y Escenas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Tarjeta KPI 1: Volumen total de partes cargados en la organización */}
        <div className="glass-panel" style={{ padding: 0, display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
          <div style={{ width: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', flexShrink: 0 }}>
            <FileText size={26} />
          </div>
          <div style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Partes Registrados</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reportsCount}</span>
          </div>
        </div>

        {/* Tarjeta KPI 2: Cantidad total de reconstrucciones vectoriales en la base de datos */}
        <div className="glass-panel" style={{ padding: 0, display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
          <div style={{ width: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', flexShrink: 0 }}>
            <PenTool size={26} />
          </div>
          <div style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Escenas Diseñadas</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{scenesCount}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta del Lado Derecho (ocupa 1/3 del ancho total): Porcentaje de Cobertura */}
      <div className="glass-panel" style={{ padding: 0, display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
        <div style={{ width: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', flexShrink: 0 }}>
          <CheckCircle size={26} />
        </div>
        <div style={{ padding: '20px 24px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Cobertura de Diseños</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{coveragePercentage}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({reportsWithScenesCount} de {reportsCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiStats;
