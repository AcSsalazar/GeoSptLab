import React, { useMemo } from 'react';
import { TrendingUp, OctagonAlert } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import MohrCoulombChart from './MohrCoulombChart';
import type {  ProjectResultsResponse} from '@/types/api';
import type { CalculatedResult } from '@/types/project';
import styles from '@/styles/StatisticalReport.module.css';
import common from '@/styles/ui/Common.module.css';

interface StratumStats {
  stratum_name: string;
  stratum_code: string;
  count: number;
  phi_mean: number;
  phi_std: number;
  phi_lower: number;
  phi_upper: number;
  modulus_mean: number;
  modulus_std: number;
  modulus_lower: number;
  modulus_upper: number;
}

const StatisticalReport: React.FC<{ resultsData: ProjectResultsResponse | undefined }> = ({ resultsData }) => {
  const strata = useAppStore((state) => state.strata);

  // Calculate statistics grouped by stratum - now using backend data
  const stratumStatistics = useMemo(() => {
    // Extract data from response inside useMemo
    const results = resultsData?.results || [];
    const statisticalSummaryByStratum = resultsData?.statistical_summary_by_stratum || {};

    if (!results || results.length === 0 || Object.keys(statisticalSummaryByStratum).length === 0) {
      return [];
    }

    // Convert backend statistical summary to frontend format
    const stats: StratumStats[] = [];
    
    Object.entries(statisticalSummaryByStratum).forEach(([stratumCodeStr, summary]) => {
      const stratumCode = (stratumCodeStr);
      const stratum = strata.find(s => s.stratum_code === stratumCode);
      
      if (stratum) {
        stats.push({
          stratum_name: stratum.name,
          stratum_code: stratumCode,
          count: summary.count,
          phi_mean: summary.phi_mean,
          phi_std: summary.phi_std,
          phi_lower: summary.phi_lower,
          phi_upper: summary.phi_upper,
          modulus_mean: summary.modulus_mean,
          modulus_std: summary.modulus_std,
          modulus_lower: summary.modulus_lower,
          modulus_upper: summary.modulus_upper,
        });
      }
    });

    return stats.filter(s => s.count > 0);
  }, [resultsData, strata]);

  if (stratumStatistics.length === 0) {
    return (
      <div className={common.placeholder}>
        <OctagonAlert size={32} />
        <p>No hay suficientes datos para análisis estadístico</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <TrendingUp size={20} />
        <h3>Análisis Estadístico por Estrato</h3>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th rowSpan={2}>Estrato</th>
              <th rowSpan={2}>Código</th>
              <th rowSpan={2}>n</th>
              <th colSpan={4}>φ' eq (°)</th>
              <th colSpan={4}>Es (kPa)</th>
            </tr>
            <tr>
              <th>Lim. Inferior</th>
              <th>Promedio</th>
              <th>Lim. Superior</th>
              <th>σ</th>
              <th>Lim. Inferior</th>
              <th>Promedio</th>
              <th>Lim. Superior</th>
              <th>σ</th>
            </tr>
          </thead>
          <tbody>
            {stratumStatistics.map((stat) => (
              <tr key={stat.stratum_code}>
                <td className={styles.stratumName}>{stat.stratum_name}</td>
                <td className={styles.centered}>{stat.stratum_code}</td>
                <td className={styles.centered}>{stat.count}</td>
                
                {/* Phi statistics */}
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.phi_lower.toFixed(2) : '-'}
                </td>
                <td className={`${styles.numeric} ${styles.highlight}`}>
                  {stat.phi_mean.toFixed(2)}
                </td>
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.phi_upper.toFixed(2) : '-'}
                </td>
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.phi_std.toFixed(2) : 'N/A'}
                </td>
                
                {/* Modulus statistics */}
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.modulus_lower.toFixed(0) : '-'}
                </td>
                <td className={`${styles.numeric} ${styles.highlight}`}>
                  {stat.modulus_mean.toFixed(0)}
                </td>
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.modulus_upper.toFixed(0) : '-'}
                </td>
                <td className={styles.numeric}>
                  {stat.count > 1 ? stat.modulus_std.toFixed(0) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <p className={styles.note}>
          <strong>Nota:</strong> Los límites de confianza son calculados con un nivel de confianza del 95% (±1.96σ/√n).
          σ = Desviación estándar. n = Número de muestras.
        </p>
      </div>

      {/* Mohr-Coulomb Charts for each stratum */}
      <div className={styles.chartsSection}>
        <h3 className={styles.chartsTitle}>📊 Envolventes de Falla Mohr-Coulomb por Estrato</h3>
        {stratumStatistics.map((stat, idx) => {
          // Get regression data from backend for this stratum
          const results = resultsData?.results || [];
          const regressionByStratum = resultsData?.regression_by_stratum || {};
          const regressionData = regressionByStratum[stat.stratum_code];

          if (!regressionData) {
            return null; // Skip if no regression data for this stratum
          }

          // Get all results that belong to this stratum (filtered by backend)
          // Note: Backend already filtered and calculated, but we need actual points for visualization
          // For now, we'll use all results and let the backend grouping handle it
          const dataPoints = results
            .map((r: CalculatedResult) => ({
              sigma_prime: r.sigma_prime,
              tau: r.tau_resistance,
            }));

          // Use backend regression data directly
          const regression = {
            slope: regressionData.slope,
            intercept: regressionData.intercept,
            r_squared: regressionData.r_squared,
            phi_degrees: regressionData.phi_degrees,
            cohesion: regressionData.cohesion,
          };

          const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

          return (
            <MohrCoulombChart
              key={stat.stratum_code}
              stratumName={stat.stratum_name}
              stratumCode={stat.stratum_code}
              dataPoints={dataPoints}
              regression={regression}
              color={colors[idx % colors.length]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StatisticalReport;
