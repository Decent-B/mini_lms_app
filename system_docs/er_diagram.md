# Database ER Diagram (Markdown)

## Entities and Attributes

### **Users**
- id (PK)
- name
- email (unique)
- password_hash
- role ("staff", "parent", "student")

### **Parents**
- id (PK)
- user_id (FK → Users.id)
- phone

### **Students**
- id (PK)
- user_id (FK → Users.id)
- dob
- gender
- current_grade
- parent_id (FK → Parents.id)

### **Classes**
- id (PK)
- name
- subject
- day_of_week
- time_slot
- teacher_name
- max_students

### **ClassRegistrations**
- id (PK)
- student_id (FK → Students.id)
- class_id (FK → Classes.id)
- UNIQUE(student_id, class_id)

### **Subscriptions**
- id (PK)
- student_id (FK → Students.id)
- package_name
- start_date
- end_date
- total_sessions
- used_sessions

---

## Notes
- All system users authenticate via **Users** table.
- `role` determines capabilities:
  - staff → manage data
  - parent → view child’s subscriptions + schedule
  - student → view own subscriptions + schedule
- Parent–Student is a one-to-many relationship.
- Student–Class is many-to-many via `ClassRegistrations`.
- Subscription belongs to a single student.

