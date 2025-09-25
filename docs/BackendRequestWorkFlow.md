```json
// POST /api/v1/projects/
{
  "project_name": "Edificio Residencial Aurora",
  "number_of_boreholes": 3,
  "number_of_strata": 3,
  "formulation": "kishida"
}
// POST /api/v1/strata/
{
  "project_id": 1,
  "stratum_code": 1,
  "name": "Ceniza Volcánica",
  "description": "Ceniza volcánica con fragmentos de roca",
  "initial_depth": 0.0,
  "final_depth": 2.5,
  "gamma_humid": 18.5,
  "gamma_saturated": 19.2,
  "behavior_type": "granular",
  "plasticity_index": null
}



```