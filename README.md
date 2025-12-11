# Mini LMS - Learning Management System

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Architecture & Design](#architecture--design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Testing the APIs](#testing-the-apis)
- [Using the UI](#using-the-ui)
- [API Documentation](#api-documentation)

---

## 📖 About the Project

**Mini LMS** is a small Learning Management System that provides a centralized platform for managing educational operations including:

- **Student & Parent Management**: Comprehensive profiles with relationship tracking
- **Class Scheduling**: Scheduling system with conflict detection
- **Subscription Management**: Flexible subscription packages with session tracking
- **Role-Based Access**: Separate dashboards for Staff, Parents, and Students

This project serves as a test for my application at **TeenUp** - An EdTech company which empowers teens to grow up safe, healthy, and happy with the education and healthcare they deserve through technology.

---

## 🏗 Architecture & Design

### Use Case Diagram

The system supports three main user roles with distinct functionalities:

![Use Case Diagram](system_docs/Use_Case_MiniLMS.png)

**Key Actors:**
- **Staff**: Full administrative access to manage parents, students, classes, and subscriptions
- **Parent**: View children's information, class schedules, and subscription status
- **Student**: View personal class schedule and subscription details

### Database Schema

The system uses a relational database design with proper normalization and foreign key constraints:

![Database ER Diagram](system_docs/Database_ER_MiniLMS.png)

**Core Entities:**
- **Users**: Base authentication table with role-based access (staff, parent, student)
- **Parents**: Extended user profiles with contact information
- **Students**: Student profiles linked to parents with academic details
- **Classes**: Class definitions with schedule, capacity, and teacher information
- **ClassRegistrations**: Many-to-many relationship between students and classes
- **Subscriptions**: Package-based session tracking with usage monitoring

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose, passlib with bcrypt)
- **API Documentation**: OpenAPI/Swagger (auto-generated)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend)
- **ASGI Server**: Uvicorn (backend)

---

## 📁 Project Structure

```
mini_lms_app/
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── seed_data.py         # Database seeding script
│   │   ├── core/                # Core functionality
│   │   │   ├── config.py        # Configuration management
│   │   │   ├── database.py      # Database connection
│   │   │   ├── security.py      # JWT & password hashing
│   │   │   └── dependencies.py  # Dependency injection
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── parent.py
│   │   │   ├── student.py
│   │   │   ├── class_model.py
│   │   │   ├── class_registration.py
│   │   │   └── subscription.py
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic layer
│   │   └── utils/               # Utility functions
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   └── pyproject.toml           # Python dependencies
├── frontend/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/           # Staff management components
│   │   │   └── dashboard/       # Parent/Student dashboards
│   │   ├── pages/               # Page components
│   │   ├── contexts/            # React contexts (Auth)
│   │   ├── services/            # API client
│   │   └── types/               # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json             # Node dependencies
├── system_docs/                  # Documentation
│   ├── api_documentation.md     # Complete API reference
│   ├── use_cases.md
│   ├── er_diagram.md
│   └── tech_stack.md
├── docker-compose.yml            # Multi-container orchestration
├── .env.example                  # Environment template
├── test_api.sh                   # API testing script
└── README.md                     # This file
```

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control
- Secure password hashing using bcrypt
- Protected routes with automatic token validation

### 👥 User Management
- **Staff**: Full CRUD operations for all entities
- **Parents**: View and manage children's information
- **Students**: Access personal academic information

### 📚 Class Management
- Create classes with detailed scheduling information
- Timetable visualization for all classes
- Automatic schedule conflict detection
- Real-time capacity tracking

### 📝 Registration System
- Register students to classes
- Automatic validation for:
  - Time slot conflicts
  - Class capacity limits
  - Active subscription requirements
- Unregister students from classes

### 💳 Subscription Management
- Flexible subscription packages
- Session-based tracking (total vs. used)
- Automatic status calculation (active/expired)
- Session usage tracking with remaining count
- Date-based expiration handling

### 📊 Dashboard Features
- **Staff Dashboard**: 
  - Comprehensive management interface for all resources
  - Edit functionality for parents, students, classes, and subscriptions
  - Interactive weekly class schedule with visual overlaps
  - Real-time statistics and monitoring

- **Parent Dashboard**:
  - View all children's profiles
  - Monitor subscription status and remaining sessions
  - View children's class schedules
  - Track academic progress

- **Student Dashboard**:
  - Personal class schedule
  - Subscription status and session count
  - Academic information overview

---

## 🚀 Getting Started

### Prerequisites

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Decent-B/mini_lms_app.git
cd mini_lms_app
```

2. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

3. **Configure your `.env` file**

Open `.env` and update the following values:

```dotenv
# Database Configuration
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=mini_lms_db

# JWT Secret Key - Generate with: openssl rand -hex 32
SECRET_KEY=your_generated_secret_key_here
```

**Generate a secure SECRET_KEY:**

```bash
openssl rand -hex 32
```

Copy the generated key and paste it into your `.env` file.

4. **Set up frontend environment variables**

```bash
cd frontend
cp .env.example .env
cd ..
```

The frontend `.env` file contains:

```dotenv
# API endpoint configuration
VITE_API_BASE_URL=http://localhost:8000/api
```

**Note**: For production deployment, update `VITE_API_BASE_URL` to point to your production backend URL.

> ⚠️ **Important**: Never commit `.env` files to version control! They're already included in `.gitignore`.

---

## 🐳 Running the Application

### Start All Services

Use Docker Compose to build and start all services:

```bash
docker-compose up --build
```

This command will:
1. ✅ Build the backend and frontend Docker images
2. ✅ Start PostgreSQL database container
3. ✅ Run database migrations automatically
4. ✅ Seed the database with test data
5. ✅ Start the backend API server (port 8000)
6. ✅ Start the frontend application (port 3000)

### Run in Detached Mode

To run in the background:

```bash
docker-compose up -d --build
```

### Stop All Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose up --build -d backend
docker-compose up --build -d frontend

# Rebuild all
docker-compose up --build
```

### Access Points

Once running, access the application at:

- 🌐 **Frontend Application**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **Interactive API Docs**: http://localhost:8000/docs
- 📖 **Alternative API Docs**: http://localhost:8000/redoc

---

## 🧪 Testing the APIs

### Using the Test Script

A comprehensive bash script is provided to test all major API endpoints:

```bash
# Make the script executable (first time only)
chmod +x test_api.sh

# Run the test script
./test_api.sh
```

The script will automatically:
- Authenticate as a staff user
- Create a parent account
- Create a student linked to the parent
- Create classes with different schedules
- Register student to a class
- Test schedule conflict detection
- Create a subscription package
- Use a session and verify tracking
- Display all responses with color-coded output

### Manual API Testing

You can also test APIs manually using curl or the interactive documentation:

**Using Swagger UI:**
1. Open http://localhost:8000/docs
2. Click "Authorize" and enter credentials
3. Try out any endpoint interactively

**Using curl:**

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@example.com", "password": "staff123"}'

# Get classes for Monday
curl -X GET "http://localhost:8000/api/classes?day_of_week=Monday" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🖥 Using the UI

### Test Accounts

The system is seeded with test accounts for each role:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Staff** | staff@minilms.com | password123 | Full administrative access |
| **Parent** | john.smith@email.com | password123 | Parent with 2 children (Emma & Oliver) |
| **Student** | emma.smith@email.com | password123 | Student enrolled in classes |

### Staff Portal

1. Login with staff credentials at http://localhost:3000
2. Access the admin panel with full CRUD operations
3. Manage parents, students, classes, and subscriptions
4. View weekly class schedules with visual conflict detection
5. Edit any resource using the pen icon buttons

### Parent Dashboard

1. Login with parent credentials
2. View all children's information
3. Monitor subscription status and remaining sessions
4. View children's class schedules
5. Track academic progress

### Student Dashboard

1. Login with student credentials
2. View personal class schedule (weekly grid view)
3. Check subscription status and remaining sessions
4. View academic information

### Features to Explore

- **Visual Class Schedule**: Interactive weekly grid with time slots
- **Edit Functionality**: Click pen icons to edit resources
- **Real-time Updates**: Changes reflect immediately across the system
- **Schedule Conflict Detection**: Try registering a student to overlapping classes
- **Session Tracking**: Use sessions and watch the count update
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 📚 API Documentation

### Complete API Reference

For detailed information about all available API endpoints, including request/response schemas, authentication requirements, and examples, refer to:

**📄 [Complete API Documentation](system_docs/api_documentation.md)**

The documentation covers:
- Authentication endpoints
- Parent management (CRUD)
- Student management (CRUD)
- Class management (CRUD)
- Class registration with conflict detection
- Subscription management (CRUD + usage tracking)
- All request/response examples with curl commands

### Quick API Overview

#### Authentication
- `POST /api/auth/login` - User login

#### Parents
- `GET /api/parents` - List all parents
- `POST /api/parents` - Create parent
- `GET /api/parents/{id}` - Get parent details
- `PATCH /api/parents/{id}` - Update parent
- `DELETE /api/parents/{id}` - Delete parent
- `GET /api/parents/me` - Get current parent's info

#### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/{id}` - Get student details
- `PATCH /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `GET /api/students/me` - Get current student's info
- `GET /api/students/me/classes` - Get student's classes

#### Classes
- `GET /api/classes` - List all classes (filterable by day)
- `POST /api/classes` - Create class
- `GET /api/classes/{id}` - Get class details with enrolled students
- `PATCH /api/classes/{id}` - Update class
- `DELETE /api/classes/{id}` - Delete class
- `POST /api/classes/{id}/register` - Register student to class
- `DELETE /api/classes/{id}/registrations/{student_id}` - Unregister student

#### Subscriptions
- `GET /api/subscriptions` - List all subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/{id}` - Get subscription details
- `PATCH /api/subscriptions/{id}` - Update subscription
- `DELETE /api/subscriptions/{id}` - Delete subscription
- `PATCH /api/subscriptions/{id}/use` - Use one session
- `GET /api/students/me/subscriptions` - Get student's subscriptions

---

## 📊 Test Data

The database is automatically seeded with realistic test data on first startup:

### Test Accounts

All test accounts use the same password: `password123`

| Role | Email | Description |
|------|-------|-------------|
| Staff | staff@minilms.com | Full system access |
| Parent | john.smith@email.com | Parent with 2 children (Emma & Oliver Smith) |
| Student | emma.smith@email.com | Grade 8 student, linked to John Smith |

### Data Overview

- **7 Parents** (3 with 2 children, 4 with 1 child)
- **10 Students** with varying ages and grades
- **27 Classes** (20 standard classes + 7 with overlapping time slots)
- **25 Subscriptions** (students have 2-3 subscriptions each)
- **101 Class Registrations** (no schedule conflicts per student)

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

## 🔄 Database Management

### Development Mode (Auto-Reset)

When `ENVIRONMENT=development` in your `.env` file:
- **Automatic**: Database tables are **dropped and recreated** on every backend restart
- **Automatic**: Fresh test data is seeded every time
- **Use case**: Local development, testing changes from scratch

```bash
# Start in development mode (default)
docker-compose up -d

# Restart to reset database
docker-compose restart backend

# Or force rebuild
docker-compose down && docker-compose up --build -d
```

**What happens in development:**
1. Backend starts
2. All tables are **dropped** (⚠️ all data lost)
3. Tables are recreated with latest schema
4. Database is seeded with test data
5. Application starts

### Production Mode (Preserve Data)

When `ENVIRONMENT=production` in your `.env` file:
- **Safe**: Database is **never dropped automatically**
- **Idempotent**: Seeding only runs if database is empty
- **Use case**: Production, staging environments

```bash
# Set environment in .env
ENVIRONMENT=production

# Start application
docker-compose up -d
```

**What happens in production:**
1. Backend starts
2. Tables are created **only if they don't exist**
3. Seeding **skipped** if any users exist
4. Application starts with existing data intact

### Manual Database Operations

```bash
# Drop all data and reseed (development only)
docker-compose restart backend

# Run migrations manually
docker-compose exec backend alembic upgrade head

# Seed database manually
docker-compose exec backend python -m app.seed_data

# Access database directly
docker-compose exec db psql -U lms_user -d mini_lms_db

# Backup database
docker-compose exec db pg_dump -U lms_user mini_lms_db > backup.sql

# Restore database
docker-compose exec -T db psql -U lms_user mini_lms_db < backup.sql
```

### Environment Configuration

Edit your `.env` file:

```bash
# For local development (auto-reset)
ENVIRONMENT=development

# For production/staging (preserve data)
ENVIRONMENT=production
```

⚠️ **Warning**: Never set `ENVIRONMENT=development` in production! All data will be lost on restart.

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
---

## 🛠 Development

### Local Development Setup

If you want to develop without Docker:

**Backend:**

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Migrations

Create a new migration after model changes:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

---

## 🔒 Security Considerations

### Implemented Security Features

✅ **Authentication & Authorization:**
- JWT token-based authentication
- Bcrypt password hashing with salt
- Role-based access control (RBAC)
- Protected API endpoints

✅ **Data Security:**
- SQL injection protection via ORM (SQLAlchemy)
- Input validation and sanitization (Pydantic)
- Environment-based secrets management
- Non-root Docker containers

✅ **API Security:**
- CORS configuration
- Request/response validation
- Automatic API documentation

### Important Security Notes

⚠️ **Production Deployment:**
- Always generate new `SECRET_KEY` for production
- Use strong `POSTGRES_PASSWORD`
- Never commit `.env` file to version control
- Enable HTTPS in production
- Configure proper CORS origins
- Set `ENVIRONMENT=production` in production `.env`

---

## 📚 Additional Documentation

For more detailed information, refer to:

- 📖 **[Complete API Documentation](system_docs/api_documentation.md)** - All API endpoints with examples
- 🗂 **[Database ER Diagram](system_docs/er_diagram.md)** - Database schema details
- 🎯 **[Use Cases](system_docs/use_cases.md)** - Detailed use case specifications
- 🛠 **[Tech Stack](system_docs/tech_stack.md)** - Complete technology stack details
- 📊 **[Test Data Reference](system_docs/TEST_DATA_REFERENCE.md)** - Seeded test data

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000  # or :8000
# Kill the process or change the port in docker-compose.yml
```

**Database connection errors:**
```bash
# Ensure PostgreSQL is running
docker-compose ps db
# Check database logs
docker-compose logs db
# Restart database
docker-compose restart db
```

**Frontend not loading:**
```bash
# Rebuild frontend
docker-compose up --build -d frontend
# Check frontend logs
docker-compose logs frontend
```

**Authentication errors:**
- Verify `SECRET_KEY` is set in `.env`
- Check that you're using the correct test account credentials
- Ensure token is included in Authorization header

---

## 👥 Authors

**Binh Nguyen** - *Initial work*

---

## 🙏 Acknowledgments

- Special thanks to the FastAPI and React communities

---

## 📧 Support

For questions or issues:
- Create an issue on GitHub
- Check existing documentation in `system_docs/`
- Review the API documentation at http://localhost:8000/docs

---

**Happy Learning! 📚✨**
