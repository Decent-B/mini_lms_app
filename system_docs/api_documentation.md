# Mini LMS Backend API Documentation

## Base URL
```
http://localhost:8000
```

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Parent Management APIs](#parent-management-apis)
3. [Student Management APIs](#student-management-apis)
4. [Class Management APIs](#class-management-apis)
5. [Class Registration APIs](#class-registration-apis)
6. [Subscription Management APIs](#subscription-management-apis)
7. [Common Error Responses](#common-error-responses)

---

## Authentication APIs

### 1. User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user and returns a JWT access token for subsequent API requests.

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "staff"
  }
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `access_token` | string | JWT token for authenticated requests |
| `token_type` | string | Token type (always "bearer") |
| `user` | object | Authenticated user information |
| `user.id` | integer | User ID |
| `user.name` | string | User's full name |
| `user.email` | string | User's email |
| `user.role` | string | User role ("staff", "parent", or "student") |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Invalid email or password | `{"detail": "Incorrect email or password"}` |
| 422 | Missing required field | `{"detail": [{"type": "missing", "loc": ["body", "email"], "msg": "Field required"}]}` |

**Authentication:**
- No authentication required for this endpoint
- The returned access token should be included in subsequent requests using the `Authorization: Bearer <token>` header

**Token Usage Example:**
```bash
curl -X GET http://localhost:8000/api/parents/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Token Expiration:**
- Tokens expire after the configured duration (default: 30 minutes)
- Upon expiration, clients must re-authenticate to obtain a new token

---

## Parent Management APIs

### 1. Create Parent

**Endpoint:** `POST /api/parents`

**Description:** Creates a new parent account with associated user credentials.

**Request Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `name` | string | Yes | min: 1, max: 255 | Full name of the parent |
| `email` | string | Yes | Valid email format, unique | Parent's email address |
| `password` | string | Yes | min: 8, max: 100 | Account password |
| `phone` | string | No | max: 50 | Phone number |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/parents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "SecurePass123!",
    "phone": "+84901234567"
  }'
```

**Response (201 Created):**
```json
{
  "phone": "+84901234567",
  "id": 1,
  "user_id": 1,
  "user": {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "id": 1,
    "role": "parent"
  }
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Parent record ID |
| `user_id` | integer | Associated user record ID |
| `phone` | string \| null | Parent's phone number |
| `user` | object | Nested user information |
| `user.id` | integer | User ID |
| `user.name` | string | User's full name |
| `user.email` | string | User's email |
| `user.role` | string | User role (always "parent") |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Email already exists | `{"detail": "Email already exists"}` |
| 400 | Invalid email format | `{"detail": [{"type": "string_pattern_mismatch", "loc": ["body", "email"], "msg": "String should match pattern"}]}` |
| 400 | Password too short | `{"detail": [{"type": "string_too_short", "loc": ["body", "password"], "msg": "String should have at least 8 characters"}]}` |
| 422 | Missing required field | `{"detail": [{"type": "missing", "loc": ["body", "name"], "msg": "Field required"}]}` |

**Constraints:**
- Email must be unique across all users
- Password must be at least 8 characters
- Name cannot be empty
- Phone is optional but limited to 50 characters

---

### 2. Get Parent by ID

**Endpoint:** `GET /api/parents/{parent_id}`

**Description:** Retrieves parent information by parent ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent_id` | integer | Yes | The ID of the parent to retrieve |

**Request Example:**
```bash
curl http://localhost:8000/api/parents/1
```

**Response (200 OK):**
```json
{
  "phone": "+84901234567",
  "id": 1,
  "user_id": 1,
  "user": {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "id": 1,
    "role": "parent"
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "parent_id"], "msg": "Input should be a valid integer"}]}` |

---

## Student Management APIs

### 3. Create Student

**Endpoint:** `POST /api/students`

**Description:** Creates a new student account associated with a parent.

**Request Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `parent_id` | integer | Yes | Must exist | Parent's ID |
| `name` | string | Yes | min: 1, max: 255 | Student's full name |
| `email` | string | Yes | Valid email, unique | Student's email |
| `password` | string | Yes | min: 8, max: 100 | Account password |
| `grade` | string | No | max: 50 | Current grade level |
| `date_of_birth` | string | No | ISO date format (YYYY-MM-DD) | Student's birth date |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": 1,
    "name": "Jane Doe",
    "email": "janedoe@example.com",
    "password": "StudentPass123!",
    "grade": "Grade 10",
    "date_of_birth": "2008-05-15"
  }'
```

**Response (201 Created):**
```json
{
  "dob": null,
  "gender": null,
  "current_grade": null,
  "parent_id": 1,
  "id": 1,
  "user_id": 2,
  "user": {
    "name": "Jane Doe",
    "email": "janedoe@example.com",
    "id": 2,
    "role": "student"
  }
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Student record ID |
| `user_id` | integer | Associated user record ID |
| `parent_id` | integer | Associated parent ID |
| `dob` | string \| null | Date of birth |
| `gender` | string \| null | Gender |
| `current_grade` | string \| null | Current grade |
| `user` | object | Nested user information |
| `user.id` | integer | User ID |
| `user.name` | string | User's full name |
| `user.email` | string | User's email |
| `user.role` | string | User role (always "student") |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Email already exists | `{"detail": "Email already exists"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Missing required field | `{"detail": [{"type": "missing", "loc": ["body", "parent_id"], "msg": "Field required"}]}` |

**Constraints:**
- Parent with `parent_id` must exist
- Email must be unique across all users
- Password must be at least 8 characters
- Grade and date_of_birth are optional

---

### 4. Get Student by ID

**Endpoint:** `GET /api/students/{student_id}`

**Description:** Retrieves student information by student ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student to retrieve |

**Request Example:**
```bash
curl http://localhost:8000/api/students/1
```

**Response (200 OK):**
```json
{
  "dob": null,
  "gender": null,
  "current_grade": null,
  "parent_id": 1,
  "id": 1,
  "user_id": 2,
  "user": {
    "name": "Jane Doe",
    "email": "janedoe@example.com",
    "id": 2,
    "role": "student"
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Student not found | `{"detail": "Student not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "student_id"], "msg": "Input should be a valid integer"}]}` |

---

## Class Management APIs

### 5. Create Class

**Endpoint:** `POST /api/classes`

**Description:** Creates a new class with schedule and capacity information.

**Request Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `name` | string | Yes | min: 1, max: 255 | Class name |
| `subject` | string | No | max: 255 | Subject/topic |
| `day_of_week` | string | No | max: 20 | Day class meets (e.g., "Monday") |
| `time_slot` | string | No | HH:MM-HH:MM or HH:MM format, max: 50 | Time range (e.g., "09:00-10:30") |
| `teacher_name` | string | No | max: 255 | Instructor name |
| `max_students` | integer | No | >= 1 | Maximum enrollment |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Mathematics",
    "subject": "Mathematics",
    "day_of_week": "Monday",
    "time_slot": "14:00-15:30",
    "teacher_name": "Dr. Smith",
    "max_students": 20
  }'
```

**Response (201 Created):**
```json
{
  "name": "Advanced Mathematics",
  "subject": "Mathematics",
  "day_of_week": "Monday",
  "time_slot": "14:00-15:30",
  "teacher_name": "Dr. Smith",
  "max_students": 20,
  "id": 1
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Class ID |
| `name` | string | Class name |
| `subject` | string \| null | Subject/topic |
| `day_of_week` | string \| null | Day of week |
| `time_slot` | string \| null | Time range |
| `teacher_name` | string \| null | Teacher name |
| `max_students` | integer \| null | Maximum capacity |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Invalid time_slot format | `{"detail": "Invalid time_slot format. Use 'HH:MM-HH:MM' (e.g., '09:00-10:30') or 'HH:MM'"}` |
| 400 | Invalid time values | `{"detail": "Invalid time_slot format. Use 'HH:MM-HH:MM' (e.g., '09:00-10:30') or 'HH:MM'"}` |
| 422 | Missing name | `{"detail": [{"type": "missing", "loc": ["body", "name"], "msg": "Field required"}]}` |

**Constraints:**
- `name` is required and cannot be empty
- `time_slot` must be in valid format:
  - Range: "HH:MM-HH:MM" (e.g., "09:00-10:30")
  - Single: "HH:MM" (e.g., "14:00")
  - Hours: 0-23, Minutes: 0-59
- `max_students` must be at least 1 if provided
- All other fields are optional

**Valid time_slot examples:**
- ✅ `"09:00-10:30"` - Range format
- ✅ `"14:00"` - Single time
- ❌ `"25:00-26:30"` - Invalid hours
- ❌ `"09:00-"` - Incomplete range
- ❌ `"9:0"` - Missing leading zeros

---

### 6. Get All Classes

**Endpoint:** `GET /api/classes`

**Description:** Retrieves all classes, optionally filtered by day of week.

**Query Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `day` | string | No | Valid day name (case-insensitive) | Filter by day (e.g., "monday", "Tuesday") |

**Request Examples:**
```bash
# Get all classes
curl http://localhost:8000/api/classes

# Get Monday classes only
curl "http://localhost:8000/api/classes?day=monday"
```

**Response (200 OK):**
```json
[
  {
    "name": "Mathematics Fundamentals",
    "subject": "Mathematics",
    "day_of_week": "Monday",
    "time_slot": "09:00-10:30",
    "teacher_name": "Dr. Peterson",
    "max_students": 15,
    "id": 1
  },
  {
    "name": "English Literature",
    "subject": "English",
    "day_of_week": "Monday",
    "time_slot": "11:00-12:30",
    "teacher_name": "Ms. Anderson",
    "max_students": 12,
    "id": 2
  }
]
```

**Response Parameters:**
Array of class objects, each containing:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Class ID |
| `name` | string | Class name |
| `subject` | string \| null | Subject/topic |
| `day_of_week` | string \| null | Day of week |
| `time_slot` | string \| null | Time range |
| `teacher_name` | string \| null | Teacher name |
| `max_students` | integer \| null | Maximum capacity |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Invalid day parameter | `{"detail": "Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday"}` |

**Constraints:**
- `day` parameter is case-insensitive
- Valid days: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- Database stores days with capitalized first letter (e.g., "Monday")

---

## Class Registration APIs

### 7. Register Student to Class

**Endpoint:** `POST /api/classes/{class_id}/register`

**Description:** Registers a student for a class with comprehensive validation including schedule conflict detection.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class_id` | integer | Yes | ID of the class to register for |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | ID of the student to register |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/classes/1/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1
  }'
```

**Response (201 Created):**
```json
{
  "student_id": 1,
  "class_id": 1,
  "id": 1
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Registration record ID |
| `student_id` | integer | Student ID |
| `class_id` | integer | Class ID |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Class not found | `{"detail": "Class not found"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 400 | Already registered | `{"detail": "Student already registered for this class"}` |
| 400 | Class is full | `{"detail": "Class is full"}` |
| 400 | No active subscription | `{"detail": "Student has no active subscription with available sessions"}` |
| 400 | Schedule conflict | `{"detail": "Schedule conflict: Student already has 'English Literature' on Monday at 09:00-10:30"}` |
| 422 | Missing student_id | `{"detail": [{"type": "missing", "loc": ["body", "student_id"], "msg": "Field required"}]}` |

**Business Rules & Constraints:**

1. **Student Existence:** Student with `student_id` must exist
2. **Class Existence:** Class with `class_id` must exist
3. **Duplicate Prevention:** Student cannot register for the same class twice (database constraint)
4. **Capacity Check:** Current enrollment must be less than `max_students`
5. **Active Subscription:** Student must have an active subscription with available sessions (`total_sessions > used_sessions`)
6. **Schedule Conflict Detection:**
   - Prevents overlapping classes on the same day
   - Algorithm: Parses time_slot format "HH:MM-HH:MM", converts to minutes from midnight
   - Checks overlap: `(start1 < end2) AND (start2 < end1)`
   - Example conflict:
     - Class A: Monday 09:00-10:30 (540-630 minutes)
     - Class B: Monday 10:00-11:30 (600-690 minutes)
     - Overlap: `540 < 690 AND 600 < 630` = TRUE ❌

**Schedule Conflict Examples:**

| Current Class | New Class | Result |
|---------------|-----------|--------|
| Mon 09:00-10:30 | Mon 11:00-12:30 | ✅ Allowed (no overlap) |
| Mon 09:00-10:30 | Mon 10:00-11:30 | ❌ Conflict (overlaps) |
| Mon 09:00-10:30 | Tue 09:00-10:30 | ✅ Allowed (different day) |
| Mon 09:00-10:30 | Mon 10:30-12:00 | ✅ Allowed (adjacent, no overlap) |

---

## Subscription Management APIs

### 8. Create Subscription

**Endpoint:** `POST /api/subscriptions`

**Description:** Creates a new subscription package for a student.

**Request Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `student_id` | integer | Yes | Must exist, > 0 | Student's ID |
| `package_name` | string | Yes | min: 1, max: 255 | Subscription package name |
| `start_date` | string | Yes | ISO date (YYYY-MM-DD) | Subscription start date |
| `end_date` | string | Yes | ISO date, must be after start_date | Subscription end date |
| `total_sessions` | integer | Yes | >= 1 | Total number of sessions |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "package_name": "Premium Monthly Package",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "total_sessions": 48
  }'
```

**Response (201 Created):**
```json
{
  "student_id": 1,
  "package_name": "Premium Monthly Package",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "total_sessions": 48,
  "id": 1,
  "used_sessions": 0,
  "remaining_sessions": 48,
  "is_active": true
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Subscription ID |
| `student_id` | integer | Student ID |
| `package_name` | string | Package name |
| `start_date` | string | Start date (ISO format) |
| `end_date` | string | End date (ISO format) |
| `total_sessions` | integer | Total sessions in package |
| `used_sessions` | integer | Number of sessions used |
| `remaining_sessions` | integer | Remaining sessions (calculated: total - used) |
| `is_active` | boolean | Whether subscription is active |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Student not found | `{"detail": "Student not found"}` |
| 400 | Invalid date range | `{"detail": "end_date must be after start_date"}` |
| 400 | Invalid total_sessions | `{"detail": "total_sessions must be greater than 0"}` |
| 400 | Database error | `{"detail": "Database error: [error details]"}` |
| 422 | Missing required field | `{"detail": [{"type": "missing", "loc": ["body", "package_name"], "msg": "Field required"}]}` |

**Constraints:**
- Student must exist
- `end_date` must be after `start_date`
- `total_sessions` must be at least 1
- `package_name` cannot be empty
- `used_sessions` starts at 0
- `is_active` starts as true
- `remaining_sessions` is calculated automatically

---

### 9. Get Subscription by ID

**Endpoint:** `GET /api/subscriptions/{subscription_id}`

**Description:** Retrieves subscription details by subscription ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | Subscription ID |

**Request Example:**
```bash
curl http://localhost:8000/api/subscriptions/1
```

**Response (200 OK):**
```json
{
  "student_id": 1,
  "package_name": "Premium Monthly Package",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "total_sessions": 48,
  "id": 1,
  "used_sessions": 5,
  "remaining_sessions": 43,
  "is_active": true
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "subscription_id"], "msg": "Input should be a valid integer"}]}` |

---

### 10. Use Subscription Session

**Endpoint:** `PATCH /api/subscriptions/{subscription_id}/use`

**Description:** Marks one or more sessions as used, incrementing the used_sessions counter and updating remaining sessions.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | Subscription ID |

**Request Parameters:**
None required (increments by 1 session by default)

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/subscriptions/1/use \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "student_id": 1,
  "package_name": "Premium Monthly Package",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "total_sessions": 48,
  "id": 1,
  "used_sessions": 6,
  "remaining_sessions": 42,
  "is_active": true
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Subscription ID |
| `student_id` | integer | Student ID |
| `package_name` | string | Package name |
| `start_date` | string | Start date |
| `end_date` | string | End date |
| `total_sessions` | integer | Total sessions |
| `used_sessions` | integer | Updated session count (incremented) |
| `remaining_sessions` | integer | Updated remaining (total - used) |
| `is_active` | boolean | Active status (auto-deactivates if all sessions used) |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |
| 400 | No sessions available | `{"detail": "No available sessions to use"}` |
| 400 | Subscription expired | `{"detail": "Subscription has expired"}` |

**Behavior:**
- Increments `used_sessions` by 1
- Decrements `remaining_sessions` automatically (calculated field)
- Auto-deactivates subscription when `used_sessions >= total_sessions`
- Cannot use sessions if subscription is expired (end_date < today)

---

## Common Error Responses

### HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request, resource created |
| 400 | Bad Request | Validation error, business rule violation |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Request validation failed (Pydantic validation) |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

All error responses follow this structure:

```json
{
  "detail": "Error message or validation details"
}
```

**Simple Error:**
```json
{
  "detail": "Student not found"
}
```

**Validation Error:**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "email"],
      "msg": "Field required",
      "input": {...}
    }
  ]
}
```

### Common Validation Errors

| Error Type | Description | Example |
|------------|-------------|---------|
| `missing` | Required field not provided | `"Field required"` |
| `string_too_short` | String below minimum length | `"String should have at least 8 characters"` |
| `string_too_long` | String exceeds maximum length | `"String should have at most 255 characters"` |
| `string_pattern_mismatch` | String doesn't match pattern | `"String should match pattern"` |
| `int_parsing` | Invalid integer format | `"Input should be a valid integer"` |
| `greater_than_equal` | Number below minimum | `"Input should be greater than or equal to 1"` |

---

## Development Notes

### Docker Commands

**Start Services:**
```bash
docker-compose up -d
```

**Rebuild Backend (Required after code changes):**
```bash
docker-compose up --build -d backend
```

**View Logs:**
```bash
docker-compose logs backend
docker-compose logs -f backend  # Follow logs
```

**Stop Services:**
```bash
docker-compose down
```

**Reset Database:**
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Recreate with fresh data
```

### Important Notes

1. **Code Changes:** Docker copies code at build time. After editing Python files, you **must rebuild** the container:
   ```bash
   docker-compose up --build -d backend
   ```
   Simply restarting will NOT load new code.

2. **Development Mode:** To enable hot-reload, add volume mount in `docker-compose.yml`:
   ```yaml
   services:
     backend:
       volumes:
         - ./backend/app:/app/app
   ```

3. **Database Schema:** The system uses PostgreSQL with Alembic migrations. Relationships are managed through SQLAlchemy ORM.

---

## Complete Workflow Example

This example demonstrates creating a parent, student, subscription, and registering for classes:

```bash
#!/bin/bash
BASE_URL="http://localhost:8000"

# 1. Create Parent
echo "Creating parent..."
PARENT=$(curl -s -X POST "$BASE_URL/api/parents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "parent_'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "phone": "+84901234567"
  }')
PARENT_ID=$(echo "$PARENT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Parent created with ID: $PARENT_ID"

# 2. Create Student
echo "Creating student..."
STUDENT=$(curl -s -X POST "$BASE_URL/api/students" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": '$PARENT_ID',
    "name": "Test Student",
    "email": "student_'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "grade": "Grade 10",
    "date_of_birth": "2008-01-15"
  }')
STUDENT_ID=$(echo "$STUDENT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Student created with ID: $STUDENT_ID"

# 3. Create Subscription
echo "Creating subscription..."
SUBSCRIPTION=$(curl -s -X POST "$BASE_URL/api/subscriptions" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": '$STUDENT_ID',
    "package_name": "Monthly Package",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "total_sessions": 40
  }')
echo "Subscription created"

# 4. Get Monday Classes
echo "Getting Monday classes..."
curl -s "$BASE_URL/api/classes?day=monday"

# 5. Register for Class
echo "Registering for class..."
curl -s -X POST "$BASE_URL/api/classes/1/register" \
  -H "Content-Type: application/json" \
  -d '{"student_id": '$STUDENT_ID'}'

# 6. Use a Session
echo "Using subscription session..."
curl -s -X PATCH "$BASE_URL/api/subscriptions/1/use" \
  -H "Content-Type: application/json"

echo "Workflow complete!"
```

---

## Authentication (Future)

Currently, the API does not require authentication. All endpoints are publicly accessible. In a production environment, you should implement:

- JWT token authentication
- Role-based access control (RBAC)
- API rate limiting
- HTTPS/TLS encryption

---

## Version History

- **v1.0.0** (2025-12-11): Initial API documentation
  - All CRUD operations for Parents, Students, Classes, and Subscriptions
  - Schedule conflict detection
  - Subscription session tracking
  - Comprehensive validation and error handling
