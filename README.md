# FastAPI Application

A modern, fast web API built with FastAPI, including PostgreSQL database support.

## Features

- **FastAPI Framework**: Modern, fast Python web framework
- **PostgreSQL Support**: Database integration with SQLAlchemy
- **CORS Enabled**: Cross-origin resource sharing configured
- **Auto Documentation**: Interactive API docs at `/docs` and `/redoc`
- **Environment Configuration**: Settings loaded from environment variables
- **Structured Architecture**: Clean, organized codebase

## Project Structure

```
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app instance and configuration
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # API endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Application settings
│   └── models/
│       ├── __init__.py
│       └── schemas.py       # Pydantic models
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Quick Start

### 1. Activate your virtual environment
```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows Command Prompt
.venv\Scripts\activate.bat

# Linux/Mac
source .venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
Edit the `.env` file with your settings:
- Update database connection string
- Change the secret key for production
- Adjust CORS origins as needed

### 4. Run the application
```bash
# Development mode (with auto-reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Or run directly
python -m app.main
```

### 5. Access the API
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/v1/health

## API Endpoints

### Health & Info
- `GET /api/v1/health` - Health check
- `GET /api/v1/` - Welcome message

### Users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `POST /api/v1/users/` - Create new user
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Items
- `GET /api/v1/items/` - Get all items (with pagination)
- `GET /api/v1/items/{item_id}` - Get item by ID
- `POST /api/v1/items/` - Create new item
- `PUT /api/v1/items/{item_id}` - Update item
- `DELETE /api/v1/items/{item_id}` - Delete item

## Configuration

The application uses environment variables for configuration. Key settings include:

- `APP_NAME`: Application name
- `DEBUG`: Enable debug mode
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for security
- `ALLOWED_ORIGINS`: CORS allowed origins

## Database Setup

Since you have SQLAlchemy and psycopg2 installed, you can easily add database models:

1. Create database models in `app/models/database.py`
2. Set up database connection in `app/core/database.py`
3. Add database dependency injection for your routes

## Development

### Adding New Endpoints
1. Add new routes in `app/api/routes.py`
2. Create corresponding Pydantic models in `app/models/schemas.py`
3. Update documentation as needed

### Environment Variables
Always use environment variables for sensitive data and configuration that changes between environments.

## Production Deployment

1. Set `DEBUG=False` in production
2. Use a strong, unique `SECRET_KEY`
3. Configure proper database credentials
4. Set appropriate CORS origins
5. Use a production WSGI server like Gunicorn with Uvicorn workers

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```
