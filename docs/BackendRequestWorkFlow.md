# Backend API Test Workflow - CP-00633 Casa Las Palmas (v0.2.0)

## ⚡ Nueva Estructura de Datos
**IMPORTANTE**: Esta versión usa la nueva arquitectura separando definiciones de materiales de profundidades específicas por perforación.

## Test Data Overview
- **Project**: CP-00633 Casa Las Palmas 02
- **Boreholes**: 3 (P1, P2, P3)
- **Stratum Definitions**: 3 materiales (Ceniza Volcánica, H-VI Migmatita, H-V Migmatita)
- **Formulation**: Kishida
- **Energy**: 45%
- **Clave**: Los mismos materiales aparecen a diferentes profundidades en cada perforación

## 🚀 Flujo de Testing Manual en /docs

### Step 1: Create Project
**Endpoint**: `POST /api/v1/projects/`

```json
{
  "project_name": "CP-00633 Casa Las Palmas 02",
  "number_of_boreholes": 3,
  "number_of_strata": 3,
  "formulation": "kishida"
}
```

**Expected Response**:
```json
{
  "id": 1,
  "project_name": "CP-00633 Casa Las Palmas 02",
  "project_code": "CP-1234",
  "number_of_boreholes": 3,
  "number_of_strata": 3,
  "formulation": "kishida"
}
```
📝 **Save `project_id = 1` for next steps**

---

### Step 2: Create Stratum Definitions (Material Properties Only)
**Endpoint**: `POST /api/v1/stratum-definitions/` (3 separate calls)

#### Stratum Definition 1:
```json
{
  "project_id": 1,
  "stratum_code": 1,
  "name": "Ceniza Volcánica",
  "description": "Limos, suelos finogranulares",
  "gamma_humid": 18.5,
  "gamma_saturated": 19.0,
  "behavior_type": "granular"
}
```

#### Stratum Definition 2:
```json
{
  "project_id": 1,
  "stratum_code": 2,
  "name": "H-VI Migmatita Puente P",
  "description": "Limos, suelos finogranulares", 
  "gamma_humid": 19.5,
  "gamma_saturated": 20.0,
  "behavior_type": "granular"
}
```

#### Stratum Definition 3:
```json
{
  "project_id": 1,
  "stratum_code": 3,
  "name": "H-V Migmatita de Puente P",
  "description": "Limos, suelos finogranulares",
  "gamma_humid": 16.0,
  "gamma_saturated": 16.5,
  "behavior_type": "granular"
}
```

📝 **Save stratum IDs: stratum_def_1 = X, stratum_def_2 = Y, stratum_def_3 = Z**

---

### Step 3: Create Boreholes
**Endpoint**: `POST /api/v1/boreholes/` (3 separate calls)

#### P1 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P1",
  "final_depth": 6.56,
  "diameter_mm": 90.0,
  "field_energy_percent": 45.0,
  "water_table_depth": 3.0,
  "formulation": "kishida"
}
```

#### P2 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P2", 
  "final_depth": 6.56,
  "diameter_mm": 90.0,
  "field_energy_percent": 45.0,
  "water_table_depth": 20.0,
  "formulation": "kishida"
}
```

#### P3 Borehole:
```json
{
  "project_id": 1,
  "borehole_name": "P3",
  "final_depth": 6.56,
  "diameter_mm": 90.0, 
  "field_energy_percent": 45.0,
  "water_table_depth": 20.0,
  "formulation": "kishida"
}
```

📝 **Save borehole IDs: P1_id = A, P2_id = B, P3_id = C**

---

### Step 4: Create Borehole-Stratum Associations (Depths per Borehole)
**Endpoint**: `POST /api/v1/borehole-strata/` (8 separate calls)

⭐ **CLAVE**: Aquí definimos las profundidades específicas de cada estrato en cada perforación

#### P1 Strata Assignments:
```json
{
  "borehole_id": A,
  "stratum_definition_id": X,
  "initial_depth": 1.00,
  "final_depth": 2.00
}
```

```json
{
  "borehole_id": A,
  "stratum_definition_id": Y,
  "initial_depth": 2.00,
  "final_depth": 4.45
}
```

```json
{
  "borehole_id": A,
  "stratum_definition_id": Z,
  "initial_depth": 4.45,
  "final_depth": 6.45
}
```

#### P2 Strata Assignments (Different Depths!):
```json
{
  "borehole_id": B,
  "stratum_definition_id": X,
  "initial_depth": 1.00,
  "final_depth": 1.45
}
```

```json
{
  "borehole_id": B,
  "stratum_definition_id": Y,
  "initial_depth": 1.45,
  "final_depth": 2.45
}
```

```json
{
  "borehole_id": B,
  "stratum_definition_id": Z,
  "initial_depth": 2.45,
  "final_depth": 6.45
}
```

#### P3 Strata Assignments (Only strata 2 & 3):
```json
{
  "borehole_id": C,
  "stratum_definition_id": Y,
  "initial_depth": 1.00,
  "final_depth": 4.45
}
```

```json
{
  "borehole_id": C,
  "stratum_definition_id": Z,
  "initial_depth": 4.45,
  "final_depth": 6.45
}
```

📝 **Save borehole-stratum IDs for SPT intervals**

---

### Step 5: Create SPT Intervals (New Structure)
**Endpoint**: `POST /api/v1/spt-intervals/` (12 separate calls)

**IMPORTANTE**: Ahora usamos `borehole_stratum_id` en lugar de `stratum_id`

#### P1 SPT Intervals:
```json
{
  "borehole_stratum_id": [ID from P1-Stratum1 association],
  "depth_from": 1.00,
  "depth_to": 1.45,
  "nspt_field": 9,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P1-Stratum2 association],
  "depth_from": 3.00,
  "depth_to": 3.45,
  "nspt_field": 4,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P1-Stratum2 association], 
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 6,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P1-Stratum3 association],
  "depth_from": 5.00,
  "depth_to": 5.45,
  "nspt_field": 33,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P1-Stratum3 association],
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 77,
  "description": "Limos, suelos finogranulares"
}
```

#### P2 SPT Intervals:
```json
{
  "borehole_stratum_id": [ID from P2-Stratum1 association],
  "depth_from": 1.00,
  "depth_to": 1.45,
  "nspt_field": 11,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P2-Stratum2 association],
  "depth_from": 2.00,
  "depth_to": 2.45,
  "nspt_field": 12,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P2-Stratum3 association],
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 30,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P2-Stratum3 association],
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 41,
  "description": "Limos, suelos finogranulares"
}
```

#### P3 SPT Intervals:
```json
{
  "borehole_stratum_id": [ID from P3-Stratum2 association],
  "depth_from": 3.00,
  "depth_to": 3.45,
  "nspt_field": 10,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P3-Stratum2 association],
  "depth_from": 4.00,
  "depth_to": 4.45,
  "nspt_field": 16,
  "description": "Limos, suelos finogranulares"
}
```

```json
{
  "borehole_stratum_id": [ID from P3-Stratum3 association],
  "depth_from": 6.00,
  "depth_to": 6.45,
  "nspt_field": 53,
  "description": "Limos, suelos finogranulares"
}
```

---

### Step 6: Trigger Calculations  
**Endpoint**: `POST /api/v1/calculations/project/{project_id}/calculate`

```json
{}
```

---

### Step 7: Get Results for Excel Comparison
**Endpoint**: `GET /api/v1/calculations/project/{project_id}/results`

---

### 🚀 Step 8: Test Complete Workflow Endpoint
**Endpoint**: `POST /api/v1/project-workflow/example-cp00633`

```json
{}
```

Este endpoint crea automáticamente todo el proyecto CP-00633 completo para comparar con los pasos manuales.

---

## 🧪 API Testing Sequence

### Manual Testing via `/docs`:
1. **Start Backend**: `cd backend && python -m app.main`
2. **Open API Docs**: `http://localhost:8000/docs`
3. **Execute requests** in the new 8-step order above
4. **Save IDs** between steps (project_id, stratum_definition_ids, borehole_ids, borehole_stratum_ids)
5. **Compare calculations** with Excel τ and φ values

### Automated Testing:
```bash
cd backend
python test_api_workflow_v2.py
```

---

## 📊 Expected Results to Compare with Excel

### P1 Calculations:
- **@ 1.23m** (Stratum 1): σ'_eff, N45, φ_eq, τ values
- **@ 3.23m** (Stratum 2): σ'_eff, N45, φ_eq, τ values  
- **@ 4.23m** (Stratum 2): σ'_eff, N45, φ_eq, τ values
- **@ 5.23m** (Stratum 3): σ'_eff, N45, φ_eq, τ values
- **@ 6.23m** (Stratum 3): σ'_eff, N45, φ_eq, τ values

### P2 Calculations:
- **@ 1.23m** (Stratum 1): Same material as P1, different depth context
- **@ 2.23m** (Stratum 2): Same material as P1@3.23m, different depth/stress
- **@ 4.23m** (Stratum 3): Same material, different stress state than P1@5.23m
- **@ 6.23m** (Stratum 3): Same material as P1@6.23m

### P3 Calculations:
- **@ 3.23m** (Stratum 2): Compare with P1@3.23m and P2@2.23m
- **@ 4.23m** (Stratum 2): Compare with P1@4.23m  
- **@ 6.23m** (Stratum 3): Compare with P1@6.23m and P2@6.23m

---

## ✅ Validation Checkpoints

### New Structure Validation:
- [ ] **Stratum Definitions**: Only contain material properties (no depths)
- [ ] **Borehole Strata**: Each borehole has different depth ranges for same materials
- [ ] **P1 vs P2**: Same Stratum 2 material at different depths (2.00-4.45m vs 1.45-2.45m)
- [ ] **P3 Coverage**: Only has strata 2 & 3 (no stratum 1)

### Calculation Validation:
- [ ] **Material Consistency**: Same γh/γsat used regardless of depth/borehole
- [ ] **Stress Calculation**: Different σ'_eff for same material at different depths
- [ ] **N45 Normalization**: Consistent correction factors applied
- [ ] **φ_eq Calculation**: Kishida formula applied correctly
- [ ] **τ Values**: σ'_eff × tan(φ_eq) matches Excel

### Excel Comparison Points:
- [ ] **P1@1.23m**: N=9 → N45 → φ_eq → τ (Ceniza Volcánica properties)
- [ ] **P2@2.23m**: N=12 → Different stress than P1 same material 
- [ ] **Water Table Effect**: P1 saturated below 3m, P2/P3 all unsaturated
- [ ] **Regression Analysis**: Global c' and φ' per material across all boreholes

---

## 🔧 Troubleshooting

### Common Issues:
1. **Missing borehole_stratum_id**: Must create borehole-strata associations before SPT intervals
2. **Depth validation errors**: SPT interval depths must fall within borehole-stratum ranges
3. **Material property mismatch**: Check that same stratum_definition_id gives consistent γh/γsat
4. **Water table effects**: P1 has shallow WT (3m), affects calculations differently than P2/P3

### Debug Endpoints:
- `GET /api/v1/borehole-strata/borehole/{borehole_id}` - Check stratum assignments per borehole
- `GET /api/v1/spt-intervals/borehole/{borehole_id}` - Verify intervals created correctly
- `GET /api/v1/stratum-definitions/` - Confirm material properties

---

## 📋 Notes for Excel Comparison

- **Same Materials, Different Context**: Stratum 2 appears in all 3 boreholes but at different depths and stress states
- **Stress State Importance**: Same N-value in same material will give different φ_eq due to different σ'_eff
- **Water Table Impact**: P1's shallow water table (3m) creates different effective stress profile than P2/P3 (20m)
- **Regression Quality**: More data points from same material across boreholes should improve c' and φ' regression