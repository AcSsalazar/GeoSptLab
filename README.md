# SPT Parameters Calculator

A professional web application for calculating geotechnical soil resistance parameters (φ′, c′, E, Su, τ) from Standard Penetration Test (SPT) results.

![SPT Calculator Demo](https://github.com/user-attachments/assets/c88366e8-3191-433f-8186-21a83fbec1b0)

## Features

- **Complete SPT Analysis Pipeline**: Input SPT data → Apply corrections → Calculate geotechnical parameters
- **Multi-step Form Workflow**: Intuitive project setup, strata definition, borehole data input, and results visualization
- **Mathematical Correlations**: Implements Kishida and JRB formulations for friction angle calculations
- **Professional UI**: React TypeScript frontend with form validation and responsive design
- **RESTful API**: FastAPI backend with comprehensive CRUD operations
- **Database Integration**: PostgreSQL support with SQLAlchemy ORM
- **Data Validation**: Comprehensive input validation and error handling

## Technology Stack

- **Backend**: FastAPI with Python
- **Frontend**: React with TypeScript and Vite
- **Database**: PostgreSQL (with SQLite for development)
- **Architecture**: Multi-step form workflow with REST API

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite used by default)

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Initialize Database**
   ```bash
   python init_db.py
   ```

4. **Start Backend Server**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   API will be available at: http://localhost:8000
   
   Interactive API documentation: http://localhost:8000/docs

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

   Frontend will be available at: http://localhost:5173

### Database Setup (PostgreSQL)

1. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up postgres pgadmin -d
   ```

2. **Update Backend Configuration**
   ```bash
   # Edit backend/.env
   DATABASE_URL=postgresql://spt_user:spt_password@localhost:5432/spt_calculator
   ```

3. **Access pgAdmin**
   - URL: http://localhost:5050
   - Email: admin@sptcalculator.com
   - Password: admin123

## Application Workflow

### 1. Project Setup
- Define project parameters (code, formulation type, energy percentage)
- Configure borehole and stratum counts
- **Specify strata names** (comma-separated list matching the number of strata)
- Set equipment specifications

### 2. Soil Strata Definition
- Create soil layers with geotechnical properties
- Define unit weights (humid and saturated)
- Specify behavior type (cohesive/granular) and plasticity index

### 3. Borehole Data Input
- Add borehole locations and specifications
- Input SPT test intervals with N values
- Associate intervals with appropriate soil strata

### 4. Results and Calculations
- Automatic calculation of correction factors (CB, CS, CR, Cn)
- Normalized N values (N45, N55, N60, N145)
- Geotechnical parameters using selected correlations
- Data visualization and report generation

## API Endpoints

### Projects
- `GET /api/v1/projects/` - List all projects
- `POST /api/v1/projects/` - Create new project
- `GET /api/v1/projects/{id}` - Get project by ID
- `GET /api/v1/projects/{id}/details` - Get project with related data
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Soil Strata
- `GET /api/v1/strata/project/{project_id}` - Get strata for project
- `POST /api/v1/strata/` - Create new stratum
- `PUT /api/v1/strata/{id}` - Update stratum
- `DELETE /api/v1/strata/{id}` - Delete stratum

### Boreholes
- `GET /api/v1/boreholes/project/{project_id}` - Get boreholes for project
- `POST /api/v1/boreholes/` - Create new borehole
- `PUT /api/v1/boreholes/{id}` - Update borehole
- `DELETE /api/v1/boreholes/{id}` - Delete borehole

### SPT Intervals
- `GET /api/v1/spt-intervals/project/{project_id}` - Get intervals for project
- `POST /api/v1/spt-intervals/` - Create new interval
- `PUT /api/v1/spt-intervals/{id}` - Update interval
- `DELETE /api/v1/spt-intervals/{id}` - Delete interval

### Calculations
- `POST /api/v1/calculations/calculate` - Calculate SPT parameters for project
- `GET /api/v1/calculations/project/{id}/results` - Get calculated results
- `POST /api/v1/calculations/interval/{id}/calculate` - Calculate single interval

## Mathematical Formulations

### Stress Calculations
- Total stress: `σ_tot = γ·z`
- Effective stress: `σ′ = σ_tot - u`
- Pore pressure: `u = γw·max(0, z-NF)`

### Correction Factors
- **CB**: Borehole diameter correction
- **CS**: Sampling method correction  
- **CR**: Rod length correction
- **Cn**: Overburden pressure correction (Seed-Idriss/Marcuson method, Cn ≤ 2.0)

### N Value Normalization
- `N_ref = N_field × CB × CS × CR × CE × Cn`
- Energy corrections for 45%, 55%, and 60% efficiency

### Friction Angle Correlations
- **Kishida**: `φ′ (°) = 15 + √(12.5 × N145)`
- **JRB**: `φ′ (°) = 15 + √(9.375 × N145)`

### Additional Parameters
- Elastic modulus: `E = 500 × N60` (granular soils)
- Undrained shear strength: `Su = 6 × N60` (cohesive soils)
- Shear resistance: `τ = c′ + σ′ × tan(φ′)`

## Data Validation

### Input Ranges
- **Nspt**: ≥ 0 (integer)
- **Unit weights**: 10-40 kN/m³
- **Energy percentage**: 0-200%
- **Depths**: Consistent ordering (from < to)
- **Correction factors**: > 0

### Business Rules
- Project codes must be unique
- Strata must cover all depths without gaps
- SPT intervals cannot overlap within same borehole
- Water table depth validation

## Example Usage

### Create a New Project
```bash
curl -X POST "http://localhost:8000/api/v1/projects/" \
  -H "Content-Type: application/json" \
  -d '{
    "project_code": "CP-00630",
    "number_of_boreholes": 3,
    "number_of_strata": 3,
    "formulation": "kishida",
    "field_energy_percent": 45.0
  }'
```

### Calculate SPT Parameters
```bash
curl -X POST "http://localhost:8000/api/v1/calculations/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "recalculate_all": false
  }'
```

## Development

### Project Structure
```
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Configuration and calculations
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── repositories/ # Data access layer
│   └── init_db.py    # Database initialization
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
└── docker-compose.yml # PostgreSQL setup
```

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test
```

### Building for Production
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Check the API documentation at `/docs`
- Review the example data in the repository
- Open an issue on GitHub
