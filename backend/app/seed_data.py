"""
Database seeding script for Mini LMS.

Seeds the database with realistic test data:
- 7 parents (3 with 2 children, 4 with 1 child) = 10 students total
- 20 classes distributed across weekdays
- Multiple subscriptions per student
- Random class registrations respecting constraints

This file contains manual entries for each record to ensure data quality.
"""

from datetime import date, timedelta
import os
from sqlalchemy.orm import Session # pyright: ignore[reportUnusedImport]

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.parent import Parent
from app.models.student import Student
from app.models.class_model import ClassModel
from app.models.class_registration import ClassRegistration
from app.models.subscription import Subscription


def seed_database():
    """Seed the database with test data."""
    
    # Get environment from environment variable
    environment = os.getenv('ENVIRONMENT', 'development').lower()
    
    # In development mode, drop all tables and recreate from scratch
    if environment == 'development':
        print("🔄 Development mode - resetting database...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped")
        Base.metadata.create_all(bind=engine)
        print("✓ Tables recreated")
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        user_count = db.query(User).count()
        if user_count > 0:
            print(f"✓ Database already contains {user_count} users. Skipping seed...")
            return
        
        # Seed database with test data
        print("🌱 Seeding database with test data...")
        
        # Default password for all test accounts
        default_password = get_password_hash("password123")
        
        # ===== STAFF USER =====
        print("  → Creating staff user...")
        staff_user = User(
            name="Admin Staff",
            email="staff@minilms.com",
            password_hash=default_password,
            role=UserRole.STAFF
        )
        db.add(staff_user)
        db.flush()
        
        # ===== PARENTS (7 total) =====
        print("  → Creating 7 parents...")
        
        parents_data = [
            {"name": "John Smith", "email": "john.smith@email.com", "phone": "555-0101"},
            {"name": "Mary Johnson", "email": "mary.johnson@email.com", "phone": "555-0102"},
            {"name": "David Williams", "email": "david.williams@email.com", "phone": "555-0103"},
            {"name": "Sarah Brown", "email": "sarah.brown@email.com", "phone": "555-0104"},
            {"name": "Michael Davis", "email": "michael.davis@email.com", "phone": "555-0105"},
            {"name": "Emily Wilson", "email": "emily.wilson@email.com", "phone": "555-0106"},
            {"name": "James Martinez", "email": "james.martinez@email.com", "phone": "555-0107"},
        ]
        
        parents = []
        for parent_data in parents_data:
            user = User(
                name=parent_data["name"],
                email=parent_data["email"],
                password_hash=default_password,
                role=UserRole.PARENT
            )
            db.add(user)
            db.flush()
            
            parent = Parent(
                user_id=user.id,
                phone=parent_data["phone"]
            )
            db.add(parent)
            db.flush()
            parents.append(parent)
        
        # ===== STUDENTS (10 total) =====
        print("  → Creating 10 students...")
        
        # 3 parents with 2 children each, 4 parents with 1 child each
        students_data = [
            # Parent 0 - 2 children
            {"name": "Emma Smith", "email": "emma.smith@email.com", "dob": date(2010, 3, 15), "gender": "Female", "grade": "Grade 8", "parent_idx": 0},
            {"name": "Oliver Smith", "email": "oliver.smith@email.com", "dob": date(2012, 7, 22), "gender": "Male", "grade": "Grade 6", "parent_idx": 0},
            
            # Parent 1 - 2 children
            {"name": "Sophia Johnson", "email": "sophia.johnson@email.com", "dob": date(2011, 5, 10), "gender": "Female", "grade": "Grade 7", "parent_idx": 1},
            {"name": "Liam Johnson", "email": "liam.johnson@email.com", "dob": date(2013, 9, 3), "gender": "Male", "grade": "Grade 5", "parent_idx": 1},
            
            # Parent 2 - 2 children
            {"name": "Ava Williams", "email": "ava.williams@email.com", "dob": date(2010, 11, 28), "gender": "Female", "grade": "Grade 8", "parent_idx": 2},
            {"name": "Noah Williams", "email": "noah.williams@email.com", "dob": date(2012, 2, 14), "gender": "Male", "grade": "Grade 6", "parent_idx": 2},
            
            # Parent 3 - 1 child
            {"name": "Isabella Brown", "email": "isabella.brown@email.com", "dob": date(2011, 8, 7), "gender": "Female", "grade": "Grade 7", "parent_idx": 3},
            
            # Parent 4 - 1 child
            {"name": "Ethan Davis", "email": "ethan.davis@email.com", "dob": date(2013, 4, 19), "gender": "Male", "grade": "Grade 5", "parent_idx": 4},
            
            # Parent 5 - 1 child
            {"name": "Mia Wilson", "email": "mia.wilson@email.com", "dob": date(2010, 6, 25), "gender": "Female", "grade": "Grade 8", "parent_idx": 5},
            
            # Parent 6 - 1 child
            {"name": "Lucas Martinez", "email": "lucas.martinez@email.com", "dob": date(2012, 12, 1), "gender": "Male", "grade": "Grade 6", "parent_idx": 6},
        ]
        
        students = []
        for student_data in students_data:
            user = User(
                name=student_data["name"],
                email=student_data["email"],
                password_hash=default_password,
                role=UserRole.STUDENT
            )
            db.add(user)
            db.flush()
            
            student = Student(
                user_id=user.id,
                dob=student_data["dob"],
                gender=student_data["gender"],
                current_grade=student_data["grade"],
                parent_id=parents[student_data["parent_idx"]].id # pyright: ignore[reportCallIssue, reportArgumentType]
            )
            db.add(student)
            db.flush()
            students.append(student)
        
        # ===== CLASSES (20 total, distributed across weekdays) =====
        print("  → Creating 20 classes across the week...")
        
        weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] # pyright: ignore[reportUnusedVariable]
        classes_data = [
            # Monday (4 classes)
            {"name": "Mathematics Fundamentals", "subject": "Mathematics", "day": "Monday", "time": "09:00-10:30", "teacher": "Dr. Peterson", "max_students": 15},
            {"name": "English Literature", "subject": "English", "day": "Monday", "time": "11:00-12:30", "teacher": "Ms. Anderson", "max_students": 12},
            {"name": "Science Lab", "subject": "Science", "day": "Monday", "time": "14:00-15:30", "teacher": "Prof. Chen", "max_students": 10},
            {"name": "Art & Creativity", "subject": "Art", "day": "Monday", "time": "16:00-17:30", "teacher": "Ms. Garcia", "max_students": 15},
            
            # Tuesday (4 classes)
            {"name": "Advanced Mathematics", "subject": "Mathematics", "day": "Tuesday", "time": "09:00-10:30", "teacher": "Dr. Peterson", "max_students": 12},
            {"name": "History & Culture", "subject": "History", "day": "Tuesday", "time": "11:00-12:30", "teacher": "Mr. Thompson", "max_students": 15},
            {"name": "Computer Programming", "subject": "Computer Science", "day": "Tuesday", "time": "14:00-15:30", "teacher": "Dr. Lee", "max_students": 10},
            {"name": "Music Theory", "subject": "Music", "day": "Tuesday", "time": "16:00-17:30", "teacher": "Ms. Rodriguez", "max_students": 12},
            
            # Wednesday (4 classes)
            {"name": "Physics Exploration", "subject": "Physics", "day": "Wednesday", "time": "09:00-10:30", "teacher": "Prof. Chen", "max_students": 12},
            {"name": "Creative Writing", "subject": "English", "day": "Wednesday", "time": "11:00-12:30", "teacher": "Ms. Anderson", "max_students": 15},
            {"name": "Geography & Maps", "subject": "Geography", "day": "Wednesday", "time": "14:00-15:30", "teacher": "Mr. Thompson", "max_students": 15},
            {"name": "Physical Education", "subject": "PE", "day": "Wednesday", "time": "16:00-17:30", "teacher": "Coach Miller", "max_students": 20},
            
            # Thursday (4 classes)
            {"name": "Chemistry Basics", "subject": "Chemistry", "day": "Thursday", "time": "09:00-10:30", "teacher": "Prof. Chen", "max_students": 10},
            {"name": "Spanish Language", "subject": "Spanish", "day": "Thursday", "time": "11:00-12:30", "teacher": "Ms. Rodriguez", "max_students": 15},
            {"name": "Web Development", "subject": "Computer Science", "day": "Thursday", "time": "14:00-15:30", "teacher": "Dr. Lee", "max_students": 12},
            {"name": "Drama & Theater", "subject": "Drama", "day": "Thursday", "time": "16:00-17:30", "teacher": "Ms. Garcia", "max_students": 15},
            
            # Friday (4 classes)
            {"name": "Biology & Nature", "subject": "Biology", "day": "Friday", "time": "09:00-10:30", "teacher": "Prof. Chen", "max_students": 12},
            {"name": "Economics Basics", "subject": "Economics", "day": "Friday", "time": "11:00-12:30", "teacher": "Mr. Thompson", "max_students": 15},
            {"name": "Robotics Club", "subject": "Computer Science", "day": "Friday", "time": "14:00-15:30", "teacher": "Dr. Lee", "max_students": 10},
            {"name": "Photography", "subject": "Art", "day": "Friday", "time": "16:00-17:30", "teacher": "Ms. Garcia", "max_students": 12},
        ]
        
        classes = []
        for class_data in classes_data:
            class_obj = ClassModel(
                name=class_data["name"],
                subject=class_data["subject"],
                day_of_week=class_data["day"],
                time_slot=class_data["time"],
                teacher_name=class_data["teacher"],
                max_students=class_data["max_students"]
            )
            db.add(class_obj)
            db.flush()
            classes.append(class_obj)
        
        # ===== SUBSCRIPTIONS (students with 2-3 subscriptions each) =====
        print("  → Creating subscriptions...")
        
        today = date.today()
        subscriptions_data = [
            # Student 0 - Emma Smith (3 subscriptions)
            {"student_idx": 0, "package": "Monthly Premium", "start": today - timedelta(days=30), "end": today + timedelta(days=30), "total": 20, "used": 8},
            {"student_idx": 0, "package": "Summer Intensive", "start": today - timedelta(days=60), "end": today - timedelta(days=30), "total": 15, "used": 15},
            {"student_idx": 0, "package": "Weekend Workshop", "start": today, "end": today + timedelta(days=60), "total": 10, "used": 2},
            
            # Student 1 - Oliver Smith (2 subscriptions)
            {"student_idx": 1, "package": "Basic Package", "start": today - timedelta(days=20), "end": today + timedelta(days=40), "total": 12, "used": 5},
            {"student_idx": 1, "package": "Math Booster", "start": today, "end": today + timedelta(days=90), "total": 24, "used": 0},
            
            # Student 2 - Sophia Johnson (3 subscriptions)
            {"student_idx": 2, "package": "Annual Plan", "start": today - timedelta(days=90), "end": today + timedelta(days=275), "total": 50, "used": 15},
            {"student_idx": 2, "package": "Science Lab Access", "start": today - timedelta(days=45), "end": today + timedelta(days=45), "total": 20, "used": 10},
            {"student_idx": 2, "package": "Art Classes", "start": today, "end": today + timedelta(days=60), "total": 12, "used": 1},
            
            # Student 3 - Liam Johnson (2 subscriptions)
            {"student_idx": 3, "package": "Monthly Standard", "start": today - timedelta(days=15), "end": today + timedelta(days=45), "total": 16, "used": 6},
            {"student_idx": 3, "package": "Sports Program", "start": today, "end": today + timedelta(days=120), "total": 30, "used": 0},
            
            # Student 4 - Ava Williams (3 subscriptions)
            {"student_idx": 4, "package": "Premium Annual", "start": today - timedelta(days=180), "end": today + timedelta(days=185), "total": 60, "used": 30},
            {"student_idx": 4, "package": "Language Course", "start": today - timedelta(days=30), "end": today + timedelta(days=60), "total": 18, "used": 9},
            {"student_idx": 4, "package": "Music Lessons", "start": today, "end": today + timedelta(days=90), "total": 24, "used": 0},
            
            # Student 5 - Noah Williams (2 subscriptions)
            {"student_idx": 5, "package": "Monthly Basic", "start": today - timedelta(days=25), "end": today + timedelta(days=35), "total": 14, "used": 7},
            {"student_idx": 5, "package": "Coding Bootcamp", "start": today - timedelta(days=10), "end": today + timedelta(days=80), "total": 20, "used": 3},
            
            # Student 6 - Isabella Brown (3 subscriptions)
            {"student_idx": 6, "package": "Quarterly Plan", "start": today - timedelta(days=45), "end": today + timedelta(days=45), "total": 30, "used": 15},
            {"student_idx": 6, "package": "Drama Workshop", "start": today, "end": today + timedelta(days=60), "total": 12, "used": 0},
            {"student_idx": 6, "package": "Writing Course", "start": today - timedelta(days=20), "end": today + timedelta(days=70), "total": 18, "used": 4},
            
            # Student 7 - Ethan Davis (2 subscriptions)
            {"student_idx": 7, "package": "Basic Monthly", "start": today - timedelta(days=10), "end": today + timedelta(days=50), "total": 12, "used": 3},
            {"student_idx": 7, "package": "PE & Sports", "start": today, "end": today + timedelta(days=90), "total": 24, "used": 0},
            
            # Student 8 - Mia Wilson (3 subscriptions)
            {"student_idx": 8, "package": "Premium Package", "start": today - timedelta(days=60), "end": today + timedelta(days=60), "total": 40, "used": 20},
            {"student_idx": 8, "package": "Photography Class", "start": today - timedelta(days=15), "end": today + timedelta(days=75), "total": 16, "used": 4},
            {"student_idx": 8, "package": "Leadership Program", "start": today, "end": today + timedelta(days=120), "total": 30, "used": 0},
            
            # Student 9 - Lucas Martinez (2 subscriptions)
            {"student_idx": 9, "package": "Standard Plan", "start": today - timedelta(days=30), "end": today + timedelta(days=30), "total": 16, "used": 8},
            {"student_idx": 9, "package": "Robotics Course", "start": today, "end": today + timedelta(days=90), "total": 24, "used": 0},
        ]
        
        for sub_data in subscriptions_data:
            subscription = Subscription(
                student_id=students[sub_data["student_idx"]].id, # pyright: ignore[reportCallIssue, reportArgumentType]
                package_name=sub_data["package"],
                start_date=sub_data["start"],
                end_date=sub_data["end"],
                total_sessions=sub_data["total"],
                used_sessions=sub_data["used"]
            )
            db.add(subscription)
        
        db.flush()
        
        # ===== CLASS REGISTRATIONS (Random but respecting constraints) =====
        print("  → Creating class registrations...")
        
        # Manual registration entries ensuring no schedule conflicts
        registrations_data = [
            # Emma Smith (Student 0) - 4 classes on different days/times
            {"student_idx": 0, "class_idx": 0},  # Monday 09:00
            {"student_idx": 0, "class_idx": 5},  # Tuesday 11:00
            {"student_idx": 0, "class_idx": 9},  # Wednesday 11:00
            {"student_idx": 0, "class_idx": 14}, # Thursday 14:00
            
            # Oliver Smith (Student 1) - 3 classes
            {"student_idx": 1, "class_idx": 1},  # Monday 11:00
            {"student_idx": 1, "class_idx": 6},  # Tuesday 14:00
            {"student_idx": 1, "class_idx": 16}, # Friday 09:00
            
            # Sophia Johnson (Student 2) - 5 classes
            {"student_idx": 2, "class_idx": 2},  # Monday 14:00
            {"student_idx": 2, "class_idx": 4},  # Tuesday 09:00
            {"student_idx": 2, "class_idx": 8},  # Wednesday 09:00
            {"student_idx": 2, "class_idx": 12}, # Thursday 09:00
            {"student_idx": 2, "class_idx": 17}, # Friday 11:00
            
            # Liam Johnson (Student 3) - 3 classes
            {"student_idx": 3, "class_idx": 3},  # Monday 16:00
            {"student_idx": 3, "class_idx": 11}, # Wednesday 16:00
            {"student_idx": 3, "class_idx": 19}, # Friday 16:00
            
            # Ava Williams (Student 4) - 5 classes
            {"student_idx": 4, "class_idx": 0},  # Monday 09:00
            {"student_idx": 4, "class_idx": 7},  # Tuesday 16:00
            {"student_idx": 4, "class_idx": 10}, # Wednesday 14:00
            {"student_idx": 4, "class_idx": 13}, # Thursday 11:00
            {"student_idx": 4, "class_idx": 18}, # Friday 14:00
            
            # Noah Williams (Student 5) - 4 classes
            {"student_idx": 5, "class_idx": 1},  # Monday 11:00
            {"student_idx": 5, "class_idx": 6},  # Tuesday 14:00
            {"student_idx": 5, "class_idx": 9},  # Wednesday 11:00
            {"student_idx": 5, "class_idx": 15}, # Thursday 16:00
            
            # Isabella Brown (Student 6) - 4 classes
            {"student_idx": 6, "class_idx": 2},  # Monday 14:00
            {"student_idx": 6, "class_idx": 5},  # Tuesday 11:00
            {"student_idx": 6, "class_idx": 12}, # Thursday 09:00
            {"student_idx": 6, "class_idx": 16}, # Friday 09:00
            
            # Ethan Davis (Student 7) - 3 classes
            {"student_idx": 7, "class_idx": 3},  # Monday 16:00
            {"student_idx": 7, "class_idx": 11}, # Wednesday 16:00
            {"student_idx": 7, "class_idx": 15}, # Thursday 16:00
            
            # Mia Wilson (Student 8) - 5 classes
            {"student_idx": 8, "class_idx": 4},  # Tuesday 09:00
            {"student_idx": 8, "class_idx": 8},  # Wednesday 09:00
            {"student_idx": 8, "class_idx": 10}, # Wednesday 14:00
            {"student_idx": 8, "class_idx": 14}, # Thursday 14:00
            {"student_idx": 8, "class_idx": 19}, # Friday 16:00
            
            # Lucas Martinez (Student 9) - 4 classes
            {"student_idx": 9, "class_idx": 0},  # Monday 09:00
            {"student_idx": 9, "class_idx": 7},  # Tuesday 16:00
            {"student_idx": 9, "class_idx": 13}, # Thursday 11:00
            {"student_idx": 9, "class_idx": 17}, # Friday 11:00
        ]
        
        for reg_data in registrations_data:
            registration = ClassRegistration(
                student_id=students[reg_data["student_idx"]].id,
                class_id=classes[reg_data["class_idx"]].id
            )
            db.add(registration)
        
        db.commit()
        
        print("✅ Database seeded successfully!")
        print("\n📊 Seed Data Summary:")
        print(f"  • 1 Staff user")
        print(f"  • 7 Parents")
        print(f"  • 10 Students (3 parents with 2 children, 4 with 1 child)")
        print(f"  • 20 Classes (4 per weekday)")
        print(f"  • {len(subscriptions_data)} Subscriptions")
        print(f"  • {len(registrations_data)} Class Registrations")
        print("\n🔑 Test Credentials:")
        print("  Staff: staff@minilms.com / password123")
        print("  Parent: john.smith@email.com / password123")
        print("  Student: emma.smith@email.com / password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
