
import React from 'react';
import { Calculator, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useCalculationsWorkflow } from '@/features/calculations/hooks/useCalculationsHooks';
import StatisticalReport from './StatisticalReport';
import styles from '@/styles/FinalReport.module.css';

const FinalReport: React.FC = () => {
  const project = useAppStore((state) => state.project);
  const { calculate, isCalculating, results, isLoadingResults, resultsError } = useCalculationsWorkflow();

  const handleCalculate = () => {
    calculate({ recalculate_all: true });
  };

  if (!project) {
    return (
      <div className={styles.placeholder}>
        <AlertCircle size={48} />
        <h3>No hay proyecto activo</h3>
        <p>Debes crear un proyecto primero.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Calculator size={24} />
            <div>
              <h2>Resultados de Cálculo SPT</h2>
              <p>Parámetros geotécnicos calculados según normativa</p>
            </div>
          </div>
          <div className={styles.projectInfo}>
            <span className={styles.projectCode}>{project.project_code}</span>
            <span className={styles.projectName}>{project.project_name}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={styles.calculateButton}
        >
          {isCalculating ? (
            <>
              <RefreshCw className={styles.spinner} size={16} />
              Calculando...
            </>
          ) : (
            <>
              <Calculator size={16} />
              Calcular Parámetros
            </>
          )}
        </button>
        
        {results && results.results && results.results.length > 0 && (
          <button className={styles.exportButton}>
            <Download size={16} />
            Exportar a Excel
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingResults && (
        <div className={styles.loadingState}>
          <RefreshCw className={styles.spinner} size={32} />
          <p>Cargando resultados...</p>
        </div>
      )}

      {/* Error State */}
      {resultsError && (
        <div className={styles.errorState}>
          <AlertCircle size={24} />
          <p>Error al cargar resultados: {resultsError.message}</p>
        </div>
      )}

      {/* Results Table */}
      {results && results.results && results.results.length > 0 && (
        <div className={styles.resultsSection}>
          <h3>Parámetros Calculados ({results.results.length} intervalos)</h3>
          
          <div className={styles.tableResponsive}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th rowSpan={2}>ID</th>
                  <th rowSpan={2}>Intervalo</th>
                  <th rowSpan={2}>σ&apos;<br/>(kPa)</th>
                  <th colSpan={4}>Factores de Corrección</th>
                  <th colSpan={4}>N Corregidos</th>
                  <th rowSpan={2}>φ&apos;<br/>(°)</th>
                  <th rowSpan={2}>E<br/>(kPa)</th>
                  <th rowSpan={2}>τ<br/>(kPa)</th>
                  <th rowSpan={2}>Su<br/>(kPa)</th>
                </tr>
                <tr>
                  <th>C<sub>b</sub></th>
                  <th>C<sub>s</sub></th>
                  <th>C<sub>r</sub></th>
                  <th>C<sub>n</sub></th>
                  <th>N<sub>45</sub></th>
                  <th>N<sub>55</sub></th>
                  <th>N<sub>60</sub></th>
                  <th>N<sub>1,45</sub></th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.id}</td>
                    <td>{result.spt_interval_id}</td>
                    <td className={styles.numeric}>{result.sigma_prime.toFixed(2)}</td>
                    <td className={styles.numeric}>{result.cb_factor?.toFixed(3) || 'N/A'}</td>
                    <td className={styles.numeric}>{result.cs_factor?.toFixed(3) || 'N/A'}</td>
                    <td className={styles.numeric}>{result.cr_factor?.toFixed(3) || 'N/A'}</td>
                    <td className={styles.numeric}>{result.cn_factor?.toFixed(3) || 'N/A'}</td>
                    <td className={styles.numeric}>{result.n45}</td>
                    <td className={styles.numeric}>{result.n55}</td>
                    <td className={styles.numeric}>{result.n60}</td>
                    <td className={styles.numeric}>{result.n145}</td>
                    <td className={`${styles.numeric} ${styles.highlight}`}>{result.phi_prime_eq.toFixed(2)}</td>
                    <td className={`${styles.numeric} ${styles.highlight}`}>{result.elastic_modulus.toFixed(0)}</td>
                    <td className={styles.numeric}>{result.tau_resistance.toFixed(2)}</td>
                    <td className={styles.numeric}>{result.su_undrained.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          <div className={styles.summaryStats}>
            <h4>Resumen Estadístico</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>N₆₀ Promedio</span>
                <span className={styles.statValue}>
                  {(results.results.reduce((sum, r) => sum + r.n60, 0) / results.results.length).toFixed(1)}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>φ&apos; Promedio</span>
                <span className={styles.statValue}>
                  {(results.results.reduce((sum, r) => sum + r.phi_prime_eq, 0) / results.results.length).toFixed(2)}°
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>E Promedio</span>
                <span className={styles.statValue}>
                  {(results.results.reduce((sum, r) => sum + r.elastic_modulus, 0) / results.results.length).toFixed(0)} kPa
                </span>
              </div>
            </div>
          </div>
          
          {/* Statistical Analysis by Stratum */}
          <StatisticalReport resultsData={results} />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingResults && !resultsError && (!results || !results.results || results.results.length === 0) && (
        <div className={styles.emptyState}>
          <Calculator size={48} />
          <h3>No hay resultados calculados</h3>
          <p>Haz clic en &quot;Calcular Parámetros&quot; para generar los resultados.</p>
        </div>
      )}
    </div>
  );
};

export default FinalReport;
