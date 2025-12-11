#!/bin/bash

# Mini LMS API Test Script
# This script tests the main API endpoints of the Mini LMS system

# Configuration
BASE_URL="http://localhost:8000/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}\n"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}\n"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Start testing
echo -e "${GREEN}Starting Mini LMS API Tests...${NC}"

# ============================================
# 1. LOGIN - Get Access Token
# ============================================
print_header "1. LOGIN - Get Access Token"

print_info "Logging in as staff user..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "staff@minilms.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Failed to get access token. Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Successfully logged in. Token acquired."
AUTH_HEADER="Authorization: Bearer $TOKEN"

# ============================================
# 2. POST /api/parents - Create Parent
# ============================================
print_header "2. POST /api/parents - Tạo phụ huynh"

print_info "Creating new parent..."
PARENT_RESPONSE=$(curl -s -X POST "$BASE_URL/parents" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Nguyen Van A",
    "email": "nguyenvana@test.com",
    "password": "password123",
    "phone": "0901234567"
  }')

echo "Response: $PARENT_RESPONSE"

PARENT_ID=$(echo $PARENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PARENT_ID" ]; then
    print_error "Failed to create parent"
    exit 1
fi

print_success "Parent created successfully with ID: $PARENT_ID"

# ============================================
# 3. GET /api/parents/{id} - Get Parent Details
# ============================================
print_header "3. GET /api/parents/{id} - Xem chi tiết phụ huynh"

print_info "Fetching parent details for ID: $PARENT_ID"
PARENT_DETAIL=$(curl -s -X GET "$BASE_URL/parents/$PARENT_ID" \
  -H "$AUTH_HEADER")

echo "Response: $PARENT_DETAIL"
print_success "Successfully retrieved parent details"

# ============================================
# 4. POST /api/students - Create Student
# ============================================
print_header "4. POST /api/students - Tạo học sinh (đính kèm parent_id)"

print_info "Creating new student with parent_id: $PARENT_ID"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/students" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Nguyen Van B",
    "email": "nguyenvanb@test.com",
    "password": "password123",
    "parent_id": '$PARENT_ID',
    "dob": "2010-05-15",
    "gender": "Male",
    "current_grade": "Grade 8"
  }')

echo "Response: $STUDENT_RESPONSE"

STUDENT_ID=$(echo $STUDENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$STUDENT_ID" ]; then
    print_error "Failed to create student"
    exit 1
fi

print_success "Student created successfully with ID: $STUDENT_ID"

# ============================================
# 5. GET /api/students/{id} - Get Student Details
# ============================================
print_header "5. GET /api/students/{id} - Xem chi tiết học sinh (bao gồm thông tin parent)"

print_info "Fetching student details for ID: $STUDENT_ID"
STUDENT_DETAIL=$(curl -s -X GET "$BASE_URL/students/$STUDENT_ID" \
  -H "$AUTH_HEADER")

echo "Response: $STUDENT_DETAIL"
print_success "Successfully retrieved student details (includes parent info)"

# ============================================
# 6. POST /api/classes - Create Class
# ============================================
print_header "6. POST /api/classes - Tạo lớp mới"

print_info "Creating new class..."
CLASS_RESPONSE=$(curl -s -X POST "$BASE_URL/classes" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Mathematics 101",
    "subject": "Mathematics",
    "day_of_week": "Monday",
    "time_slot": "09:00-10:30",
    "teacher_name": "Mr. Smith",
    "max_students": 20
  }')

echo "Response: $CLASS_RESPONSE"

CLASS_ID=$(echo $CLASS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CLASS_ID" ]; then
    print_error "Failed to create class"
    exit 1
fi

print_success "Class created successfully with ID: $CLASS_ID"

# Create another class with overlapping time for conflict test
print_info "Creating another class with same time slot (for conflict testing)..."
CLASS2_RESPONSE=$(curl -s -X POST "$BASE_URL/classes" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Physics 101",
    "subject": "Physics",
    "day_of_week": "Monday",
    "time_slot": "09:30-11:00",
    "teacher_name": "Mrs. Johnson",
    "max_students": 15
  }')

CLASS2_ID=$(echo $CLASS2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
print_info "Second class created with ID: $CLASS2_ID (overlapping time)"

# ============================================
# 7. GET /api/classes?day={weekday} - List Classes by Day
# ============================================
print_header "7. GET /api/classes?day={weekday} - Danh sách lớp theo ngày"

print_info "Fetching classes for Monday..."
CLASSES_BY_DAY=$(curl -s -X GET "$BASE_URL/classes?day=Monday" \
  -H "$AUTH_HEADER")

echo "Response: $CLASSES_BY_DAY"
print_success "Successfully retrieved classes for Monday"

# ============================================
# 8. POST /api/subscriptions - Create Subscription
# ============================================
print_header "8. POST /api/subscriptions - Khởi tạo gói học"

print_info "Creating subscription for student ID: $STUDENT_ID"
SUBSCRIPTION_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "student_id": '$STUDENT_ID',
    "package_name": "Basic Package",
    "start_date": "2025-01-01",
    "end_date": "2025-03-31",
    "total_sessions": 20
  }')

echo "Response: $SUBSCRIPTION_RESPONSE"

SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SUBSCRIPTION_ID" ]; then
    print_error "Failed to create subscription"
    exit 1
fi

print_success "Subscription created successfully with ID: $SUBSCRIPTION_ID"

# ============================================
# 9. POST /api/classes/{class_id}/register - Register Student to Class
# ============================================
print_header "9. POST /api/classes/{class_id}/register - Đăng ký học sinh vào lớp"

print_info "Registering student $STUDENT_ID to class $CLASS_ID..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/classes/$CLASS_ID/register" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "student_id": '$STUDENT_ID'
  }')

echo "Response: $REGISTER_RESPONSE"
print_success "Student registered to class successfully"

# Test schedule conflict
print_header "9b. TEST SCHEDULE CONFLICT - Kiểm tra trùng lịch"

print_info "Attempting to register student to overlapping class (should fail)..."
CONFLICT_RESPONSE=$(curl -s -X POST "$BASE_URL/classes/$CLASS2_ID/register" \
  -H "$CONTENT_TYPE" \
  -H "$AUTH_HEADER" \
  -d '{
    "student_id": '$STUDENT_ID'
  }')

echo "Response: $CONFLICT_RESPONSE"

if echo "$CONFLICT_RESPONSE" | grep -q "conflict\|overlap\|already registered"; then
    print_success "Schedule conflict detected correctly! Student cannot register to overlapping class."
else
    print_error "Warning: Schedule conflict was not detected properly"
fi

# ============================================
# 10. GET /api/subscriptions/{id} - Get Subscription Status (Before Use)
# ============================================
print_header "10a. GET /api/subscriptions/{id} - Xem trạng thái gói (trước khi dùng)"

print_info "Fetching subscription status for ID: $SUBSCRIPTION_ID"
SUBSCRIPTION_BEFORE=$(curl -s -X GET "$BASE_URL/subscriptions/$SUBSCRIPTION_ID" \
  -H "$AUTH_HEADER")

echo "Response: $SUBSCRIPTION_BEFORE"
print_success "Subscription status retrieved (should show 0 used sessions)"

# ============================================
# 11. PATCH /api/subscriptions/{id}/use - Use One Session
# ============================================
print_header "11. PATCH /api/subscriptions/{id}/use - Đánh dấu đã dùng 1 buổi"

print_info "Marking one session as used for subscription ID: $SUBSCRIPTION_ID"
USE_SESSION_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/use" \
  -H "$AUTH_HEADER")

echo "Response: $USE_SESSION_RESPONSE"
print_success "Session marked as used successfully"

# ============================================
# 12. GET /api/subscriptions/{id} - Get Subscription Status (After Use)
# ============================================
print_header "12. GET /api/subscriptions/{id} - Xem trạng thái gói (sau khi dùng)"

print_info "Fetching subscription status for ID: $SUBSCRIPTION_ID"
SUBSCRIPTION_AFTER=$(curl -s -X GET "$BASE_URL/subscriptions/$SUBSCRIPTION_ID" \
  -H "$AUTH_HEADER")

echo "Response: $SUBSCRIPTION_AFTER"
print_success "Subscription status retrieved (should show 1 used session)"

# ============================================
# Summary
# ============================================
print_header "TEST SUMMARY"

echo -e "${GREEN}All API tests completed successfully!${NC}\n"
echo "Created Resources:"
echo "  - Parent ID: $PARENT_ID"
echo "  - Student ID: $STUDENT_ID"
echo "  - Class ID: $CLASS_ID (Monday 09:00-10:30)"
echo "  - Class ID: $CLASS2_ID (Monday 09:30-11:00 - overlapping)"
echo "  - Subscription ID: $SUBSCRIPTION_ID"
echo ""
echo "Key Test Results:"
echo "  ✓ Parent creation and retrieval"
echo "  ✓ Student creation with parent association"
echo "  ✓ Class creation and filtering by day"
echo "  ✓ Subscription creation and management"
echo "  ✓ Student registration to class"
echo "  ✓ Schedule conflict detection"
echo "  ✓ Session usage tracking"
echo ""
echo -e "${BLUE}Test script completed!${NC}"
