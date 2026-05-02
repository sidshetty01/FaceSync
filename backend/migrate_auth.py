import boto3
from flask_bcrypt import Bcrypt
import time
from decimal import Decimal

# Configuration matches db_helper.py
REGION = 'eu-north-1'
STUDENTS_TABLE = 'Attendance_Students'
AUTH_USERS_TABLE = 'Attendance_Users'

def migrate():
    print("Starting authentication migration for existing students...")
    
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    students_table = dynamodb.Table(STUDENTS_TABLE)
    auth_users_table = dynamodb.Table(AUTH_USERS_TABLE)
    
    bcrypt = Bcrypt()
    
    # 1. Scan all students
    try:
        response = students_table.scan()
        students = response.get('Items', [])
    except Exception as e:
        print(f"Error scanning students table: {e}")
        return

    count = 0
    skipped = 0
    errors = 0

    for student in students:
        email = student.get('email')
        student_id = student.get('studentId') or student.get('student_id')
        name = student.get('studentName') or student.get('student_name')
        
        if not email:
            print(f"Skipping student without email: {student.get('studentId', 'Unknown ID')}")
            skipped += 1
            continue
            
        if not student_id:
            print(f"Skipping student without ID: {email}")
            skipped += 1
            continue

        try:
            # 2. Reset password to studentId for EVERYONE to ensure consistency
            hashed_pw = bcrypt.generate_password_hash(student_id).decode('utf-8')
            
            auth_doc = {
                "username": name or "Student",
                "email": email,
                "password": hashed_pw,
                "userType": "student",
                "studentId": student_id,
                "status": "active",
                "created_at": Decimal(str(time.time()))
            }
            
            auth_users_table.put_item(Item=auth_doc)
            print(f"SUCCESS: Set password for {name} ({email}) to {student_id}")
            count += 1
        except Exception as e:
            print(f"ERROR: Failed to process {email}: {e}")
            errors += 1

    print("\n--- Migration Summary ---")
    print(f"New Accounts Created: {count}")
    print(f"Existing/Skipped:     {skipped}")
    print(f"Errors Encountered:   {errors}")
    print("-------------------------\n")

if __name__ == "__main__":
    migrate()
