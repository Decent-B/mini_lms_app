# Tech Stack

## Backend
- **Framework**: FastAPI
- **Language**: Python 3.x
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (JSON Web Tokens)
  - python-jose for JWT handling
  - passlib with bcrypt for password hashing

## Frontend
- **Framework**: React.js
- **Language**: TypeScript
- **Build Tool**: Vite

## Database
- **Database**: PostgreSQL
- **Driver**: psycopg2-binary

## Project Structure
```
mini_lms_app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── api/
│   │   │   └── v1/              # API version 1 routes
│   │   ├── core/
│   │   │   ├── config.py        # Configuration settings
│   │   │   ├── database.py      # Database connection
│   │   │   └── security.py      # JWT & authentication utilities
│   │   ├── models/              # SQLAlchemy models
│   │   └── schemas/             # Pydantic schemas
│   ├── alembic/                 # Database migrations
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Core Dependencies

### Backend (Python)
- fastapi
- uvicorn[standard]
- sqlalchemy
- alembic
- psycopg2-binary
- python-jose[cryptography]
- passlib[bcrypt]
- pydantic
- python-multipart
- python-dotenv

### Frontend (JavaScript/TypeScript)
- react
- typescript
- vite
- react-router-dom
- axios or react-query

## Development Setup
- Docker & Docker Compose for containerization
- Virtual environment (.venv) for Python dependencies
- Node.js package manager for frontend dependencies

## Notes
- No complex file storage or video handling required
- Current JWT authentication implementation is sufficient
- Focus on core LMS functionality: users, courses, lessons, enrollments
