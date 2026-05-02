from flask import Blueprint, jsonify, current_app
import logging

logger = logging.getLogger(__name__)

student_management_bp = Blueprint('student_management', __name__, url_prefix='/api/teacher')

@student_management_bp.route('/students', methods=['GET'])
def list_students():
    """List all registered students"""
    try:
        db = current_app.config.get("DB")
        students_col = db.students
        
        # In db_helper.py, find() currently ignores query and returns all items
        students = students_col.find()
        
        # Clean up data for frontend (remove sensitive or unnecessary fields)
        cleaned_students = []
        for s in students:
            cleaned_students.append({
                "name": s.get("studentName") or s.get("student_name") or s.get("name"),
                "email": s.get("email"),
                "studentId": s.get("studentId") or s.get("student_id"),
                "department": s.get("department"),
                "year": s.get("year"),
                "division": s.get("division")
            })
            
        return jsonify({"success": True, "students": cleaned_students})
    except Exception as e:
        logger.error(f"Error listing students: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@student_management_bp.route('/student-attendance/<email>', methods=['GET'])
def get_student_attendance(email):
    """Get aggregated attendance for a specific student across all subjects"""
    try:
        db = current_app.config.get("DB")
        records_col = db.attendance_records
        
        # Find student ID by email first
        student_doc = db.students.find_one({"email": email})
        if not student_doc:
            return jsonify({"success": False, "error": "Student not found"}), 404
        
        student_id = student_doc.get("studentId") or student_doc.get("student_id")
        
        # Fetch all attendance records
        all_records = records_col.find()
        
        subject_stats = {} # {subject: {present: X, total: Y}}
        
        for record in all_records:
            subject = record.get('subject')
            if not subject: continue
            
            if subject not in subject_stats:
                subject_stats[subject] = {"present": 0, "total": 0}
            
            subject_stats[subject]["total"] += 1
            
            # Check if student was present in this record
            student_entry = next((s for s in record.get('students', []) if s.get('student_id') == student_id), None)
            if student_entry and student_entry.get('present'):
                subject_stats[subject]["present"] += 1
        
        return jsonify({
            "success": True, 
            "attendance": subject_stats,
            "email": email
        })
    except Exception as e:
        logger.error(f"Error fetching attendance for {email}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
