# Mini LMS Backend API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication & Authorization

### Overview
All API endpoints (except login) require authentication using JWT Bearer tokens. The system implements role-based access control (RBAC) with three user roles:

- **staff**: Full administrative access to all endpoints
- **parent**: Can view their own information and their children's data
- **student**: Can view their own information, classes, and subscriptions

### Authentication Flow

1. **Login**: POST to `/api/auth/login` with email and password
2. **Token**: Receive JWT access token in response
3. **Authorization**: Include token in subsequent requests:
   ```
   Authorization: Bearer <access_token>
   ```

### Token Details
- **Expiration**: 30 minutes
- **Algorithm**: HS256
- **Payload**: Contains `user_id` and `role`

### Role-Based Access Matrix

| Resource | Staff | Parent | Student |
|----------|-------|--------|---------|
| Parents (all) | ✅ Full CRUD | ❌ | ❌ |
| Parents (self) | ✅ | ✅ Own data | ❌ |
| Students (all) | ✅ Full CRUD | ❌ | ❌ |
| Students (self) | ✅ | ❌ | ✅ Own data |
| Students (by ID) | ✅ | ✅ Own children | ✅ Self only |
| Classes | ✅ Full CRUD | ✅ View only | ✅ View only |
| Registrations | ✅ Full | ❌ | ❌ |
| Subscriptions | ✅ Full CRUD | ✅ View children | ✅ View own |

### Error Responses

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 401 | Unauthorized - No token or invalid token | `{"detail": "Could not validate credentials"}` |
| 403 | Forbidden - Valid token but insufficient permissions | `{"detail": "Insufficient permissions"}` |

---

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

**Authentication Required:** No

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
    "email": "staff@minilms.com",
    "password": "password123"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Admin Staff",
    "email": "staff@minilms.com",
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

**Token Usage Example:**
```bash
curl -X GET http://localhost:8000/api/students/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Token Expiration:**
- Tokens expire after 30 minutes
- Upon expiration, clients must re-authenticate to obtain a new token

---

## Parent Management APIs

### 1. Get Current Parent (Dashboard)

**Endpoint:** `GET /api/parents/me`

**Description:** Retrieves the authenticated parent's information including all children.

**Authentication Required:** Yes (Parent role)

**Request Example:**
```bash
curl http://localhost:8000/api/parents/me \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "phone": "+84901234567",
  "id": 1,
  "user_id": 2,
  "user": {
    "name": "John Smith",
    "email": "john.smith@email.com",
    "id": 2,
    "role": "parent"
  },
  "students": [
    {
      "dob": "2010-03-15",
      "gender": "Female",
      "current_grade": "Grade 8",
      "parent_id": 1,
      "id": 1,
      "user_id": 9,
      "user": {
        "name": "Emma Smith",
        "email": "emma.smith@email.com",
        "id": 9,
        "role": "student"
      }
    }
  ]
}
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Parent record ID |
| `user_id` | integer | Associated user record ID |
| `phone` | string \| null | Parent's phone number |
| `user` | object | Nested user information |
| `students` | array | List of children with full details |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not a parent | `{"detail": "Insufficient permissions"}` |
| 404 | Parent profile not found | `{"detail": "Parent not found"}` |

---

### 2. Create Parent

**Endpoint:** `POST /api/parents`

**Description:** Creates a new parent account with associated user credentials.

**Authentication Required:** Yes (Staff role only)

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
  -H "Authorization: Bearer <token>" \
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

### 3. Get All Parents

**Endpoint:** `GET /api/parents`

**Description:** Retrieves a list of all parents with their user information.

**Authentication Required:** Yes (Staff role only)

**Request Example:**
```bash
curl http://localhost:8000/api/parents \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
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
  },
  {
    "phone": "+84987654321",
    "id": 2,
    "user_id": 2,
    "user": {
      "name": "Jane Smith",
      "email": "janesmith@example.com",
      "id": 2,
      "role": "parent"
    }
  }
]
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Array | array | List of parent objects |
| `id` | integer | Parent record ID |
| `user_id` | integer | Associated user record ID |
| `phone` | string \| null | Parent's phone number |
| `user` | object | Nested user information |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |

---

### 4. Get Parent by ID

**Endpoint:** `GET /api/parents/{parent_id}`

**Description:** Retrieves parent information by parent ID, including their children.

**Authentication Required:** Yes (Staff role OR parent accessing own record)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent_id` | integer | Yes | The ID of the parent to retrieve |

**Request Example:**
```bash
curl http://localhost:8000/api/parents/1 \
  -H "Authorization: Bearer <token>"
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
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Parent accessing another's record | `{"detail": "Insufficient permissions"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "parent_id"], "msg": "Input should be a valid integer"}]}` |

---

### 5. Delete Parent

**Endpoint:** `DELETE /api/parents/{parent_id}`

**Description:** Deletes a parent record and their associated user account. This is a cascade delete operation.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent_id` | integer | Yes | The ID of the parent to delete |

**Request Example:**
```bash
curl -X DELETE http://localhost:8000/api/parents/1 \
  -H "Authorization: Bearer <your_token>"
```

**Response (204 No Content):**
No response body on success.

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "parent_id"], "msg": "Input should be a valid integer"}]}` |

---

### 6. Update Parent

**Endpoint:** `PATCH /api/parents/{parent_id}`

**Description:** Updates parent information including name and phone number.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parent_id` | integer | Yes | The ID of the parent to update |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Updated parent name (1-255 characters) |
| `phone` | string | No | Updated phone number (max 50 characters) |

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/parents/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "John Updated Smith",
    "phone": "+84901234999"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "user_id": 2,
  "phone": "+84901234999",
  "user": {
    "id": 2,
    "name": "John Updated Smith",
    "email": "john.smith@email.com",
    "role": "parent"
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Invalid data format | `{"detail": [{"type": "string_too_long", "loc": ["body", "phone"], "msg": "String should have at most 50 characters"}]}` |

---

## Student Management APIs

### 1. Get Current Student (Dashboard)

**Endpoint:** `GET /api/students/me`

**Description:** Retrieves the authenticated student's own information.

**Authentication Required:** Yes (Student role only)

**Request Example:**
```bash
curl http://localhost:8000/api/students/me \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
{
  "id": 5,
  "user_id": 10,
  "parent_id": 1,
  "dob": "2008-05-15",
  "gender": null,
  "current_grade": "Grade 10",
  "user": {
    "id": 10,
    "name": "Emma Smith",
    "email": "emma.smith@email.com",
    "role": "student"
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not student role | `{"detail": "Insufficient permissions"}` |
| 404 | Student record not found | `{"detail": "Student not found"}` |

---

### 2. Get Current Student Classes

**Endpoint:** `GET /api/students/me/classes`

**Description:** Retrieves all classes the authenticated student is enrolled in.

**Authentication Required:** Yes (Student role only)

**Request Example:**
```bash
curl http://localhost:8000/api/students/me/classes \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Mathematics",
    "description": "Advanced Algebra",
    "schedule": "Monday 9:00-10:00",
    "room": "Room 101",
    "capacity": 30,
    "enrolled_count": 25
  },
  {
    "id": 2,
    "name": "English Literature",
    "description": "Classic novels study",
    "schedule": "Wednesday 14:00-15:30",
    "room": "Room 205",
    "capacity": 25,
    "enrolled_count": 20
  }
]
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not student role | `{"detail": "Insufficient permissions"}` |
| 404 | Student record not found | `{"detail": "Student not found"}` |

---

### 3. Get Current Student Subscriptions

**Endpoint:** `GET /api/students/me/subscriptions`

**Description:** Retrieves all subscriptions for the authenticated student.

**Authentication Required:** Yes (Student role only)

**Request Example:**
```bash
curl http://localhost:8000/api/students/me/subscriptions \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "student_id": 5,
    "total_sessions": 10,
    "used_sessions": 3,
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "status": "active"
  },
  {
    "id": 2,
    "student_id": 5,
    "total_sessions": 20,
    "used_sessions": 20,
    "start_date": "2023-09-01",
    "end_date": "2023-12-31",
    "status": "expired"
  }
]
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not student role | `{"detail": "Insufficient permissions"}` |
| 404 | Student record not found | `{"detail": "Student not found"}` |

---

### 4. Create Student

**Endpoint:** `POST /api/students`

**Description:** Creates a new student account associated with a parent.

**Authentication Required:** Yes (Staff role only)

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
  -H "Authorization: Bearer <access_token>" \
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
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` |
| 422 | Missing required field | `{"detail": [{"type": "missing", "loc": ["body", "parent_id"], "msg": "Field required"}]}` |

**Constraints:**
- Parent with `parent_id` must exist
- Email must be unique across all users
- Password must be at least 8 characters
- Grade and date_of_birth are optional

---

### 5. Get All Students

**Endpoint:** `GET /api/students`

**Description:** Retrieves a list of all students with their user and parent information.

**Authentication Required:** Yes (Staff role only)

**Request Example:**
```bash
curl http://localhost:8000/api/students \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "dob": "2010-03-15",
    "gender": "Female",
    "current_grade": "Grade 8",
    "parent_id": 1,
    "id": 1,
    "user_id": 9,
    "user": {
      "name": "Emma Smith",
      "email": "emma.smith@email.com",
      "id": 9,
      "role": "student"
    }
  },
  {
    "dob": "2011-07-22",
    "gender": "Male",
    "current_grade": "Grade 7",
    "parent_id": 1,
    "id": 2,
    "user_id": 10,
    "user": {
      "name": "Oliver Smith",
      "email": "oliver.smith@email.com",
      "id": 10,
      "role": "student"
    }
  }
]
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Array | array | List of student objects |
| `id` | integer | Student record ID |
| `user_id` | integer | Associated user record ID |
| `parent_id` | integer \| null | Associated parent ID |
| `dob` | string \| null | Date of birth (ISO format) |
| `gender` | string \| null | Gender |
| `current_grade` | string \| null | Current grade |
| `user` | object | Nested user information |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |

---

### 6. Get Student by ID

**Endpoint:** `GET /api/students/{student_id}`

**Description:** Retrieves student information by student ID.

**Authentication Required:** Yes (Staff OR parent accessing own child OR student accessing self)

**Authorization Logic:**
- Staff can access any student
- Parents can only access their own children
- Students can only access their own record

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student to retrieve |

**Request Example:**
```bash
curl http://localhost:8000/api/students/1 \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
{
  "dob": "2008-05-15",
  "gender": null,
  "current_grade": "Grade 10",
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
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Parent accessing non-child | `{"detail": "Insufficient permissions"}` |
| 403 | Student accessing other student | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "student_id"], "msg": "Input should be a valid integer"}]}` |

---

### 7. Get Student Classes

**Endpoint:** `GET /api/students/{student_id}/classes`

**Description:** Retrieves all classes a student is registered for.

**Authentication Required:** Yes (Staff OR parent accessing own child OR student accessing self)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student |

**Request Example:**
```bash
curl http://localhost:8000/api/students/1/classes \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Mathematics Fundamentals",
    "subject": "Mathematics",
    "day_of_week": "Monday",
    "time_slot": "09:00-10:30",
    "teacher_name": "Dr. Peterson",
    "max_students": 15
  },
  {
    "id": 6,
    "name": "History & Culture",
    "subject": "History",
    "day_of_week": "Tuesday",
    "time_slot": "11:00-12:30",
    "teacher_name": "Mr. Thompson",
    "max_students": 15
  }
]
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Array | array | List of class objects the student is enrolled in |
| `id` | integer | Class ID |
| `name` | string | Class name |
| `subject` | string \| null | Subject/topic |
| `day_of_week` | string \| null | Day of week |
| `time_slot` | string \| null | Time range (HH:MM-HH:MM) |
| `teacher_name` | string \| null | Teacher's name |
| `max_students` | integer \| null | Maximum enrollment capacity |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Parent accessing non-child | `{"detail": "Insufficient permissions"}` |
| 403 | Student accessing other student | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "student_id"], "msg": "Input should be a valid integer"}]}` |

---

### 8. Get Student Subscriptions

**Endpoint:** `GET /api/students/{student_id}/subscriptions`

**Description:** Retrieves all subscriptions for a specific student.

**Authentication Required:** Yes (Staff OR parent accessing own child OR student accessing self)

**Authorization Logic:**
- Staff can access any student's subscriptions
- Parents can only access their own children's subscriptions
- Students can only access their own subscriptions

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student |

**Request Example:**
```bash
curl http://localhost:8000/api/students/5/subscriptions \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "student_id": 5,
    "total_sessions": 10,
    "used_sessions": 3,
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "status": "active"
  },
  {
    "id": 2,
    "student_id": 5,
    "total_sessions": 20,
    "used_sessions": 20,
    "start_date": "2023-09-01",
    "end_date": "2023-12-31",
    "status": "expired"
  }
]
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Parent accessing non-child | `{"detail": "Insufficient permissions"}` |
| 403 | Student accessing other student | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "student_id"], "msg": "Input should be a valid integer"}]}` |

---

### 9. Delete Student

**Endpoint:** `DELETE /api/students/{student_id}`

**Description:** Deletes a student and their associated user account. Also removes all class registrations and subscriptions.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student to delete |

**Request Example:**
```bash
curl -X DELETE http://localhost:8000/api/students/1 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204 No Content):**
```
(No response body)
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "student_id"], "msg": "Input should be a valid integer"}]}` |

**Important Notes:**
- Deleting a student will cascade delete all associated class registrations
- Deleting a student will cascade delete all associated subscriptions
- The associated user account will also be deleted
- This operation cannot be undone

---

### 10. Update Student

**Endpoint:** `PATCH /api/students/{student_id}`

**Description:** Updates student information including name, date of birth, gender, grade, and parent assignment.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | integer | Yes | The ID of the student to update |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Updated student name (1-255 characters) |
| `dob` | string | No | Updated date of birth (YYYY-MM-DD format) |
| `gender` | string | No | Updated gender (max 20 characters) |
| `current_grade` | string | No | Updated grade level (max 50 characters) |
| `parent_id` | integer | No | Updated parent ID (must exist) |

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/students/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Emma Updated Smith",
    "current_grade": "Grade 11",
    "gender": "Female"
  }'
```

**Response (200 OK):**
```json
{
  "id": 5,
  "user_id": 10,
  "parent_id": 1,
  "dob": "2008-05-15",
  "gender": "Female",
  "current_grade": "Grade 11",
  "user": {
    "id": 10,
    "name": "Emma Updated Smith",
    "email": "emma.smith@email.com",
    "role": "student"
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
| 404 | Parent not found | `{"detail": "Parent not found"}` (if parent_id provided doesn't exist) |
| 422 | Invalid data format | `{"detail": [{"type": "string_too_long", "loc": ["body", "name"], "msg": "String should have at most 255 characters"}]}` |

---

## Class Management APIs

### 1. Get All Classes

**Endpoint:** `GET /api/classes`

**Description:** Retrieves a list of all classes with enrollment information.

**Authentication Required:** Yes (Any authenticated user)

**Request Example:**
```bash
curl http://localhost:8000/api/classes \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Mathematics Fundamentals",
    "subject": "Mathematics",
    "day_of_week": "Monday",
    "time_slot": "09:00-10:30",
    "teacher_name": "Dr. Peterson",
    "max_students": 15,
    "enrolled_count": 8
  },
  {
    "id": 2,
    "name": "English Literature",
    "subject": "English",
    "day_of_week": "Tuesday",
    "time_slot": "11:00-12:30",
    "teacher_name": "Ms. Johnson",
    "max_students": 20,
    "enrolled_count": 15
  }
]
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |

---

### 2. Create Class

**Endpoint:** `POST /api/classes`

**Description:** Creates a new class with schedule and capacity information.

**Authentication Required:** Yes (Staff role only)

**Request Parameters:**

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `name` | string | Yes | min: 1, max: 255 | Class name |
| `subject` | string | No | max: 255 | Subject/topic |
| `day_of_week` | string | No | max: 20 | Day class meets (e.g., "Monday") |
| `time_slot` | string | No | HH:MM-HH:MM format only, max: 50 | Time range (e.g., "09:00-10:30") |
| `teacher_name` | string | No | max: 255 | Instructor name |
| `max_students` | integer | No | >= 1 | Maximum enrollment |

**Request Example:**
```bash
curl -X POST http://localhost:8000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
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
| 400 | Invalid time_slot format | `{"detail": "Invalid time_slot format. Use 'HH:MM-HH:MM' format (e.g., '09:00-10:30')"}` |
| 400 | Invalid time values | `{"detail": "Invalid time values. Use 'HH:MM-HH:MM' format (e.g., '09:00-10:30')"}` |
| 400 | End time before start | `{"detail": "End time must be after start time. Use 'HH:MM-HH:MM' format (e.g., '09:00-10:30')"}` |
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 422 | Missing name | `{"detail": [{"type": "missing", "loc": ["body", "name"], "msg": "Field required"}]}` |

**Constraints:**
- `name` is required and cannot be empty
- `time_slot` must be in valid HH:MM-HH:MM format:
  - Time range: `"HH:MM-HH:MM"` (e.g., `"09:00-10:30"`)
  - End time must be after start time
  - Hours must be 0-23, minutes must be 0-59
- `max_students` must be at least 1 if provided
- All other fields are optional

**Valid time_slot examples:**
- ✅ `"09:00-10:30"` - Valid range (1.5 hours)
- ✅ `"14:00-15:30"` - Valid range (1.5 hours)
- ✅ `"08:00-09:00"` - Valid range (1 hour)
- ❌ `"09:00"` - Missing end time (not allowed)
- ❌ `"10:30-09:00"` - End time before start time
- ❌ `"25:00-26:00"` - Invalid hours
- ❌ `"09:00-"` - Incomplete range

---

### 3. Get Class Registrations

**Endpoint:** `GET /api/classes/{class_id}/registrations`

**Description:** Retrieves all students registered for a specific class.

**Authentication Required:** Yes (Staff role only)

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
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |

**Constraints:**
- `day` parameter is case-insensitive
- Valid days: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- Database stores days with capitalized first letter (e.g., "Monday")

---

## Class Registration APIs

### 3. Get Class Registrations

**Endpoint:** `GET /api/classes/{class_id}/registrations`

**Description:** Retrieves all enrolled students for a specific class with their detailed information.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class_id` | integer | Yes | ID of the class |

**Request Example:**
```bash
curl http://localhost:8000/api/classes/1/registrations \
  -H "Authorization: Bearer <your_token>"
```

**Response (200 OK):**
```json
[
  {
    "student_id": 1,
    "class_id": 1,
    "id": 1,
    "student": {
      "dob": "2010-03-15",
      "gender": "Female",
      "current_grade": "Grade 8",
      "parent_id": 1,
      "id": 1,
      "user_id": 9,
      "user": {
        "name": "Emma Smith",
        "email": "emma.smith@email.com",
        "id": 9,
        "role": "student"
      }
    }
  },
  {
    "student_id": 5,
    "class_id": 1,
    "id": 16,
    "student": {
      "dob": "2010-11-28",
      "gender": "Female",
      "current_grade": "Grade 8",
      "parent_id": 3,
      "id": 5,
      "user_id": 13,
      "user": {
        "name": "Ava Williams",
        "email": "ava.williams@email.com",
        "id": 13,
        "role": "student"
      }
    }
  }
]
```

**Response Parameters:**

Array of registration objects, each containing:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Registration record ID |
| `student_id` | integer | Student ID |
| `class_id` | integer | Class ID |
| `student` | object | Full student details |
| `student.id` | integer | Student record ID |
| `student.user_id` | integer | Associated user ID |
| `student.dob` | string \| null | Date of birth (ISO format) |
| `student.gender` | string \| null | Student gender |
| `student.current_grade` | string \| null | Current grade level |
| `student.parent_id` | integer \| null | Parent ID |
| `student.user` | object | User information |
| `student.user.id` | integer | User ID |
| `student.user.name` | string | Student name |
| `student.user.email` | string | Student email |
| `student.user.role` | string | User role (always "student") |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Class not found | `{"detail": "Class not found"}` |
| 422 | Invalid class_id | `{"detail": [{"type": "int_parsing", "loc": ["path", "class_id"], "msg": "Input should be a valid integer"}]}` |

**Use Cases:**
- Display enrolled students in class management interface
- Show class roster to teachers
- Calculate current enrollment vs. capacity
- Verify student registrations

---

### 4. Register Student to Class

**Endpoint:** `POST /api/classes/{class_id}/register`

**Description:** Registers a student for a class with comprehensive validation including schedule conflict detection.

**Authentication Required:** Yes (Staff role only)

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
  -H "Authorization: Bearer <access_token>" \
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

### 5. Update Class

**Endpoint:** `PATCH /api/classes/{class_id}`

**Description:** Updates class information including name, subject, schedule, teacher, and capacity.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class_id` | integer | Yes | The ID of the class to update |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Updated class name (1-255 characters) |
| `subject` | string | No | Updated subject (max 255 characters) |
| `day_of_week` | string | No | Updated day (max 20 characters) |
| `time_slot` | string | No | Updated time slot (HH:MM-HH:MM format) |
| `teacher_name` | string | No | Updated teacher name (max 255 characters) |
| `max_students` | integer | No | Updated maximum capacity (>= 1) |

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/classes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Advanced Mathematics II",
    "time_slot": "10:00-11:30",
    "max_students": 25
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Advanced Mathematics II",
  "subject": "Mathematics",
  "day_of_week": "Monday",
  "time_slot": "10:00-11:30",
  "teacher_name": "Dr. Smith",
  "max_students": 25
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Invalid time_slot format | `{"detail": "Invalid time_slot format. Use 'HH:MM-HH:MM' format"}` |
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Class not found | `{"detail": "Class not found"}` |
| 422 | Invalid data format | `{"detail": [{"type": "int_parsing", "loc": ["body", "max_students"], "msg": "Input should be a valid integer"}]}` |

---

### 6. Unregister Student from Class

**Endpoint:** `DELETE /api/classes/{class_id}/registrations/{student_id}`

**Description:** Removes a student's registration from a class.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `class_id` | integer | Yes | The ID of the class |
| `student_id` | integer | Yes | The ID of the student to remove |

**Request Example:**
```bash
curl -X DELETE http://localhost:8000/api/classes/1/registrations/5 \
  -H "Authorization: Bearer <access_token>"
```

**Response (204 No Content):**
No response body on success.

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Registration not found | `{"detail": "Registration not found"}` |

---

## Subscription Management APIs

### 1. Get All Subscriptions

**Endpoint:** `GET /api/subscriptions`

**Description:** Retrieves a list of all subscriptions with full student information.

**Authentication Required:** Yes (Staff role only)

**Request Example:**
```bash
curl http://localhost:8000/api/subscriptions \
  -H "Authorization: Bearer <access_token>"
```

**Response (200 OK):**
```json
[
  {
    "student_id": 1,
    "package_name": "Monthly Premium Package",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "total_sessions": 48,
    "id": 1,
    "used_sessions": 5,
    "remaining_sessions": 43,
    "is_active": true,
    "student": {
      "dob": "2010-03-15",
      "gender": "Female",
      "current_grade": "Grade 8",
      "parent_id": 1,
      "id": 1,
      "user_id": 9,
      "user": {
        "name": "Emma Smith",
        "email": "emma.smith@email.com",
        "id": 9,
        "role": "student"
      }
    }
  }
]
```

**Response Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Array | array | List of subscription objects |
| `id` | integer | Subscription ID |
| `student_id` | integer | Student ID |
| `package_name` | string | Package name |
| `start_date` | string | Start date (ISO format) |
| `end_date` | string | End date (ISO format) |
| `total_sessions` | integer | Total sessions |
| `used_sessions` | integer | Sessions used |
| `remaining_sessions` | integer | Remaining sessions |
| `is_active` | boolean | Active status |
| `student` | object | Full student information with user details |

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |

---

### 2. Create Subscription

**Endpoint:** `POST /api/subscriptions`

**Description:** Creates a new subscription package for a student.

**Authentication Required:** Yes (Staff role only)

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
  -H "Authorization: Bearer <access_token>" \
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
| 400 | Invalid date range | `{"detail": "end_date must be after start_date"}` |
| 400 | Invalid total_sessions | `{"detail": "total_sessions must be greater than 0"}` |
| 400 | Database error | `{"detail": "Database error: [error details]"}` |
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Student not found | `{"detail": "Student not found"}` |
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

### 3. Get Subscription by ID

**Endpoint:** `GET /api/subscriptions/{subscription_id}`

**Description:** Retrieves subscription details by subscription ID.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | Subscription ID |

**Request Example:**
```bash
curl http://localhost:8000/api/subscriptions/1 \
  -H "Authorization: Bearer <access_token>"
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
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |
| 422 | Invalid ID format | `{"detail": [{"type": "int_parsing", "loc": ["path", "subscription_id"], "msg": "Input should be a valid integer"}]}` |

---

### 4. Use Subscription Session

**Endpoint:** `PATCH /api/subscriptions/{subscription_id}/use`

**Description:** Marks one or more sessions as used, incrementing the used_sessions counter and updating remaining sessions.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | Subscription ID |

**Request Parameters:**
None required (increments by 1 session by default)

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/subscriptions/1/use \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>"
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
| 400 | No sessions available | `{"detail": "No available sessions to use"}` |
| 400 | Subscription expired | `{"detail": "Subscription has expired"}` |
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |

**Behavior:**
- Increments `used_sessions` by 1
- Decrements `remaining_sessions` automatically (calculated field)
- Auto-deactivates subscription when `used_sessions >= total_sessions`
- Cannot use sessions if subscription is expired (end_date < today)

---

### 12. Delete Subscription

**Endpoint:** `DELETE /api/subscriptions/{subscription_id}`

**Description:** Delete a subscription by its ID.

**Authentication Required:** Yes (Staff only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | The ID of the subscription to delete |

**Request Example:**
```bash
curl -X DELETE http://localhost:8000/api/subscriptions/1 \
  -H "Authorization: Bearer <token>"
```

**Response (204 No Content):**
```
(Empty response body)
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |
| 401 | Not authenticated | `{"detail": "Not authenticated"}` |
| 403 | Not authorized (non-staff) | `{"detail": "Not authorized"}` |

**Notes:**
- Returns 204 No Content on successful deletion
- Deletes the subscription record from the database
- No cascade effects (students are not deleted)

---

### 13. Update Subscription

**Endpoint:** `PATCH /api/subscriptions/{subscription_id}`

**Description:** Updates subscription information including package name, dates, and session counts.

**Authentication Required:** Yes (Staff role only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription_id` | integer | Yes | The ID of the subscription to update |

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `package_name` | string | No | Updated package name (1-255 characters) |
| `start_date` | string | No | Updated start date (YYYY-MM-DD format) |
| `end_date` | string | No | Updated end date (YYYY-MM-DD format) |
| `total_sessions` | integer | No | Updated total sessions (>= 1) |
| `used_sessions` | integer | No | Updated used sessions (>= 0) |

**Request Example:**
```bash
curl -X PATCH http://localhost:8000/api/subscriptions/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "package_name": "Premium Plus Package",
    "total_sessions": 60,
    "end_date": "2025-12-31"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "student_id": 5,
  "package_name": "Premium Plus Package",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "total_sessions": 60,
  "used_sessions": 5,
  "remaining_sessions": 55,
  "is_active": true,
  "student": {
    "id": 5,
    "user_id": 10,
    "parent_id": 1,
    "dob": "2008-05-15",
    "gender": null,
    "current_grade": "Grade 10",
    "user": {
      "id": 10,
      "name": "Emma Smith",
      "email": "emma.smith@email.com",
      "role": "student"
    }
  }
}
```

**Error Responses:**

| Status Code | Condition | Response Example |
|-------------|-----------|------------------|
| 400 | Invalid date range | `{"detail": "end_date must be after start_date"}` |
| 401 | Not authenticated | `{"detail": "Could not validate credentials"}` |
| 403 | Not staff role | `{"detail": "Insufficient permissions"}` |
| 404 | Subscription not found | `{"detail": "Subscription not found"}` |
| 422 | Invalid data format | `{"detail": [{"type": "int_parsing", "loc": ["body", "total_sessions"], "msg": "Input should be a valid integer"}]}` |

---

## Common Error Responses

### HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request, resource created |
| 204 | No Content | Successful DELETE request, no response body |
| 400 | Bad Request | Validation error, business rule violation |
| 401 | Unauthorized | Authentication required or credentials invalid |
| 403 | Forbidden | Insufficient permissions for this operation |
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

**Authentication Error (401):**
```json
{
  "detail": "Could not validate credentials"
}
```

**Authorization Error (403):**
```json
{
  "detail": "Insufficient permissions"
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

This example demonstrates the full workflow with authentication:

```bash
#!/bin/bash
BASE_URL="http://localhost:8000"

# 1. Login as Staff to get access token
echo "Logging in as staff..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@minilms.com",
    "password": "password123"
  }')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Logged in with token: ${TOKEN:0:20}..."

# 2. Create Parent
echo "Creating parent..."
PARENT=$(curl -s -X POST "$BASE_URL/api/parents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Parent",
    "email": "parent_'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "phone": "+84901234567"
  }')
PARENT_ID=$(echo "$PARENT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Parent created with ID: $PARENT_ID"

# 3. Create Student
echo "Creating student..."
STUDENT=$(curl -s -X POST "$BASE_URL/api/students" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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

# 4. Create Subscription
echo "Creating subscription..."
SUBSCRIPTION=$(curl -s -X POST "$BASE_URL/api/subscriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "student_id": '$STUDENT_ID',
    "package_name": "Monthly Package",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "total_sessions": 40
  }')
SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Subscription created with ID: $SUBSCRIPTION_ID"

# 5. Get Monday Classes (any authenticated user can view)
echo "Getting Monday classes..."
curl -s "$BASE_URL/api/classes?day=monday" \
  -H "Authorization: Bearer $TOKEN"

# 6. Register Student for Class (staff only)
echo "Registering for class..."
curl -s -X POST "$BASE_URL/api/classes/1/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"student_id": '$STUDENT_ID'}'

# 7. Use a Subscription Session (staff only)
echo "Using subscription session..."
curl -s -X PATCH "$BASE_URL/api/subscriptions/$SUBSCRIPTION_ID/use" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

# 8. View Student's Classes
echo "Viewing student's enrolled classes..."
curl -s "$BASE_URL/api/students/$STUDENT_ID/classes" \
  -H "Authorization: Bearer $TOKEN"

echo "Workflow complete!"
```

**Role-Based Access Examples:**

```bash
# Student viewing own data
STUDENT_LOGIN=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "emma.smith@email.com", "password": "password123"}')
STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Student can view own information
curl "$BASE_URL/api/students/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Student can view own classes
curl "$BASE_URL/api/students/me/classes" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Student can view own subscriptions
curl "$BASE_URL/api/students/me/subscriptions" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Parent viewing children's data
PARENT_LOGIN=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@email.com", "password": "password123"}')
PARENT_TOKEN=$(echo "$PARENT_LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Parent can view own information with children
curl "$BASE_URL/api/parents/me" \
  -H "Authorization: Bearer $PARENT_TOKEN"

# Parent can view child's classes (if child belongs to parent)
curl "$BASE_URL/api/students/5/classes" \
  -H "Authorization: Bearer $PARENT_TOKEN"
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
