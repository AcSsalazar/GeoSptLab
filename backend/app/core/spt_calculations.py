"""
SPT calculations module implementing the formulas from the documentation.
"""
import math
from typing import Dict, Any
from enum import Enum


class Formulation(str, Enum):
    """Supported formulation types."""
    KISHIDA = "kishida"
    JRB = "jrb"


class BehaviorType(str, Enum):
    """Soil behavior types."""
    COHESIVE = "cohesive"
    GRANULAR = "granular"


class SPTCalculator:
    """SPT parameters calculator."""
    
    # Constants
    GAMMA_WATER = 9.81  # kN/m³
    
    @staticmethod
    def calculate_effective_stress(depth: float, gamma_humid: float, gamma_saturated: float, 
                                 water_table_depth: float) -> float:
        """
        Calculate effective stress σ′ at depth.
        
        Args:
            depth: Depth in meters
            gamma_humid: Humid unit weight in kN/m³
            gamma_saturated: Saturated unit weight in kN/m³
            water_table_depth: Water table depth in meters
            
        Returns:
            Effective stress in kPa
        """
        if depth <= water_table_depth:
            # Above water table
            sigma_total = gamma_humid * depth
            pore_pressure = 0
        else:
            # Below water table
            sigma_total = (gamma_humid * water_table_depth + 
                          gamma_saturated * (depth - water_table_depth))
            pore_pressure = SPTCalculator.GAMMA_WATER * (depth - water_table_depth)
        
        sigma_prime = sigma_total - pore_pressure
        return max(sigma_prime, 0)  # Ensure non-negative
    
    @staticmethod
    def calculate_correction_factors(diameter_mm: float, rod_length: float) -> Dict[str, float]:
        """
        Calculate correction factors CB, CS, CR.
        
        Args:
            diameter_mm: Borehole diameter in millimeters
            rod_length: Rod length in meters
            
        Returns:
            Dictionary with correction factors
        """
        # CB factor - Borehole diameter correction
        if diameter_mm <= 65:
            cb_factor = 1.0
        elif diameter_mm <= 80:
            cb_factor = 1.05
        elif diameter_mm <= 100:
            cb_factor = 1.15
        else:
            cb_factor = 1.20
        
        # CS factor - Sampler correction (standard split spoon)
        cs_factor = 1.0
        
        # CR factor - Rod length correction
        if rod_length <= 3:
            cr_factor = 0.75
        elif rod_length <= 4:
            cr_factor = 0.80
        elif rod_length <= 6:
            cr_factor = 0.85
        elif rod_length <= 10:
            cr_factor = 0.95
        else:
            cr_factor = 1.0
        
        return {
            'cb_factor': cb_factor,
            'cs_factor': cs_factor,
            'cr_factor': cr_factor
        }
    
    @staticmethod
    def calculate_cn_factor(sigma_prime: float, method: str = "seed_idriss") -> float:
        """
        Calculate CN factor for overburden correction.
        
        Args:
            sigma_prime: Effective stress in kPa
            method: Calculation method ("seed_idriss" or "marcuson")
            
        Returns:
            CN factor (limited to 2.0)
        """
        # Convert kPa to atmospheric pressure (≈ 100 kPa)
        sigma_atm = 100.0  # kPa
        
        if sigma_prime <= 0:
            return 2.0
        
        if method.lower() == "seed_idriss":
            cn_factor = math.sqrt(sigma_atm / sigma_prime)
        else:  # marcuson method
            cn_factor = math.sqrt(sigma_atm / sigma_prime)
        
        # Limit CN factor to 2.0 as specified
        return min(cn_factor, 2.0)
    
    @staticmethod
    def normalize_n_values(n_field: int, field_energy_percent: float, 
                          correction_factors: Dict[str, float], cn_factor: float) -> Dict[str, float]:
        """
        Calculate normalized N values.
        
        Args:
            n_field: Field N value
            field_energy_percent: Field energy percentage
            correction_factors: Dictionary with CB, CS, CR factors
            cn_factor: CN correction factor
            
        Returns:
            Dictionary with normalized N values
        """
        cb = correction_factors['cb_factor']
        cs = correction_factors['cs_factor']
        cr = correction_factors['cr_factor']
        
        # Energy correction factor CE
        ce_45 = 45.0 / field_energy_percent
        ce_55 = 55.0 / field_energy_percent
        ce_60 = 60.0 / field_energy_percent
        
        # Normalized N values
        n45 = n_field * cb * cs * cr * ce_45
        n55 = n_field * cb * cs * cr * ce_55
        n60 = n_field * cb * cs * cr * ce_60
        
        # N1 values (with overburden correction)
        n145 = n45 * cn_factor
        
        return {
            'n45': n45,
            'n55': n55,
            'n60': n60,
            'n145': n145
        }
    
    @staticmethod
    def calculate_friction_angle(n145: float, formulation: Formulation) -> float:
        """
        Calculate friction angle using Kishida or JRB correlation.
        
        Args:
            n145: N1 value corrected to 45% energy
            formulation: Formulation type (kishida or jrb)
            
        Returns:
            Friction angle in degrees
        """
        if n145 <= 0:
            return 15.0  # Minimum friction angle
        
        if formulation == Formulation.KISHIDA:
            # Kishida: φ′ (°) = 15 + √(12.5 × R) where R = N145
            phi_prime = 15.0 + math.sqrt(12.5 * n145)
        elif formulation == Formulation.JRB:
            # JRB: φ′ (°) = 15 + √(9.375 × R) where R = N145
            phi_prime = 15.0 + math.sqrt(9.375 * n145)
        else:
            raise ValueError(f"Unknown formulation: {formulation}")
        
        # Limit friction angle to reasonable range
        return min(phi_prime, 50.0)
    
    @staticmethod
    def calculate_elastic_modulus(n60: float, behavior_type: BehaviorType) -> float:
        """
        Calculate elastic modulus based on N60 and soil type.
        
        Args:
            n60: N value corrected to 60% energy
            behavior_type: Soil behavior type
            
        Returns:
            Elastic modulus in kPa
        """
        if behavior_type == BehaviorType.GRANULAR:
            # For granular soils: E ≈ 300 × N60 (kPa)
            return 300 * n60
        else:  # cohesive
            # For cohesive soils: E ≈ 200 × N60 (kPa)
            return 200 * n60
    
    @staticmethod
    def calculate_undrained_shear_strength(n60: float, behavior_type: BehaviorType) -> float:
        """
        Calculate undrained shear strength for cohesive soils.
        
        Args:
            n60: N value corrected to 60% energy
            behavior_type: Soil behavior type
            
        Returns:
            Undrained shear strength in kPa (0 for granular soils)
        """
        if behavior_type == BehaviorType.COHESIVE:
            # Su ≈ 6 × N60 (kPa) for cohesive soils
            return 6 * n60
        else:
            return 0  # No undrained strength for granular soils
    
    @classmethod
    def calculate_all_parameters(cls, spt_data: Dict[str, Any], 
                               stratum_data: Dict[str, Any],
                               project_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate all SPT parameters for a given interval.
        
        Args:
            spt_data: SPT interval data
            stratum_data: Soil stratum data
            project_data: Project data
            
        Returns:
            Dictionary with all calculated parameters
        """
        # Extract input parameters
        depth = spt_data['midpoint_depth']
        n_field = spt_data['nspt_field']
        
        gamma_humid = stratum_data['gamma_humid']
        gamma_saturated = stratum_data['gamma_saturated']
        behavior_type = BehaviorType(stratum_data['behavior_type'])
        
        water_table_depth = project_data['water_table_depth']
        diameter_mm = project_data.get('borehole_diameter', spt_data.get('diameter_mm', 150))
        rod_length = project_data.get('rod_length', spt_data.get('rod_length', 6))
        field_energy_percent = project_data.get('field_energy_percent', 
                                               spt_data.get('field_energy_percent', 45))
        formulation = Formulation(project_data['formulation'])
        
        # Calculate effective stress
        sigma_prime = cls.calculate_effective_stress(
            depth, gamma_humid, gamma_saturated, water_table_depth
        )
        
        # Calculate correction factors
        correction_factors = cls.calculate_correction_factors(diameter_mm, rod_length)
        cn_factor = cls.calculate_cn_factor(sigma_prime)
        
        # Normalize N values
        normalized_n = cls.normalize_n_values(
            n_field, field_energy_percent, correction_factors, cn_factor
        )
        
        # Calculate geotechnical parameters
        phi_prime_eq = cls.calculate_friction_angle(normalized_n['n145'], formulation)
        elastic_modulus = cls.calculate_elastic_modulus(normalized_n['n60'], behavior_type)
        su_undrained = cls.calculate_undrained_shear_strength(normalized_n['n60'], behavior_type)
        
        # Calculate shear resistance using Mohr-Coulomb
        phi_rad = math.radians(phi_prime_eq)
        tau_resistance = sigma_prime * math.tan(phi_rad)
        
        return {
            'sigma_prime': sigma_prime,
            'cb_factor': correction_factors['cb_factor'],
            'cs_factor': correction_factors['cs_factor'],
            'cr_factor': correction_factors['cr_factor'],
            'cn_factor': cn_factor,
            'n45': normalized_n['n45'],
            'n55': normalized_n['n55'],
            'n60': normalized_n['n60'],
            'n145': normalized_n['n145'],
            'phi_prime_eq': phi_prime_eq,
            'elastic_modulus': elastic_modulus,
            'tau_resistance': tau_resistance,
            'su_undrained': su_undrained
        }