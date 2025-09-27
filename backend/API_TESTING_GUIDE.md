# API Testing Guide

## Overview
This testing script automates the complete backend API workflow using real data from the CP-00633 Casa Las Palmas Excel project.

## How to Run

### 1. Prerequisites
```bash
cd backend
pip install -r test_requirements.txt
```

### 2. Start Backend Server
```bash
cd backend
python -m app.main
```
Server should start on http://localhost:8000

### 3. Run the Test Script
```bash
cd backend
python test_api_workflow.py
```

## What the Script Does

### Step-by-Step Process:
1. **Server Health Check**: Verifies backend is running
2. **Project Creation**: Creates "CP-00633 Casa Las Palmas" project
3. **Strata Creation**: Creates 3 geological strata using bulk endpoint
4. **Borehole Creation**: Creates 3 boreholes (P1, P2, P3) with different configurations
5. **SPT Intervals**: Creates 12 individual SPT test intervals
6. **Calculations**: Triggers geotechnical calculations (if endpoint exists)
7. **Results**: Retrieves calculation results for validation

### Test Data Details:
- **Project**: CP-00633 Casa Las Palmas, Kishida formulation, 45% energy
- **Strata**: 3 geological layers (Ceniza Volcánica, H-VI Migmatita, H-V Migmatita)
- **Boreholes**: P1 (shallow water table), P2 & P3 (deep water table)
- **SPT Tests**: 12 intervals with N-values from 4 to 77

## Expected Output

### Success Case:
```
[HH:MM:SS] INFO: 🚀 Starting Complete API Test Workflow
[HH:MM:SS] INFO: ✅ Server is running (API accessible)
[HH:MM:SS] INFO: 📁 Step 1: Creating project...
[HH:MM:SS] INFO: ✅ Project created successfully (ID: 1)
[HH:MM:SS] INFO: 🏔️  Step 2: Creating strata (bulk)...
[HH:MM:SS] INFO: ✅ 3 strata created successfully
[HH:MM:SS] INFO: 🕳️  Step 3: Creating boreholes...
[HH:MM:SS] INFO: ✅ All 3 boreholes created successfully
[HH:MM:SS] INFO: 📊 Step 4: Creating SPT intervals...
[HH:MM:SS] INFO: ✅ All 12 SPT intervals created successfully
[HH:MM:SS] INFO: 🧮 Step 5: Triggering calculations...
[HH:MM:SS] INFO: ✅ Calculations triggered successfully
[HH:MM:SS] INFO: 📈 Step 6: Retrieving calculation results...
[HH:MM:SS] INFO: ✅ Calculation results retrieved
[HH:MM:SS] INFO: 🎉 All steps completed successfully!
```

## How It's Built

### Architecture:
```
APITester Class
├── __init__(): Initialize base URL and test data
├── test_data: Excel project data structure
├── make_request(): HTTP client with error handling
├── step_1_create_project(): POST /projects/
├── step_2_create_strata_bulk(): POST /strata/bulk
├── step_3_create_boreholes(): POST /boreholes/ (3 calls)
├── step_4_create_spt_intervals(): POST /spt-intervals/ (12 calls)
├── step_5_trigger_calculations(): POST /calculations/.../calculate
├── step_6_get_results(): GET /calculations/.../results
└── run_complete_test(): Orchestrates entire workflow
```

### Key Features:
1. **Data Mapping**: Automatically maps stratum codes to IDs, borehole names to IDs
2. **Error Handling**: Continues testing even if some endpoints don't exist yet
3. **Logging**: Detailed timestamped logs for debugging
4. **Validation**: Shows created data for manual verification
5. **Real Data**: Uses exact Excel project specifications

### Data Flow:
1. **Project** → gets `project_id`
2. **Strata** → maps `stratum_code` → `stratum_id`
3. **Boreholes** → maps `borehole_name` → `borehole_id`
4. **SPT Intervals** → uses mapped IDs for foreign keys
5. **Calculations** → operates on complete project data
6. **Results** → returns τ and φ values for validation

## Troubleshooting

### Server Not Running:
```
❌ Cannot proceed: Server is not running
Please start the backend server: cd backend && python -m app.main
```

### Database Issues:
- Reset database: `cd backend && python init_db.py`
- Check database connection in `app/core/database.py`

### API Endpoint Not Found:
```
⚠️  Calculations trigger failed (endpoint may not exist yet)
This is expected if calculation endpoints aren't implemented yet
```
Script will continue and show created data for validation.

## Next Steps After Success
1. Check database contents match Excel data
2. Compare calculated τ and φ values with Excel formulas
3. Test frontend integration with created backend data
4. Run additional edge case tests