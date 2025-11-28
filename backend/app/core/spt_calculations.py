"""
Funciones de cálculo de parámetros SPT basadas en el procedimiento de Luis David Agudelo.
"""
import math
from typing import Dict, Any, Optional
from enum import Enum

# Constante de peso unitario del agua
GAMMA_WATER = 9.81  # kN/m³

# En la versión actual (0.1.0), solo se implementa Kishida
class FormulationType(str, Enum):
    """
    Aquí se podrán agregar más formulaciones si es necesario.
    La ecuación debe añadirse en la función:
    calculate_friction_angle.
    """
    KISHIDA = "kishida"
    #JRB = "jrb"

# -----------------------------
# Cálculo de tensiones
# -----------------------------
def calculate_stress(
    depth: float,
    gamma_humid: float,
    gamma_saturated: float,
    water_table_depth: Optional[float] = None
) -> Dict[str, float]:
    """
    Cálculo de tensiones totales, presión de poros y tensión efectiva.
    
    Args:
        depth: Profundidad bajo la superficie (m)
        gamma_humid: Peso unitario húmedo (kN/m³)
        gamma_saturated: Peso unitario saturado (kN/m³)
        water_table_depth: Profundidad del nivel freático (m)
    
    Returns:
        Diccionario con:
        - sigma_total: tensión total (kN/m²)
        - pore_pressure: presión de poro (kN/m²)
        - sigma_prime: tensión efectiva (kN/m²)
    """
    if water_table_depth is None or depth <= water_table_depth:
        # Por encima del nivel freático
        sigma_total = gamma_humid * depth
        pore_pressure = 0.0
    else:
        # Por debajo del nivel freático
        sigma_total = (gamma_humid * water_table_depth + 
                      gamma_saturated * (depth - water_table_depth))
        pore_pressure = GAMMA_WATER * (depth - water_table_depth)
    
    sigma_prime = sigma_total - pore_pressure
    print(f"Profundidad: {depth}m, Sigma Total: {sigma_total}kN/m², "
          f"Presión de Poro: {pore_pressure}kN/m², "
          f"Sigma Prima: {sigma_prime}kN/m²")
    return {
        "sigma_total": sigma_total,
        "pore_pressure": pore_pressure,
        "sigma_prime": sigma_prime
    }

# -----------------------------
# Cálculo del factor Cn
# -----------------------------
def calculate_cn_factor(sigma_prime: float) -> float:
    """
    Cálculo del factor Cn (corrección por confinamiento) usando la fórmula logarítmica.
    
    Fórmula:
        Cn = 1 - (K * log Rs)
    
    Donde:
        Rs = σ'v / 100
        K = 1.41 si Rs < 1
        K = 0.92 si Rs ≥ 1
    
    Args:
        sigma_prime: Tensión efectiva (kN/m²)
    
    Returns:
        Cn (valor limitado a ≤ 2.0)
    """
    rs = sigma_prime / 100.0
    if rs < 1.0:
        k = 1.41
        cn = 1 - (k * math.log10(rs)) 
    else:
        k = 0.92
        cn = 1 - (k * math.log10(rs)) 
    
    return min(cn, 2.0)

# -----------------------------
# Factores de corrección CB, CS, CR
# -----------------------------
def calculate_correction_factors(
    borehole_diameter_mm: float = 150.0,
    sampling_method: str = "standard",
    midpoint_depth: float = 15.0
) -> Dict[str, float]:
    """
    Cálculo de los factores de corrección CB, CS y CR.
    
    Args:
        borehole_diameter_mm: Diámetro de la perforación (mm)
        sampling_method: Método de muestreo
        midpoint_depth: Profundidad del punto medio (m) - usado para CR
    
    Returns:
        Diccionario con los factores CB, CS, CR
    """
    # CB: corrección por diámetro de perforación
    if borehole_diameter_mm <= 150:
        cb_factor = 1.0
    elif borehole_diameter_mm <= 200:
        cb_factor = 1.05
    else:
        cb_factor = 1.15
    
    # CS: corrección por método de muestreo
    cs_factor = 1.0  # Cucharón estándar (split-spoon)
    
    # CR: corrección por profundidad de perforación (basado en punto medio)
    if midpoint_depth <= 4:
        cr_factor = 0.75
    elif midpoint_depth <= 6:
        cr_factor = 0.85
    elif midpoint_depth <= 10:
        cr_factor = 0.95
    else:
        cr_factor = 1.0
    
    return {
        "cb_factor": cb_factor,
        "cs_factor": cs_factor,
        "cr_factor": cr_factor
    }

# -----------------------------
# Normalización de valores N
# -----------------------------
def normalize_n_values(
    n_field: int,
    field_energy_percent: float,
    cb_factor: float,
    cs_factor: float,
    cr_factor: float,
    cn_factor: float
) -> Dict[str, float]:
    """
    Normaliza valores N a diferentes energías de referencia.
    Basado en las fórmulas del Excel CP-00633.
    
    Args:
        n_field: Valor Nspt en campo (golpes/30cm)
        field_energy_percent: Porcentaje de energía en campo
        cb_factor: Factor CB
        cs_factor: Factor CS
        cr_factor: Factor CR
        cn_factor: Factor Cn
    
    Returns:
        Diccionario con valores normalizados N45, N55, N60, N145
    """
    ce_45 = 45.0 
    ce_55 = 55.0
    ce_60 = 60.0 
    
    # Fórmulas exactas del Excel CP-00633:
    # N45: =(I16*45)/(K16*L16*M16*60) 
    # N55: =O16*55/60*K16*L16*M16 donde O16=N45
    # N60: =O16*45/60*K16*L16*M16 donde O16=N45, W5=45
    # N145: =N16*O16 donde N16=Cn, O16=N45
    
    n45 = (n_field * ce_45) / (cb_factor * cs_factor * cr_factor * 60) 
    n55 = n45 * (ce_55/60) * cb_factor * cs_factor * cr_factor
    n60 = n45 * (ce_45/60) * cb_factor * cs_factor * cr_factor  # W5=45
    n145 = cn_factor * n45
    
    return {
        "n45": n45,
        "n55": n55,
        "n60": n60,
        "n145": n145
    }

# -----------------------------
# Ángulo de fricción
# -----------------------------
def calculate_friction_angle(
    n145: float,
    formulation: FormulationType = FormulationType.KISHIDA
) -> float:
    """
    Cálculo del ángulo de fricción efectivo φ′.
    
    Args:
        n145: Valor normalizado N1(45)
        formulation: Tipo de correlación (Kishida o JRB)
    
    Returns:
        Ángulo de fricción φ′ en grados
    """
    if formulation == FormulationType.KISHIDA:
        phi_prime = 15.0 + math.sqrt(12.5 * max(n145, 0))
    else:
        print(f"Tipo de formulación no soportada: {formulation}")
       
    return phi_prime

# -----------------------------
# Módulo elástico
# -----------------------------
def calculate_elastic_modulus(n60: float) -> float:
    """
    Cálculo del módulo elástico a partir de N60.
    
    Args:
        n60: Valor N corregido a 60% de energía
    
    Returns:
        Módulo elástico E (kN/m²)
    """
    return 500.0 * n60

# -----------------------------
# Resistencia no drenada
# -----------------------------
def calculate_undrained_shear_strength(n60: float) -> float:
    """
    Cálculo de resistencia al corte no drenada Su.
    
    Args:
        n60: Valor N corregido a 60% de energía
    
    Returns:
        Resistencia no drenada Su (kN/m²)
    """
    return 6.0 * n60

# -----------------------------
# Pipeline de cálculo completo
# -----------------------------
def calculate_spt_parameters(
    spt_data: Dict[str, Any],
    project_data: Dict[str, Any],
    stratum_data: Dict[str, Any],
    borehole_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Pipeline de cálculo completo de parámetros SPT.
    
    Args:
        spt_data: Datos del intervalo SPT
        project_data: Datos del proyecto
        stratum_data: Propiedades del estrato
        borehole_data: Configuración de la perforación
    
    Returns:
        Resultados completos calculados
    """
    depth = spt_data["midpoint_depth"]
    n_field = spt_data["nspt_field"]
    gamma_humid = stratum_data["gamma_humid"]
    gamma_saturated = stratum_data["gamma_saturated"]
    water_table_depth = borehole_data.get("water_table_depth")
    field_energy = project_data["field_energy_percent"]
    formulation = project_data["formulation"]
    borehole_diameter = borehole_data["diameter_mm"]
    
    print(f"    🔢 SPT Calculation Input:")
    print(f"       N-SPT Field: {n_field}")
    print(f"       Depth: {depth}m")
    print(f"       Water Table: {water_table_depth}m")
    print(f"       Field Energy: {field_energy}%")
    print(f"       γ_humid: {gamma_humid} kN/m³, γ_saturated: {gamma_saturated} kN/m³")
    print(f"       Borehole Diameter: {borehole_diameter}mm")
    print(f"       Formulation: {formulation}")
    
    # Calcular tensiones
    stress_results = calculate_stress(
        depth, gamma_humid, gamma_saturated, water_table_depth
    )
    print(f"    🌍 Stress Results: σ'={stress_results['sigma_prime']:.2f} kPa")
    
    # Factores de corrección (CR se basa en la profundidad del punto medio)
    correction_factors = calculate_correction_factors(
        borehole_diameter, "standard", depth
    )
    cn_factor = calculate_cn_factor(stress_results["sigma_prime"])
    print(f"    📐 Correction Factors: CB={correction_factors['cb_factor']}, CS={correction_factors['cs_factor']}, CR={correction_factors['cr_factor']}, Cn={cn_factor:.4f}")
    
    # Normalización de N
    n_values = normalize_n_values(
        n_field,
        field_energy,
        correction_factors["cb_factor"],
        correction_factors["cs_factor"],
        correction_factors["cr_factor"],
        cn_factor
    )
    print(f"    📊 N-Values: N45={n_values['n45']:.2f}, N55={n_values['n55']:.2f}, N60={n_values['n60']:.2f}, N145={n_values['n145']:.2f}")
    
    # Parámetros geotécnicos
    phi_prime = calculate_friction_angle(n_values["n145"], FormulationType(formulation))
    elastic_modulus = calculate_elastic_modulus(n_values["n60"])
    print(f"    🧮 Geotechnical: φ'={phi_prime:.2f}°, E={elastic_modulus:.0f} kPa")
    
    # Resistencia al corte: τ = c' + σ' × tan(φ′), asumiendo c′=0
    tau_resistance = stress_results["sigma_prime"] * math.tan(math.radians(phi_prime))
    
    # Resistencia no drenada
    su_undrained = calculate_undrained_shear_strength(n_values["n60"])
    print(f"    💪 Resistances: τ={tau_resistance:.2f} kPa, Su={su_undrained:.0f} kPa")
    
    return {
        "sigma_prime": stress_results["sigma_prime"],
        "cb_factor": correction_factors["cb_factor"],
        "cs_factor": correction_factors["cs_factor"],
        "cr_factor": correction_factors["cr_factor"],
        "cn_factor": cn_factor,
        "n45": n_values["n45"],
        "n55": n_values["n55"],
        "n60": n_values["n60"],
        "n145": n_values["n145"],
        "phi_prime_eq": phi_prime,
        "elastic_modulus": elastic_modulus,
        "tau_resistance": tau_resistance,
        "su_undrained": su_undrained
    }


# -----------------------------
# Regresión Mohr-Coulomb
# -----------------------------
def calculate_linear_regression(x_values: list[float], y_values: list[float]) -> Dict[str, float]:
    """
    Calcula regresión lineal por mínimos cuadrados: y = mx + b
    Para envolvente de falla Mohr-Coulomb: τ = c' + σ' × tan(φ')
    
    Args:
        x_values: Lista de valores x (sigma_prime)
        y_values: Lista de valores y (tau_resistance)
    
    Returns:
        Diccionario con:
        - slope: pendiente (tan(φ'))
        - intercept: intercepto (c' - cohesión)
        - r_squared: coeficiente de determinación R²
        - phi_degrees: ángulo de fricción en grados
        - cohesion: cohesión efectiva en kPa
    """
    if len(x_values) < 2 or len(y_values) < 2:
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "r_squared": 0.0,
            "phi_degrees": 0.0,
            "cohesion": 0.0,
            "equation": "N/A"
        }
    
    n = len(x_values)
    
    # Sumas necesarias para la regresión
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x2 = sum(x ** 2 for x in x_values)
    sum_y2 = sum(y ** 2 for y in y_values)
    
    # Cálculo de pendiente e intercepto
    # y = mx + b
    denominator = n * sum_x2 - sum_x ** 2
    
    if denominator == 0:
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "r_squared": 0.0,
            "phi_degrees": 0.0,
            "cohesion": 0.0,
            "equation": "N/A"
        }
    
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    
    # Cálculo de R² (coeficiente de determinación)
    mean_y = sum_y / n
    ss_total = sum((y - mean_y) ** 2 for y in y_values)
    ss_residual = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_values, y_values))
    
    r_squared = 1 - (ss_residual / ss_total) if ss_total != 0 else 0.0
    
    # Conversión de pendiente a ángulo de fricción
    phi_degrees = math.degrees(math.atan(slope)) if slope > 0 else 0.0
    
    # El intercepto representa la cohesión efectiva
    cohesion = max(0.0, intercept)  # No puede ser negativa
    
    # Ecuación en formato string
    equation = f"y = {intercept:.2f} + {slope:.4f}x"
    
    return {
        "slope": slope,
        "intercept": intercept,
        "r_squared": r_squared,
        "phi_degrees": phi_degrees,
        "cohesion": cohesion,
        "equation": equation
    }


def calculate_mohr_coulomb_regression_by_stratum(
    results: list[Dict[str, Any]],
    stratum_mapping: Dict[int, int]  # result_id -> stratum_code
) -> Dict[int, Dict[str, float]]:
    """
    Calcula regresión Mohr-Coulomb para cada estrato.
    
    Args:
        results: Lista de resultados calculados con sigma_prime y tau_resistance
        stratum_mapping: Mapeo de result_id a stratum_code
    
    Returns:
        Diccionario con stratum_code como llave y datos de regresión como valor
    """
    # Agrupar resultados por estrato
    results_by_stratum: Dict[int, list[Dict[str, Any]]] = {}
    
    for result in results:
        result_id = result.get("id")
        if result_id in stratum_mapping:
            stratum_code = stratum_mapping[result_id]
            if stratum_code not in results_by_stratum:
                results_by_stratum[stratum_code] = []
            results_by_stratum[stratum_code].append(result)
    
    # Calcular regresión para cada estrato
    regressions = {}
    
    for stratum_code, stratum_results in results_by_stratum.items():
        if len(stratum_results) < 2:
            # No hay suficientes datos para regresión
            regressions[stratum_code] = {
                "slope": 0.0,
                "intercept": 0.0,
                "r_squared": 0.0,
                "phi_degrees": 0.0,
                "cohesion": 0.0,
                "equation": "N/A",
                "data_points": len(stratum_results)
            }
            continue
        
        # Extraer sigma_prime y tau_resistance
        sigma_values = [r["sigma_prime"] for r in stratum_results]
        tau_values = [r["tau_resistance"] for r in stratum_results]
        
        # Calcular regresión
        regression = calculate_linear_regression(sigma_values, tau_values)
        regression["data_points"] = len(stratum_results)
        
        regressions[stratum_code] = regression
        
        print(f"  📊 Stratum {stratum_code}: {regression['equation']}, R²={regression['r_squared']:.4f}, φ'={regression['phi_degrees']:.2f}°")
    
    return regressions


def calculate_statistical_summary_by_stratum(
    results: list[Dict[str, Any]],
    stratum_mapping: Dict[int, int]
) -> Dict[int, Dict[str, float]]:
    """
    Calcula estadísticas (media, desviación estándar, intervalos de confianza) por estrato.
    
    Args:
        results: Lista de resultados calculados
        stratum_mapping: Mapeo de result_id a stratum_code
    
    Returns:
        Diccionario con estadísticas por estrato
    """
    results_by_stratum: Dict[int, list[Dict[str, Any]]] = {}
    
    for result in results:
        result_id = result.get("id")
        if result_id in stratum_mapping:
            stratum_code = stratum_mapping[result_id]
            if stratum_code not in results_by_stratum:
                results_by_stratum[stratum_code] = []
            results_by_stratum[stratum_code].append(result)
    
    statistics = {}
    
    for stratum_code, stratum_results in results_by_stratum.items():
        n = len(stratum_results)
        
        if n == 0:
            continue
        
        # Extraer valores de φ' y E
        phi_values = [r["phi_prime_eq"] for r in stratum_results]
        modulus_values = [r["elastic_modulus"] for r in stratum_results]
        
        # Calcular media
        phi_mean = sum(phi_values) / n
        modulus_mean = sum(modulus_values) / n
        
        if n > 1:
            # Calcular desviación estándar
            phi_variance = sum((x - phi_mean) ** 2 for x in phi_values) / (n - 1)
            phi_std = math.sqrt(phi_variance)
            
            modulus_variance = sum((x - modulus_mean) ** 2 for x in modulus_values) / (n - 1)
            modulus_std = math.sqrt(modulus_variance)
            
            # Intervalo de confianza 95% (±1.96 * std / sqrt(n))
            t_value = 1.96  # Para muestras grandes; usar distribución t para pequeñas
            phi_margin = t_value * phi_std / math.sqrt(n)
            modulus_margin = t_value * modulus_std / math.sqrt(n)
            
            phi_lower = phi_mean - phi_margin
            phi_upper = phi_mean + phi_margin
            modulus_lower = modulus_mean - modulus_margin
            modulus_upper = modulus_mean + modulus_margin
        else:
            # Solo un dato - no hay intervalo de confianza
            phi_std = 0.0
            phi_lower = phi_mean
            phi_upper = phi_mean
            modulus_std = 0.0
            modulus_lower = modulus_mean
            modulus_upper = modulus_mean
        
        statistics[stratum_code] = {
            "count": n,
            "phi_mean": phi_mean,
            "phi_std": phi_std,
            "phi_lower": phi_lower,
            "phi_upper": phi_upper,
            "modulus_mean": modulus_mean,
            "modulus_std": modulus_std,
            "modulus_lower": modulus_lower,
            "modulus_upper": modulus_upper
        }
    
    return statistics
