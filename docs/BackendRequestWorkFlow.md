# Backend API Test Workflow - CP-00633 Casa Las Palmas

## Test Data Overview
- **Project**: CP-00633 Casa Las Palmas
- **Boreholes**: 3 (P1, P2, P3)
- **Strata**: 3 total (Ceniza Volcánica, H-VI Migmatita, H-V Migmatita)
- **Formulation**: Kishida
- **Energy**: 45%

## Step 1: Create Project
**Endpoint**: `POST /api/v1/projects/`

```json
{
  "project_name": "CP-00633 Casa Las Palmas",
  "number_of_boreholes": 3,
  "number_of_strata": 3,
  "formulation": "kishida"
}
```

**Expected Response**:
```json
{
  "id": 1,
  "project_name": "CP-00633 Casa Las Palmas",
  "project_code": "CP-00633-001", // Auto-generated
  "number_of_boreholes": 3,
  "number_of_strata": 3,
  "formulation": "kishida",
  "created_at": "2025-09-25T...",
  "updated_at": "2025-09-25T..."
}
```

## Step 2: Create Strata (Bulk)
**Endpoint**: `POST /api/v1/strata/bulk`

```json
{
  "project_id": 1,
  "strata": [
    {
      "stratum_code": 1,
      "name": "Ceniza Volcánica",
      "description": "Limos, suelos finogranulares",
      "initial_depth": 0.0,
      "final_depth": 2.0,
      "gamma_humid": 18.5,
      "gamma_saturated": 19.0,
      "behavior_type": "granular",
      "plasticity_index": null
    },
    {
      "stratum_code": 2,
      "name": "H-VI Migmatita Puente P",
      "description": "Limos, suelos finogranulares",
      "initial_depth": 1.45,
      "final_depth": 4.45,
      "gamma_humid": 19.5,
      "gamma_saturated": 20.0,
      "behavior_type": "granular",
      "plasticity_index": null
    },
    {
      "stratum_code": 3,
      "name": "H-V Migmatita de Puente P",
      "description": "Limos, suelos finogranulares",
      "initial_depth": 2.45,
      "final_depth": 6.45,
      "gamma_humid": 16.0,
      "gamma_saturated": 16.5,
      "behavior_type": "granular",
      "plasticity_index": null
    }
  ]
}
```

## Step 3: Create Boreholes
**Endpoint**: `POST /api/v1/boreholes/` (3 separate calls)

### P1 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P1",
  "final_depth": 6.45,
  "diameter_mm": 90.0,
  "field_energy_percent": 45.0,
  "rod_length": 15.0,
  "water_table_depth": 3.0,
  "formulation": "kishida"
}
```

### P2 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P2",
  "final_depth": 6.45,
  "diameter_mm": 90.0,
  "field_energy_percent": 45.0,
  "rod_length": 15.0,
  "water_table_depth": 20.0,
  "formulation": "kishida"
}
```

### P3 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P3",
  "final_depth": 6.25,
  "diameter_mm": 90.0,
  "field_energy_percent": 45.0,
  "rod_length": 15.0,
  "water_table_depth": 20.0,
  "formulation": "kishida"
}
```

## Step 4: Create SPT Intervals
**Endpoint**: `POST /api/v1/spt-intervals/` (12 individual calls)
**Note**: `midpoint_depth` is calculated automatically by the backend

### P1 SPT Intervals:
```json
{
  "borehole_id": 1,
  "stratum_id": 1,
  "depth_from": 1.00,
  "depth_to": 1.45,
  "nspt_field": 9,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 1,
  "stratum_id": 2,
  "depth_from": 3.00,
  "depth_to": 3.45,
  "nspt_field": 4,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 1,
  "stratum_id": 2,
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 6,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 1,
  "stratum_id": 3,
  "depth_from": 5.00,
  "depth_to": 5.45,
  "nspt_field": 33,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 1,
  "stratum_id": 3,
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 77,
  "description": "Limos, suelos finogranulares"
}
```

### P2 SPT Intervals:
```json
{
  "borehole_id": 2,
  "stratum_id": 1,
  "depth_from": 1.00,
  "depth_to": 1.45,
  "nspt_field": 11,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 2,
  "stratum_id": 2,
  "depth_from": 2.00,
  "depth_to": 2.45,
  "nspt_field": 12,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 2,
  "stratum_id": 3,
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 30,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 2,
  "stratum_id": 3,
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 41,
  "description": "Limos, suelos finogranulares"
}
```

### P3 SPT Intervals:
```json
{
  "borehole_id": 3,
  "stratum_id": 2,
  "depth_from": 3.00,
  "depth_to": 3.45,
  "nspt_field": 10,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 3,
  "stratum_id": 2,
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 16,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_id": 3,
  "stratum_id": 3,
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 53,
  "description": "Limos, suelos finogranulares"
}
```

## Step 5: Trigger Calculations
**Endpoint**: `POST /api/v1/calculations/project/{project_id}/calculate`

```json
{
  "project_id": 1
}
```

## Step 6: Get Results for Validation
**Endpoint**: `GET /api/v1/calculations/project/{project_id}/results`

**Expected Results to Compare with Excel**:
- P1 @ 1.23m depth: τ and φ values
- P1 @ 3.23m depth: τ and φ values  
- P1 @ 4.23m depth: τ and φ values
- P1 @ 5.23m depth: τ and φ values
- P1 @ 6.23m depth: τ and φ values
- P2 @ 1.23m depth: τ and φ values
- P2 @ 2.23m depth: τ and φ values
- P2 @ 4.23m depth: τ and φ values
- P2 @ 6.23m depth: τ and φ values
- P3 @ 3.23m depth: τ and φ values
- P3 @ 4.23m depth: τ and φ values
- P3 @ 6.23m depth: τ and φ values

## API Testing Sequence

1. **Start Backend**: `cd backend && python -m app.main`
2. **Open API Docs**: `http://localhost:8000/docs`
3. **Execute requests** in order: Project → Strata → Boreholes → SPT Intervals → Calculate → Results
4. **Compare calculations** with Excel τ and φ values
5. **Verify data integrity** by checking depth assignments match stratum ranges

## Validation Checkpoints

✅ **Project Creation**: Verify auto-generated project_code  
✅ **Strata Creation**: Check depth ranges and gamma values  
✅ **Borehole Creation**: Verify water table depths (3m for P1, 20m for P2/P3)  
✅ **SPT Intervals**: Confirm stratum_id assignments match depth ranges  
✅ **Calculations**: Compare τ and φ results with Excel formulas  

## Notes for Testing

- **Water Table**: P1 has shallow water table (3m), P2/P3 have deep (20m)
- **Stratum Coverage**: P3 doesn't have Stratum 1 (starts at 1.45m with Stratum 2)
- **Depth Variations**: Each borehole has different stratum thickness
- **N-Values Range**: From 4 to 77, good test range for calculations