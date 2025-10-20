# Mohr-Coulomb Regression Analysis - Implementation Complete ✅

## 📋 Overview

This document details the complete implementation of Mohr-Coulomb regression analysis for the SPT geotechnical application, matching the Excel workflow with interactive parameter adjustment capabilities.

**Implementation Date**: 2024  
**Status**: ✅ Complete - Backend & Frontend Integrated

---

## 🎯 Objectives Achieved

### 1. **Geotechnical Analysis**
- ✅ Mohr-Coulomb failure envelope charts (σ' vs τ)
- ✅ Linear regression for each stratum separately
- ✅ R² coefficient of determination
- ✅ Statistical summary (mean, std dev, 95% CI)

### 2. **Interactive Engineering Workflow**
- ✅ Real-time parameter adjustment (c' and φ')
- ✅ Visual comparison: Original vs Adjusted lines
- ✅ Interactive sliders (0-100 kPa cohesion, 0-50° friction angle)
- ✅ Reset functionality to restore original values

### 3. **Mathematical Accuracy**
- ✅ Least squares regression: y = mx + b
- ✅ Slope conversion: φ' = arctan(slope) × (180/π)
- ✅ Cohesion extraction: c' = max(0, intercept)
- ✅ Confidence intervals: mean ± 1.96 × σ / √n

---

## 📁 Files Modified/Created

### Backend (Python/FastAPI)

#### 1. **spt_calculations.py** (+200 lines)
Location: `backend/app/core/spt_calculations.py`

**New Functions:**

##### `calculate_linear_regression(x_values, y_values)`
```python
def calculate_linear_regression(
    x_values: list[float], 
    y_values: list[float]
) -> Dict[str, float]:
    """
    Calculate least squares linear regression for Mohr-Coulomb envelope.
    
    Returns:
        {
            'slope': float,          # tan(φ')
            'intercept': float,      # c' (cohesion)
            'r_squared': float,      # 0-1, data quality
            'phi_degrees': float,    # φ' in degrees
            'cohesion': float,       # c' in kPa (non-negative)
            'equation': str          # "y = c' + slope×x"
        }
    """
```

- **Edge Cases**: Returns zeros if n<2 or denominator=0
- **Formula**: 
  - slope = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)
  - intercept = (Σy - slope×Σx) / n
  - R² = 1 - (SS_residual / SS_total)

##### `calculate_mohr_coulomb_regression_by_stratum(results, stratum_mapping)`
```python
def calculate_mohr_coulomb_regression_by_stratum(
    results: list[Dict[str, Any]],
    stratum_mapping: Dict[int, int]
) -> Dict[int, Dict[str, float]]:
    """
    Calculate Mohr-Coulomb regression for each stratum.
    
    Args:
        results: List of calculated results with sigma_prime, tau_resistance
        stratum_mapping: Dict mapping result_id to stratum_code
        
    Returns:
        Dict[stratum_code, regression_data]
    """
```

- **Grouping**: Groups results by stratum_code
- **Per-Stratum**: Independent regression for each stratum
- **Logging**: Prints equation, R², φ' for debugging

##### `calculate_statistical_summary_by_stratum(results, stratum_mapping)`
```python
def calculate_statistical_summary_by_stratum(
    results: list[Dict[str, Any]],
    stratum_mapping: Dict[int, int]
) -> Dict[int, Dict[str, float]]:
    """
    Calculate statistical summary (mean, std, CI) for φ' and E by stratum.
    
    Returns:
        Dict[stratum_code, {
            'count': int,
            'phi_mean': float,
            'phi_std': float,
            'phi_lower': float,  # 95% CI lower bound
            'phi_upper': float,  # 95% CI upper bound
            'modulus_mean': float,
            'modulus_std': float,
            'modulus_lower': float,
            'modulus_upper': float
        }]
    """
```

- **Statistics**: Mean, variance, standard deviation
- **Confidence**: 95% CI using ±1.96σ/√n
- **Special Case**: Single sample (n=1) returns CI=mean

#### 2. **calculations.py** (API Endpoint Updated)
Location: `backend/app/api/v1/endpoints/calculations.py`

**Modified Endpoint:**
```python
@router.get("/project/{project_id}/results")
def get_project_results(
    project_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get all calculated results for a project with regression analysis.
    
    Returns:
        {
            'results': List[CalculatedResult],
            'regression_by_stratum': Dict[int, RegressionData],
            'statistical_summary_by_stratum': Dict[int, StatisticalSummary]
        }
    """
```

**Key Changes:**
- ✅ Added imports for new regression functions
- ✅ Creates stratum_mapping from SPT intervals → Borehole strata → Stratum definitions
- ✅ Calls `calculate_mohr_coulomb_regression_by_stratum`
- ✅ Calls `calculate_statistical_summary_by_stratum`
- ✅ Returns structured response with regression & statistical data

**Stratum Mapping Logic:**
```python
stratum_mapping = {}
for result in results:
    interval = interval_repo.get_by_id(result.spt_interval_id)
    if interval and interval.borehole_stratum and interval.borehole_stratum.stratum_definition:
        stratum_mapping[result.id] = interval.borehole_stratum.stratum_definition.stratum_code
```

---

### Frontend (React/TypeScript)

#### 1. **calculationsService.ts** (Updated)
Location: `frontend/src/features/calculations/services/calculationsService.ts`

**New Interfaces:**
```typescript
export interface RegressionData {
  slope: number;
  intercept: number;
  r_squared: number;
  phi_degrees: number;
  cohesion: number;
  equation: string;
  data_points: number;
}

export interface StatisticalSummary {
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

export interface ProjectResultsResponse {
  results: CalculatedResult[];
  regression_by_stratum: Record<number, RegressionData>;
  statistical_summary_by_stratum: Record<number, StatisticalSummary>;
}
```

**Updated Method:**
```typescript
async getProjectResults(projectId: number): Promise<ProjectResultsResponse> {
  const response = await axios.get(`${API_BASE_URL}/calculations/project/${projectId}/results`);
  return response.data;
}
```

#### 2. **MohrCoulombChart.tsx** (Created - ~350 lines)
Location: `frontend/src/components/MohrCoulombChart.tsx`

**Component Features:**

**Props:**
```typescript
interface MohrCoulombChartProps {
  stratumName: string;
  stratumCode: number;
  dataPoints: Array<{ sigma_prime: number; tau: number }>;
  regression: {
    slope: number;
    intercept: number;
    r_squared: number;
    phi_degrees: number;
    cohesion?: number;
  };
  color?: string;
}
```

**State Management:**
```typescript
const [adjustedPhi, setAdjustedPhi] = useState(regression.phi_degrees);
const [adjustedCohesion, setAdjustedCohesion] = useState(regression.cohesion || regression.intercept);
const [showAdjusted, setShowAdjusted] = useState(false);
```

**Key Features:**
1. **Recharts ScatterChart** with responsive width/height
2. **Dual Lines**:
   - Black dashed line: Original regression (τ = c' + σ'×tan(φ'))
   - Green solid line: Adjusted parameters (real-time)
3. **Interactive Sliders**:
   - Cohesion: 0-100 kPa (step 1)
   - Friction angle: 0-50° (step 0.5)
4. **Controls**:
   - "Mostrar Línea Ajustada" checkbox
   - "Restablecer Valores" reset button
5. **Info Display**:
   - Parameter cards (read-only original + adjustable design values)
   - Equation display with R²
   - Mohr-Coulomb theory explanation

**Chart Configuration:**
```tsx
<ScatterChart width={600} height={400}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis label={{ value: "σ' (kPa)", position: 'insideBottom', offset: -5 }} />
  <YAxis label={{ value: "τ (kPa)", angle: -90, position: 'insideLeft' }} />
  <Tooltip />
  <Legend />
  
  <Scatter name="Datos Experimentales" data={dataPoints} fill={color} />
  <Line name="Regresión Original" data={regressionLineData} stroke="#000" strokeWidth={2} strokeDasharray="5 5" />
  {showAdjusted && <Line name="Línea Ajustada" data={adjustedLineData} stroke="#10b981" strokeWidth={2} />}
</ScatterChart>
```

#### 3. **MohrCoulombChart.module.css** (Created - ~300 lines)
Location: `frontend/src/styles/MohrCoulombChart.module.css`

**Highlights:**
- Purple gradient headers (linear-gradient 135deg)
- Grid layout: chart + controls (1fr 400px)
- Responsive breakpoints (1200px, 768px)
- Interactive sliders with hover effects (transform: scale(1.1))
- Parameter cards with badges
- Info box with equation display

#### 4. **StatisticalReport.tsx** (Updated)
Location: `frontend/src/components/StatisticalReport.tsx`

**Key Changes:**

**Props Updated:**
```typescript
const StatisticalReport: React.FC<{ 
  resultsData: ProjectResultsResponse | undefined 
}> = ({ resultsData }) => {
  // ...
}
```

**Statistics from Backend:**
```typescript
const stratumStatistics = useMemo(() => {
  const results = resultsData?.results || [];
  const statisticalSummaryByStratum = resultsData?.statistical_summary_by_stratum || {};
  
  // Convert backend data to frontend format
  Object.entries(statisticalSummaryByStratum).forEach(([stratumCodeStr, summary]) => {
    stats.push({
      stratum_name: stratum.name,
      stratum_code: parseInt(stratumCodeStr),
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
  });
  
  return stats;
}, [resultsData, strata]);
```

**Charts Rendering:**
```typescript
{stratumStatistics.map((stat, idx) => {
  const regressionByStratum = resultsData?.regression_by_stratum || {};
  const regressionData = regressionByStratum[stat.stratum_code];
  
  const regression = {
    slope: regressionData.slope,
    intercept: regressionData.intercept,
    r_squared: regressionData.r_squared,
    phi_degrees: regressionData.phi_degrees,
    cohesion: regressionData.cohesion,
  };
  
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
```

#### 5. **FinalReport.tsx** (Updated)
Location: `frontend/src/components/FinalReport.tsx`

**Data Access Updated:**
```typescript
// Before
{results && results.length > 0 && (

// After
{results && results.results && results.results.length > 0 && (
  <div className={styles.resultsSection}>
    <h3>Parámetros Calculados ({results.results.length} intervalos)</h3>
    
    {results.results.map((result) => (
      // ... table rows
    ))}
    
    <StatisticalReport resultsData={results} />
  </div>
)}
```

---

## 🔧 Technical Details

### Mathematical Implementation

#### Linear Regression (Least Squares)
```
Given data points: (σ'ᵢ, τᵢ) for i = 1 to n

Model: τ = c' + σ' × tan(φ')

Least Squares Solution:
  slope = (n∑σ'τ - ∑σ'∑τ) / (n∑σ'² - (∑σ')²)
  intercept = (∑τ - slope×∑σ') / n
  
R² Calculation:
  SS_total = ∑(τᵢ - τ̄)²
  SS_residual = ∑(τᵢ - τ̂ᵢ)²
  R² = 1 - (SS_residual / SS_total)
  
Parameter Extraction:
  φ' = arctan(slope) × (180/π)  [degrees]
  c' = max(0, intercept)         [kPa]
```

#### Statistical Summary
```
Mean: μ = ∑xᵢ / n

Variance: σ² = ∑(xᵢ - μ)² / (n-1)

Standard Deviation: σ = √σ²

95% Confidence Interval:
  Lower = μ - 1.96 × σ / √n
  Upper = μ + 1.96 × σ / √n
  
  (Using normal approximation with z=1.96)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Calcular Parámetros"                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /calculations/project/{id}/calculate                    │
│ - Iterates through SPT intervals                            │
│ - Calls calculate_spt_parameters() for each                 │
│ - Saves to calculated_results table                         │
│ - Returns: {calculated_count, updated_count}                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION: View Results (FinalReport component)           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /calculations/project/{id}/results                       │
│                                                              │
│ 1. Fetch all calculated_results for project                 │
│ 2. Build stratum_mapping:                                   │
│    result_id → interval → borehole_stratum → stratum_code   │
│ 3. Calculate regression by stratum:                         │
│    - Group results by stratum_code                          │
│    - Extract (σ', τ) arrays per stratum                     │
│    - Calculate linear regression for each                   │
│ 4. Calculate statistical summary by stratum:                │
│    - Group results by stratum_code                          │
│    - Calculate mean, std dev, 95% CI for φ' and E           │
│                                                              │
│ Returns:                                                     │
│   {                                                          │
│     results: [...],                                          │
│     regression_by_stratum: {                                │
│       1: {slope, intercept, r_squared, phi_degrees, ...},   │
│       2: {...}                                               │
│     },                                                       │
│     statistical_summary_by_stratum: {                       │
│       1: {count, phi_mean, phi_std, phi_lower, ...},        │
│       2: {...}                                               │
│     }                                                        │
│   }                                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: StatisticalReport Component                       │
│                                                              │
│ 1. Renders statistical table with mean, std, 95% CI         │
│ 2. For each stratum:                                        │
│    - Creates MohrCoulombChart component                     │
│    - Passes regression data from backend                    │
│    - Passes all data points for visualization               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: MohrCoulombChart Component                        │
│                                                              │
│ 1. Plots scatter points (σ' vs τ)                           │
│ 2. Draws original regression line (black dashed)            │
│ 3. User adjusts sliders (c' and φ')                         │
│ 4. Draws adjusted regression line (green solid)             │
│ 5. Real-time visual comparison for design decisions         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Test regression with 2-3 data points per stratum
- [ ] Test with single data point (should return CI=mean)
- [ ] Test with empty stratum (should skip gracefully)
- [ ] Verify R² values are between 0 and 1
- [ ] Verify φ' degrees are positive
- [ ] Verify cohesion is non-negative

### Frontend Testing
- [ ] Charts render correctly for each stratum
- [ ] Sliders adjust parameters smoothly
- [ ] Reset button restores original values
- [ ] Adjusted line updates in real-time
- [ ] Colors are distinct for multiple strata
- [ ] Responsive layout on mobile devices

### Integration Testing
- [ ] Calculate parameters → View results
- [ ] Verify regression data matches backend logs
- [ ] Verify statistical summary displays correctly
- [ ] Test with real project data (multiple boreholes, multiple strata)
- [ ] Export functionality (future enhancement)

---

## 📊 Example Output

### Backend Log
```
📊 Calculating Mohr-Coulomb regression for 24 results...
Stratum 1 - Regression: y = 5.23 + 0.6749x, R²=0.94, φ'=34.02°
Stratum 2 - Regression: y = 3.45 + 0.5123x, R²=0.89, φ'=27.11°
✅ Regression calculated for 2 strata

📈 Calculating statistical summary...
✅ Statistical summary calculated for 2 strata
```

### API Response Structure
```json
{
  "results": [
    {
      "id": 1,
      "spt_interval_id": 5,
      "sigma_prime": 45.2,
      "tau_resistance": 35.7,
      "phi_prime_eq": 34.5,
      "elastic_modulus": 12500,
      "..."
    }
  ],
  "regression_by_stratum": {
    "1": {
      "slope": 0.6749,
      "intercept": 5.23,
      "r_squared": 0.94,
      "phi_degrees": 34.02,
      "cohesion": 5.23,
      "equation": "y = 5.23 + 0.6749x",
      "data_points": 12
    },
    "2": {
      "slope": 0.5123,
      "intercept": 3.45,
      "r_squared": 0.89,
      "phi_degrees": 27.11,
      "cohesion": 3.45,
      "equation": "y = 3.45 + 0.5123x",
      "data_points": 12
    }
  },
  "statistical_summary_by_stratum": {
    "1": {
      "count": 12,
      "phi_mean": 34.25,
      "phi_std": 2.13,
      "phi_lower": 32.05,
      "phi_upper": 36.45,
      "modulus_mean": 12300,
      "modulus_std": 850,
      "modulus_lower": 11500,
      "modulus_upper": 13100
    }
  }
}
```

---

## 🎨 UI/UX Features

### Chart Component
- **Header**: Purple gradient with stratum name and code
- **Grid Layout**: Chart (60%) + Controls (40%)
- **Color Coding**: Each stratum gets unique color (red, orange, green, blue, purple, pink)
- **Interactive Elements**:
  - Range sliders with labels showing current values
  - Checkbox to toggle adjusted line
  - Reset button with icon
- **Responsive**: Stacks vertically on mobile (< 768px)

### Statistical Table
- **Columns**: Estrato, n, φ'ₘₑₐₙ, σ, IC 95%, Eₘₑₐₙ, σ, IC 95%
- **Formatting**: 
  - φ' in degrees (2 decimals)
  - E in kPa (0 decimals)
  - CI displayed as [lower, upper]
- **Footer Note**: Explains 95% CI calculation

---

## 🚀 Future Enhancements

### Phase 1 (Current) ✅
- Backend regression calculations
- Frontend interactive charts
- Real-time parameter adjustment

### Phase 2 (Planned)
- [ ] Export charts to PDF/Excel
- [ ] Save adjusted parameters to database
- [ ] Compare multiple design scenarios side-by-side
- [ ] Annotate charts with comments
- [ ] Generate full geotechnical report

### Phase 3 (Future)
- [ ] 3D Mohr-Coulomb failure surface visualization
- [ ] Sensitivity analysis (parameter variations)
- [ ] AI-assisted parameter recommendations
- [ ] Multi-project comparison dashboard

---

## 📚 References

### Geotechnical Engineering
1. **Mohr-Coulomb Theory**: τ = c' + σ'×tan(φ')
2. **SPT Correlations**: Bowles (1996), Das (2010)
3. **Statistical Methods**: Montgomery & Runger, Applied Statistics

### Implementation
- FastAPI Documentation: https://fastapi.tiangolo.com
- React Query: https://tanstack.com/query
- Recharts: https://recharts.org
- SQLAlchemy: https://www.sqlalchemy.org

---

## 👥 Credits

**Backend Development**: Python/FastAPI regression calculations  
**Frontend Development**: React/TypeScript interactive charts  
**Mathematical Implementation**: Least squares regression, statistical analysis  
**Design**: Responsive UI with engineer-friendly controls

---

## 📝 Notes

- **Data Quality**: R² values below 0.7 indicate poor linear fit (consider non-linear models or data quality issues)
- **Sample Size**: Confidence intervals require n≥2; single samples return CI=mean
- **Parameter Bounds**: Cohesion clipped to non-negative; friction angle typically 20-45° for soils
- **Design Philosophy**: Engineers adjust original calculated parameters based on experience, regulations, and safety factors

---

**Status**: ✅ **IMPLEMENTATION COMPLETE**  
**Next Step**: End-to-end testing with real project data

---
