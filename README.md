# Mini LMS - Learning Management System

A full-stack Learning Management System built with FastAPI, React TypeScript, and PostgreSQL.

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/Decent-B/mini_lms_app.git
cd mini_lms_app

# Copy environment template
cp .env.example .env

# Edit .env with your secrets (see Security Setup below)
nano .env

# Start everything with Docker Compose
docker-compose up --build
```

That's it! The application will:
- ✅ Start PostgreSQL database
- ✅ Run database migrations automatically
- ✅ Seed database with test data
- ✅ Start backend API server
- ✅ Start frontend development server

### Access the Application

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

## 🔐 Security Setup

Before first run, generate secure secrets:

```bash
# Generate SECRET_KEY for JWT
openssl rand -hex 32

# Edit .env file and update:
# - SECRET_KEY=<generated-key-here>
# - POSTGRES_PASSWORD=<strong-password>
```

**Important**: Never commit the `.env` file!

## 📊 Test Data

The database is automatically seeded with realistic test data on first startup:

### Test Accounts

All test accounts use password: `password123`

| Role | Email | Description |
|------|-------|-------------|
| Staff | staff@minilms.com | Full system access |
| Parent | john.smith@email.com | Parent with 2 children |
| Student | emma.smith@email.com | Student account |

### Data Overview

- **7 Parents** (3 with 2 children, 4 with 1 child)
- **10 Students** with varying ages and grades
- **20 Classes** distributed evenly across weekdays (4 per day)
- **25 Subscriptions** (students have 2-3 subscriptions each)
- **39 Class Registrations** (no schedule conflicts)

### Sample Data Structure

**Parents & Students:**
- John & Mary Smith → Emma (Grade 8) & Oliver (Grade 6)
- David & Sarah Williams → Ava (Grade 8) & Noah (Grade 6)
- Michael Johnson → Sophia (Grade 7) & Liam (Grade 5)
- Emily Brown → Isabella (Grade 7)
- James Davis → Ethan (Grade 5)
- Patricia Wilson → Mia (Grade 8)
- Robert Martinez → Lucas (Grade 6)

**Classes by Day:**
- Monday: Math Fundamentals, English Literature, Science Lab, Art & Creativity
- Tuesday: Advanced Math, History & Culture, Computer Programming, Music Theory
- Wednesday: Physics, Creative Writing, Geography, Physical Education
- Thursday: Chemistry, Spanish, Web Development, Drama & Theater
- Friday: Biology, Economics, Robotics Club, Photography

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python 3.12)
- PostgreSQL 16
- SQLAlchemy ORM
- Alembic (migrations)
- JWT Authentication
- Bcrypt password hashing

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- (To be implemented)

**DevOps:**
- Docker & Docker Compose
- Multi-stage builds
- Automated migrations
- Database seeding

### Project Structure

```
mini_lms_app/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration, security, database
│   │   ├── models/        # SQLAlchemy models (6 tables)
│   │   ├── schemas/       # Pydantic validation schemas
│   │   ├── routers/       # API endpoints (to be implemented)
│   │   ├── services/      # Business logic
│   │   ├── main.py        # FastAPI application
│   │   └── seed_data.py   # Database seeding script
│   ├── alembic/           # Database migrations
│   ├── Dockerfile
│   └── docker-entrypoint.sh
├── frontend/              # React TypeScript app (to be implemented)
├── docker-compose.yml     # Orchestration
├── .env.example           # Environment template
└── README.md
```

## 🗄️ Database Schema

### Users
- Authentication for all system users
- Roles: `staff`, `parent`, `student`

### Parents → Students (One-to-Many)
- Parents can have multiple children
- Students linked to one parent

### Students ↔ Classes (Many-to-Many via ClassRegistrations)
- Students can enroll in multiple classes
- Unique constraint prevents duplicate enrollments
- No schedule conflicts enforced

### Students → Subscriptions (One-to-Many)
- Track learning package sessions
- Monitor used vs remaining sessions

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate

# Run locally (database must be running)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Management

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1

# Re-seed database (WARNING: clears existing data)
docker-compose exec backend python -m app.seed_data
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f db
```

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

## 📝 API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

### Planned Endpoints

**Authentication:**
- POST `/api/v1/auth/login` - User login

**Staff Only:**
- CRUD operations for parents, students, classes
- Manage subscriptions and registrations

**Parent Access:**
- View children's subscriptions and schedules

**Student Access:**
- View own subscriptions and class schedule

## 🚢 Deployment

### Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required in production:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=<64-character-hex-string>
POSTGRES_PASSWORD=<strong-password>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
```

## 🔒 Security Features

✅ **Implemented:**
- JWT token authentication
- Bcrypt password hashing
- Role-based access control
- Environment-based secrets
- SQL injection protection (ORM)
- Input validation (Pydantic)
- CORS configuration
- Non-root Docker containers

⏳ **To Implement:**
- Rate limiting
- Refresh tokens
- API key authentication
- Request logging
- Security headers

## 📚 Documentation

- [Tech Stack Details](TECH_STACK.md)
- [Database Setup Guide](DATABASE_SETUP.md)
- [Backend README](backend/BACKEND_README.md)
- [ER Diagram](system_docs/er_diagram.md)
- [Use Cases](system_docs/use_cases.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 👥 Authors

[Add your information here]

## 🙏 Acknowledgments

Built as part of the TeenUp Fullstack Developer assessment.
