import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Sliders, RotateCcw } from 'lucide-react';
import styles from '@/styles/MohrCoulombChart.module.css';

interface DataPoint {
  sigma_prime: number; // Effective stress (kPa)
  tau: number; // Shear resistance (kPa)
}

interface RegressionData {
  slope: number; // tan(φ')
  intercept: number; // c' (cohesion)
  r_squared: number; // R²
  phi_degrees: number; // Friction angle in degrees
}

interface Props {
  stratumName: string;
  stratumCode: string;
  dataPoints: DataPoint[];
  regression?: RegressionData;
  color?: string;
}

const MohrCoulombChart: React.FC<Props> = ({
  stratumName,
  stratumCode,
  dataPoints,
  regression: providedRegression,
  color = '#ef4444',
}) => {
  // Calculate regression if not provided
  const calculatedRegression = useMemo(() => {
    if (providedRegression) return providedRegression;
    if (dataPoints.length < 2) return null;

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.sigma_prime, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.tau, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.sigma_prime * p.tau, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.sigma_prime ** 2, 0);
    const sumY2 = dataPoints.reduce((sum, p) => sum + p.tau ** 2, 0);

    // Linear regression: y = mx + b
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const intercept = (sumY - slope * sumX) / n;

    // R² calculation
    const meanY = sumY / n;
    const ssTotal = sumY2 - n * meanY ** 2;
    const ssResidual = dataPoints.reduce(
      (sum, p) => sum + (p.tau - (slope * p.sigma_prime + intercept)) ** 2,
      0
    );
    const r_squared = 1 - ssResidual / ssTotal;

    // Convert slope to friction angle
    const phi_degrees = (Math.atan(slope) * 180) / Math.PI;

    return { slope, intercept, r_squared, phi_degrees };
  }, [dataPoints, providedRegression]);

  // User-adjustable parameters
  const [adjustedPhi, setAdjustedPhi] = useState<number | null>(null);
  const [adjustedCohesion, setAdjustedCohesion] = useState<number | null>(null);
  const [showAdjusted, setShowAdjusted] = useState(false);

  // Current values (adjusted or original)
  const currentPhi = adjustedPhi ?? calculatedRegression?.phi_degrees ?? 30;
  const currentCohesion = adjustedCohesion ?? calculatedRegression?.intercept ?? 0;
  const currentSlope = Math.tan((currentPhi * Math.PI) / 180);

  // Calculate line data for chart
  const maxSigma = Math.max(...dataPoints.map((p) => p.sigma_prime), 100);
  const minSigma = Math.min(...dataPoints.map((p) => p.sigma_prime), 0);

  const regressionLineData = useMemo(() => {
    if (!calculatedRegression) return [];
    return [
      { x: minSigma, y: calculatedRegression.intercept + calculatedRegression.slope * minSigma },
      { x: maxSigma, y: calculatedRegression.intercept + calculatedRegression.slope * maxSigma },
    ];
  }, [calculatedRegression, minSigma, maxSigma]);

  const adjustedLineData = useMemo(() => {
    return [
      { x: minSigma, y: currentCohesion + currentSlope * minSigma },
      { x: maxSigma, y: currentCohesion + currentSlope * maxSigma },
    ];
  }, [currentCohesion, currentSlope, minSigma, maxSigma]);

  const handleReset = () => {
    setAdjustedPhi(null);
    setAdjustedCohesion(null);
    setShowAdjusted(false);
  };

  const handlePhiChange = (value: number) => {
    setAdjustedPhi(value);
    setShowAdjusted(true);
  };

  const handleCohesionChange = (value: number) => {
    setAdjustedCohesion(value);
    setShowAdjusted(true);
  };

  if (!calculatedRegression || dataPoints.length < 2) {
    return (
      <div className={styles.placeholder}>
        <TrendingUp size={32} />
        <p>Datos insuficientes para generar gráfico de regresión</p>
        <span>Se requieren al menos 2 puntos de datos</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <TrendingUp size={20} />
          <div>
            <h4>{stratumName}</h4>
            <span className={styles.subtitle}>Envolvente de Falla Mohr-Coulomb</span>
          </div>
        </div>
        <div className={styles.stratumBadge}>
          Estrato {stratumCode}
        </div>
      </div>

      <div className={styles.content}>
        {/* Chart */}
        <div className={styles.chartSection}>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis
                type="number"
                dataKey="x"
                name="σ'"
                unit=" kPa"
                label={{
                  value: "σ' [kPa] - Esfuerzo Efectivo",
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 14, fontWeight: 600 },
                }}
                domain={[0, 'dataMax']}
                stroke="#6b7280"
              />
              
              <YAxis
                type="number"
                dataKey="y"
                name="τ"
                unit=" kPa"
                label={{
                  value: 'τ [kPa] - Resistencia al Corte',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fontSize: 14, fontWeight: 600 },
                }}
                domain={[0, 'dataMax']}
                stroke="#6b7280"
              />
              
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              />
              
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px' }}
              />

              {/* Data points scatter */}
              <Scatter
                name="Datos SPT"
                data={dataPoints.map((p) => ({ x: p.sigma_prime, y: p.tau }))}
                fill={color}
                shape="circle"
                r={6}
              />

              {/* Regression line */}
              <Scatter
                name={`Regresión (R²=${calculatedRegression.r_squared.toFixed(4)})`}
                data={regressionLineData}
                fill="none"
                line={{ stroke: '#000', strokeWidth: 2, strokeDasharray: '5 5' }}
                shape={<></>}
              />

              {/* Adjusted line (if user modified parameters) */}
              {showAdjusted && (
                <Scatter
                  name="Parámetros Ajustados"
                  data={adjustedLineData}
                  fill="none"
                  line={{ stroke: '#10b981', strokeWidth: 3 }}
                  shape={<></>}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>

          {/* Equation Display */}
          <div className={styles.equationBox}>
            <div className={styles.equationItem}>
              <span className={styles.equationLabel}>Regresión Original:</span>
              <code className={styles.equation}>
                τ = {calculatedRegression.intercept.toFixed(2)} + {calculatedRegression.slope.toFixed(4)}σ'
              </code>
              <span className={styles.rSquared}>R² = {calculatedRegression.r_squared.toFixed(4)}</span>
            </div>
            
            {showAdjusted && (
              <div className={styles.equationItem}>
                <span className={styles.equationLabel}>Ajustado:</span>
                <code className={styles.equationAdjusted}>
                  τ = {currentCohesion.toFixed(2)} + {currentSlope.toFixed(4)}σ'
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className={styles.controlsSection}>
          <div className={styles.controlsHeader}>
            <Sliders size={18} />
            <h5>Parámetros de Diseño</h5>
          </div>

          <div className={styles.parametersGrid}>
            {/* Original Parameters (Read-only) */}
            <div className={styles.parameterCard}>
              <h6>Parámetros de Regresión</h6>
              <div className={styles.parameterRow}>
                <span className={styles.paramLabel}>Cohesión (c'):</span>
                <span className={styles.paramValue}>
                  {calculatedRegression.intercept.toFixed(2)} kPa
                </span>
              </div>
              <div className={styles.parameterRow}>
                <span className={styles.paramLabel}>Ángulo de Fricción (φ'):</span>
                <span className={styles.paramValue}>
                  {calculatedRegression.phi_degrees.toFixed(2)}°
                </span>
              </div>
              <div className={styles.parameterRow}>
                <span className={styles.paramLabel}>Pendiente (tan φ'):</span>
                <span className={styles.paramValue}>
                  {calculatedRegression.slope.toFixed(4)}
                </span>
              </div>
              <div className={styles.parameterRow}>
                <span className={styles.paramLabel}>Coeficiente R²:</span>
                <span className={styles.paramValue}>
                  {calculatedRegression.r_squared.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Adjustable Parameters */}
            <div className={styles.parameterCard}>
              <h6>Ajustar Parámetros de Diseño</h6>
              
              {/* Cohesion Slider */}
              <div className={styles.sliderGroup}>
                <label htmlFor={`cohesion-${stratumCode}`}>
                  Cohesión (c') [kPa]
                  <span className={styles.currentValue}>{currentCohesion.toFixed(2)}</span>
                </label>
                <input
                  id={`cohesion-${stratumCode}`}
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={currentCohesion}
                  onChange={(e) => handleCohesionChange(parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Friction Angle Slider */}
              <div className={styles.sliderGroup}>
                <label htmlFor={`phi-${stratumCode}`}>
                  Ángulo de Fricción (φ') [°]
                  <span className={styles.currentValue}>{currentPhi.toFixed(2)}°</span>
                </label>
                <input
                  id={`phi-${stratumCode}`}
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={currentPhi}
                  onChange={(e) => handlePhiChange(parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>0°</span>
                  <span>25°</span>
                  <span>50°</span>
                </div>
              </div>

              {/* Reset Button */}
              {showAdjusted && (
                <button
                  onClick={handleReset}
                  className={styles.resetButton}
                  type="button"
                >
                  <RotateCcw size={16} />
                  Restaurar Valores Originales
                </button>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <p><strong>Ecuación de Mohr-Coulomb:</strong></p>
            <p className={styles.formula}>τ = c' + σ' × tan(φ')</p>
            <ul>
              <li><strong>τ</strong> = Resistencia al corte</li>
              <li><strong>c'</strong> = Cohesión efectiva</li>
              <li><strong>σ'</strong> = Esfuerzo efectivo normal</li>
              <li><strong>φ'</strong> = Ángulo de fricción efectiva</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MohrCoulombChart;
