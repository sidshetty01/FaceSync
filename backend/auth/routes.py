from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
import time

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

@auth_bp.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'proctor')  # Default to proctor for signup

    if user_type == 'student':
        return jsonify({"success": False, "error": "Students cannot sign up themselves. Please contact a Proctor."}), 403

    if not all([username, email, password]):
        return jsonify({"success": False, "error": "All fields required"}), 400

    db = current_app.config.get("DB")
    
    # Choose collection based on user type (only proctor/teacher allowed here)
    if user_type == 'teacher' or user_type == 'proctor':
        auth_col = db.auth_teachers
        # Add additional teacher-specific fields
        employee_id = data.get('employeeId', f"PRC-{int(time.time()) % 1000:03d}")
        department = data.get('department', 'Administration')
    else:
        return jsonify({"success": False, "error": "Invalid user type for registration"}), 400
    
    # Check if email already exists
    if auth_col.find_one({'email': email}):
        return jsonify({
            "success": False, 
            "error": f"Email already registered as {user_type}"
        }), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    # Prepare user document
    user_doc = {
        "username": username,
        "email": email,
        "password": hashed_pw,
        "userType": user_type,
        "status": "active",
        "created_at": time.time(),
        "employeeId": employee_id,
        "department": department,
        "role": "proctor"
    }
    
    auth_col.insert_one(user_doc)

    return jsonify({
        "success": True, 
        "message": f"Proctor registered successfully"
    })

@auth_bp.route('/api/signin', methods=['POST'])
def api_signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"success": False, "error": "Email and password required"}), 400

    db = current_app.config.get("DB")
    
    # Try to find user in auth_teachers first (Proctor)
    user = db.auth_teachers.find_one({'email': email})
    user_type = 'proctor'
    user_role = 'proctor'
    
    if not user:
        # Try to find user in auth_users (Student)
        user = db.auth_users.find_one({'email': email})
        user_type = 'student'
        user_role = 'student'
    
    if not user:
        return jsonify({
            "success": False, 
            "error": "No account found with this email"
        }), 401
    
    # Check password
    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({
            "success": False, 
            "error": "Invalid password"
        }), 401
    
    # Check if account is active
    if user.get('status') == 'inactive':
        return jsonify({
            "success": False, 
            "error": "Account is deactivated. Contact administrator."
        }), 401

    # Prepare response based on detected user type
    user_info = {
        "_id": str(user.get('id') or user.get('email') or user.get('username')),
        "username": user['username'],
        "email": user['email'],
        "userType": user_type,
        "role": user_role
    }
    
    # Add type-specific information
    if user_type == 'proctor':
        user_info.update({
            "employeeId": user.get('employeeId'),
            "department": user.get('department'),
            "name": user['username']
        })
    else:
        # For students, try to get student record
        student_record = db.students.find_one({'email': email})
        if student_record:
            user_info.update({
                "studentId": student_record.get('studentId'),
                "studentName": student_record.get('studentName'),
                "department": student_record.get('department'),
                "hasStudentRecord": True
            })

    return jsonify({
        "success": True, 
        "message": f"Signed in successfully as {user_type}",
        "user": user_info,
        "userType": user_type,
        "role": user_role
    })

@auth_bp.route('/api/logout', methods=['POST'])
def api_logout():
    # You can add logout logic here if needed (e.g., invalidate tokens)
    return jsonify({"success": True, "message": "Logged out successfully"})

# Additional route to check user type and permissions
@auth_bp.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get current user's profile information"""
    user_email = request.headers.get('X-User-Email')
    
    if not user_email:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    db = current_app.config.get("DB")
    
    # Try teachers first
    user = db.auth_teachers.find_one({'email': user_email}, {'password': 0})
    if not user:
        # Then students
        user = db.auth_users.find_one({'email': user_email}, {'password': 0})
    
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    user['_id'] = str(user.get('id') or user.get('email') or user.get('username'))
    
    return jsonify({
        "success": True,
        "user": user
    })

# Route to switch user type (if user has both teacher and student accounts)
@auth_bp.route('/api/switch-role', methods=['POST'])
def switch_user_role():
    """Allow users to switch between teacher and student roles if they have both"""
    data = request.get_json()
    user_email = data.get('email')
    target_type = data.get('targetType')  # 'teacher' or 'student'
    
    if not all([user_email, target_type]):
        return jsonify({"success": False, "error": "Email and target type required"}), 400
    
    db = current_app.config.get("DB")
    
    # Check if user exists in target collection
    if target_type == 'teacher':
        target_col = db.auth_teachers
    else:
        target_col = db.auth_users
    
    target_user = target_col.find_one({'email': user_email})
    
    if not target_user:
        return jsonify({
            "success": False, 
            "error": f"No {target_type} account found for this email"
        }), 404
    
    # Return user info for the target role
    user_info = {
        "_id": str(target_user.get('id') or target_user.get('email') or target_user.get('username')),
        "username": target_user['username'],
        "email": target_user['email'],
        "userType": target_type
    }
    
    if target_type == 'teacher':
        user_info.update({
            "employeeId": target_user.get('employeeId'),
            "department": target_user.get('department')
        })
    
    return jsonify({
        "success": True,
        "message": f"Switched to {target_type} role",
        "user": user_info,
        "userType": target_type
    })
