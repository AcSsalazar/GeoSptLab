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
    
    n45 = ( n_field * ce_45 ) / (cb_factor * cs_factor * cr_factor * 60) 
    n55 = n_field * cb_factor * cs_factor * cr_factor * ce_55
    n60 = n_field * cb_factor * cs_factor * cr_factor * ce_60
    n145 = n_field * cb_factor * cs_factor * cr_factor * ce_45 * cn_factor
    
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
    
    # Calcular tensiones
    stress_results = calculate_stress(
        depth, gamma_humid, gamma_saturated, water_table_depth
    )
    
    # Factores de corrección (CR se basa en la profundidad del punto medio)
    correction_factors = calculate_correction_factors(
        borehole_diameter, "standard", depth
    )
    cn_factor = calculate_cn_factor(stress_results["sigma_prime"])
    
    # Normalización de N
    n_values = normalize_n_values(
        n_field,
        field_energy,
        correction_factors["cb_factor"],
        correction_factors["cs_factor"],
        correction_factors["cr_factor"],
        cn_factor
    )
    
    # Parámetros geotécnicos
    phi_prime = calculate_friction_angle(n_values["n145"], FormulationType(formulation))
    elastic_modulus = calculate_elastic_modulus(n_values["n60"])
    
    # Resistencia al corte: τ = c' + σ' × tan(φ′), asumiendo c′=0
    tau_resistance = stress_results["sigma_prime"] * math.tan(math.radians(phi_prime))
    
    # Resistencia no drenada
    su_undrained = calculate_undrained_shear_strength(n_values["n60"])
    
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
