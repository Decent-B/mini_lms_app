# Use Case Specification

## Actors
- **Staff**: Manages parents, students, classes, registrations, and subscriptions.
- **Parent**: Views subscription and class schedules of their children.
- **Student**: Views their own subscription status and class schedule.
- **Auth System**: Handles login and role-based access.

## Use Cases

### 1. User Login
**Actors:** Staff, Parent, Student
- Authenticate using email + password.
- System assigns role-based permissions.

---

### 2. Manage Parents (Staff)
#### UC: Create Parent
- Staff submits parent information.
- System stores new parent record.

#### UC: View Parent Details
- Staff selects a parent.
- System returns parent data and associated students.

---

### 3. Manage Students (Staff)
#### UC: Create Student
- Staff creates a student and links them to a parent.

#### UC: View Student
- Staff views student data including parent details.

---

### 4. Manage Classes (Staff)
#### UC: Create Class
- Staff enters class info (subject, day, time, teacher, capacity).

#### UC: View Classes
- Staff filters classes by weekday.

---

### 5. Class Registration (Staff)
#### UC: Register Student to Class
- Staff chooses a student and class.
- System checks schedule conflict.
- If valid, registration is stored.

---

### 6. Manage Subscriptions (Staff)
#### UC: Create Subscription
- Staff defines package, duration, total sessions.

#### UC: Use One Session
- Staff marks one session used.

#### UC: View Subscription Status
- Staff reviews total vs. used sessions.

---

### 7. Parent Portal
#### UC: View Child Subscriptions
- Parent logs in.
- System displays subscription list for all linked students.

#### UC: View Child Class Schedule
- Parent views timetable of each child.

---

### 8. Student Portal
#### UC: View Own Subscriptions
- Student logs in.
- System displays student's subscription status.

#### UC: View Own Class Schedule
- Student sees all registered classes.

---

## Notes
- All use cases require authentication.
- Permission rules enforced based on role.

