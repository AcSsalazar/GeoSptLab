"""
SPT Parameters calculation functions based on geotechnical correlations.
"""
import math
from typing import Dict, Any, Optional
from enum import Enum

# Constants
GAMMA_WATER = 9.81  # kN/m³, unit weight of water


class FormulationType(str, Enum):
    """Formulation types for friction angle calculations."""
    KISHIDA = "kishida"
    JRB = "jrb"


def calculate_stress(
    depth: float,
    gamma_humid: float,
    gamma_saturated: float,
    water_table_depth: Optional[float] = None
) -> Dict[str, float]:
    """
    Calculate total and effective stress at a given depth.
    
    Args:
        depth: Depth below ground surface (m)
        gamma_humid: Humid unit weight above water table (kN/m³)
        gamma_saturated: Saturated unit weight below water table (kN/m³)
        water_table_depth: Depth to water table (m), None if no water table
    
    Returns:
        Dictionary with sigma_total, pore_pressure, and sigma_prime
    """
    if water_table_depth is None or depth <= water_table_depth:
        # Above water table
        sigma_total = gamma_humid * depth
        pore_pressure = 0.0
    else:
        # Below water table
        sigma_total = (gamma_humid * water_table_depth + 
                      gamma_saturated * (depth - water_table_depth))
        pore_pressure = GAMMA_WATER * (depth - water_table_depth)
    
    sigma_prime = sigma_total - pore_pressure
    
    return {
        "sigma_total": sigma_total,
        "pore_pressure": pore_pressure,
        "sigma_prime": sigma_prime
    }


def calculate_cn_factor(sigma_prime: float) -> float:
    """
    Calculate overburden pressure correction factor using Seed-Idriss/Marcuson method.
    
    Args:
        sigma_prime: Effective overburden stress (kN/m²)
    
    Returns:
        Cn correction factor (limited to ≤ 2.0)
    """
    # Convert kN/m² to kPa if needed (should be the same)
    sigma_prime_kpa = sigma_prime
    
    # Seed-Idriss correlation: Cn = (100/σ'v)^0.5
    # σ'v in kPa, reference pressure is 100 kPa
    cn = math.sqrt(100.0 / max(sigma_prime_kpa, 10.0))  # Prevent division by very small numbers
    
    # Limit Cn to maximum value of 2.0
    return min(cn, 2.0)


def calculate_correction_factors(
    borehole_diameter_mm: float = 150.0,
    sampling_method: str = "standard",
    rod_length_m: float = 15.0
) -> Dict[str, float]:
    """
    Calculate SPT correction factors CB, CS, and CR.
    
    Args:
        borehole_diameter_mm: Borehole diameter in mm
        sampling_method: Sampling method type
        rod_length_m: Rod length in meters
    
    Returns:
        Dictionary with CB, CS, and CR factors
    """
    # CB: Borehole diameter correction
    if borehole_diameter_mm <= 150:
        cb_factor = 1.0
    elif borehole_diameter_mm <= 200:
        cb_factor = 1.05
    else:
        cb_factor = 1.15
    
    # CS: Sampling method correction (assume standard split-spoon)
    cs_factor = 1.0  # Standard sampling method
    
    # CR: Rod length correction
    if rod_length_m <= 4:
        cr_factor = 0.75
    elif rod_length_m <= 6:
        cr_factor = 0.85
    elif rod_length_m <= 10:
        cr_factor = 0.95
    else:
        cr_factor = 1.0
    
    return {
        "cb_factor": cb_factor,
        "cs_factor": cs_factor,
        "cr_factor": cr_factor
    }


def normalize_n_values(
    n_field: int,
    field_energy_percent: float,
    cb_factor: float,
    cs_factor: float,
    cr_factor: float,
    cn_factor: float
) -> Dict[str, float]:
    """
    Calculate normalized N values for different energy levels.
    
    Args:
        n_field: Field SPT N value (blows/30cm)
        field_energy_percent: Field energy percentage
        cb_factor: Borehole diameter correction
        cs_factor: Sampling method correction
        cr_factor: Rod length correction
        cn_factor: Overburden pressure correction
    
    Returns:
        Dictionary with N45, N55, N60, and N145 values
    """
    # Energy correction factor (CE)
    ce_45 = 45.0 / field_energy_percent
    ce_55 = 55.0 / field_energy_percent
    ce_60 = 60.0 / field_energy_percent
    
    # Apply corrections: N_ref = N_field × CB × CS × CR × CE × Cn
    n45 = n_field * cb_factor * cs_factor * cr_factor * ce_45
    n55 = n_field * cb_factor * cs_factor * cr_factor * ce_55
    n60 = n_field * cb_factor * cs_factor * cr_factor * ce_60
    n145 = n_field * cb_factor * cs_factor * cr_factor * ce_45 * cn_factor
    
    return {
        "n45": n45,
        "n55": n55,
        "n60": n60,
        "n145": n145
    }


def calculate_friction_angle(
    n145: float,
    formulation: FormulationType = FormulationType.KISHIDA
) -> float:
    """
    Calculate friction angle using specified correlation.
    
    Args:
        n145: Normalized SPT N value (N1)45
        formulation: Correlation type (Kishida or JRB)
    
    Returns:
        Friction angle in degrees
    """
    if formulation == FormulationType.KISHIDA:
        # Kishida: φ′ (°) = 15 + √(12.5 × N145)
        phi_prime = 15.0 + math.sqrt(12.5 * max(n145, 0))
    else:  # JRB
        # JRB: φ′ (°) = 15 + √(9.375 × N145)
        phi_prime = 15.0 + math.sqrt(9.375 * max(n145, 0))
    
    return phi_prime


def calculate_elastic_modulus(n60: float) -> float:
    """
    Calculate elastic modulus from N60 value.
    
    Args:
        n60: SPT N value corrected to 60% energy
    
    Returns:
        Elastic modulus in kN/m²
    """
    # Common correlation: E = 500 × N60 (for granular soils)
    # This can be adjusted based on soil type and other factors
    return 500.0 * n60


def calculate_undrained_shear_strength(n60: float) -> float:
    """
    Calculate undrained shear strength for cohesive soils.
    
    Args:
        n60: SPT N value corrected to 60% energy
    
    Returns:
        Undrained shear strength in kN/m²
    """
    # Common correlation for cohesive soils: Su = 6 × N60
    return 6.0 * n60


def calculate_spt_parameters(
    spt_data: Dict[str, Any],
    project_data: Dict[str, Any],
    stratum_data: Dict[str, Any],
    borehole_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Complete SPT parameters calculation pipeline.
    
    Args:
        spt_data: SPT interval data
        project_data: Project configuration
        stratum_data: Soil stratum properties
        borehole_data: Borehole configuration
    
    Returns:
        Complete calculated results
    """
    # Extract input parameters
    depth = spt_data["midpoint_depth"]
    n_field = spt_data["nspt_field"]
    gamma_humid = stratum_data["gamma_humid"]
    gamma_saturated = stratum_data["gamma_saturated"]
    water_table_depth = project_data.get("water_table_depth")
    field_energy = project_data["field_energy_percent"]
    formulation = project_data["formulation"]
    borehole_diameter = borehole_data["diameter_mm"]
    rod_length = borehole_data["rod_length"]
    
    # Calculate stress
    stress_results = calculate_stress(
        depth, gamma_humid, gamma_saturated, water_table_depth
    )
    
    # Calculate correction factors
    correction_factors = calculate_correction_factors(
        borehole_diameter, "standard", rod_length
    )
    cn_factor = calculate_cn_factor(stress_results["sigma_prime"])
    
    # Normalize N values
    n_values = normalize_n_values(
        n_field,
        field_energy,
        correction_factors["cb_factor"],
        correction_factors["cs_factor"],
        correction_factors["cr_factor"],
        cn_factor
    )
    
    # Calculate geotechnical parameters
    phi_prime = calculate_friction_angle(n_values["n145"], FormulationType(formulation))
    elastic_modulus = calculate_elastic_modulus(n_values["n60"])
    
    # Calculate shear resistance using Mohr-Coulomb: τ = c' + σ' × tan(φ')
    # Assume c' = 0 for simplicity (can be adjusted)
    tau_resistance = stress_results["sigma_prime"] * math.tan(math.radians(phi_prime))
    
    # Calculate undrained shear strength (for cohesive soils)
    su_undrained = calculate_undrained_shear_strength(n_values["n60"])
    
    # Compile results
    results = {
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
    
    return results