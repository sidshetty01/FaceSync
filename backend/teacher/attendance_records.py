# teacher/attendance_records.py - OPTIMIZED VERSION

import io
import base64
import numpy as np
from flask import Blueprint, request, jsonify, current_app
# Removed bson import for DynamoDB compatibility
from datetime import datetime
from PIL import Image
from scipy.spatial.distance import cosine
from deepface import DeepFace
import logging
import time
from timetable import get_current_subject
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)

# Attendance Blueprint with URL prefix
attendance_session_bp = Blueprint(
    "attendance_session",
    __name__,
    url_prefix="/api/attendance"
)

# ----------------- OPTIMIZED Helper Functions ----------------- #

def read_image_from_base64_optimized(image_b64: str, target_size=(640, 480)):
    """Convert base64 image to RGB numpy array with optimization"""
    if image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]
    
    image_bytes = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Resize large images to reduce processing time
    if img.width > target_size[0] or img.height > target_size[1]:
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    return np.array(img)

import boto3
import logging

rek_client = boto3.client('rekognition', region_name='eu-west-1')
REK_COLLECTION = 'attendance_students_collection'

def get_attendance_collection():
    """Get the attendance collection from app config"""
    return current_app.config.get("ATTENDANCE_COLLECTION")

# ----------------- OPTIMIZED Routes ----------------- #

@attendance_session_bp.route("/create_session", methods=["POST"])
def create_session():
    """Create a new attendance session"""
    data = request.json
    db = current_app.config.get("DB")
    students_col = db.students

    # Build base session document
    session_doc = {
        "date": data.get("date"),
        "subject": data.get("subject"),
        "department": data.get("department"),
        "year": data.get("year"),
        "division": data.get("division"),
        "created_at": datetime.now(),
        "finalized": False,
        "ended_at": None,
        "students": []
    }

    # Prepopulate session with all students in that class
    student_filter = {}
    if data.get("department"): student_filter["department"] = data.get("department")
    if data.get("year"): student_filter["year"] = data.get("year")
    if data.get("division"): student_filter["division"] = data.get("division")

    try:
        students = list(students_col.find(student_filter)) if student_filter else []
        for s in students:
            sid = s.get("studentId") or s.get("student_id")
            name = s.get("studentName") or s.get("student_name")
            session_doc["students"].append({
                "student_id": sid,
                "student_name": name,
                "present": False,
                "marked_at": None
            })
        
        logger.info(f"Created session with {len(students)} students preloaded")
        
    except Exception as e:
        logger.error(f"Error preloading students: {e}")
        # Continue with empty students list

    collection = get_attendance_collection()
    session_id = collection.insert_one(session_doc).inserted_id
    return jsonify({"session_id": str(session_id), "students_count": len(session_doc["students"])})

@attendance_session_bp.route("/end_session", methods=["POST"])
def end_session():
    """Finalize an attendance session with enhanced logging"""
    data = request.get_json()
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    try:
        collection = get_attendance_collection()
        db = current_app.config.get("DB")
        students_col = db.students

        session_doc = collection.find_one({"_id": ObjectId(session_id)})
        if not session_doc:
            return jsonify({"error": "Session not found"}), 404

        # Build set of present student ids
        present_students = set(
            s.get("student_id") for s in session_doc.get("students", []) 
            if s.get("present")
        )

        # Get all students in that class
        student_filter = {}
        if session_doc.get("department"): student_filter["department"] = session_doc.get("department")
        if session_doc.get("year"): student_filter["year"] = session_doc.get("year")
        if session_doc.get("division"): student_filter["division"] = session_doc.get("division")

        all_students = list(students_col.find(student_filter)) if student_filter else []
        
        # Mark absent students
        absent_count = 0
        for s in all_students:
            sid = s.get("studentId") or s.get("student_id")
            sname = s.get("studentName") or s.get("student_name")
            
            if sid not in present_students:
                # Update existing entry or create new absent entry
                updated = collection.update_one(
                    {"_id": ObjectId(session_id), "students.student_id": sid},
                    {"$set": {"students.$.present": False, "students.$.marked_at": None}}
                )
                
                if updated.matched_count == 0:
                    # No existing entry, add new absent entry
                    collection.update_one(
                        {"_id": ObjectId(session_id)},
                        {"$push": {
                            "students": {
                                "student_id": sid, 
                                "student_name": sname, 
                                "present": False, 
                                "marked_at": None
                            }
                        }}
                    )
                absent_count += 1

        # Mark session as finalized
        collection.update_one(
            {"_id": ObjectId(session_id)}, 
            {"$set": {"finalized": True, "ended_at": datetime.now()}}
        )

        logger.info(f"Session finalized: {len(present_students)} present, {absent_count} absent")

        return jsonify({
            "success": True,
            "statistics": {
                "present_count": len(present_students),
                "absent_count": absent_count,
                "total_students": len(all_students)
            }
        })

    except Exception as e:
        logger.error(f"Error ending session: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@attendance_session_bp.route("/real-mark", methods=["POST"])
def mark_attendance_with_duplicate_prevention():
    """Attendance marking using AWS Rekognition"""
    start_time = time.time()
    
    data = request.get_json()
    session_id = data.get("session_id")
    image_b64 = data.get("image")

    if not session_id or not image_b64:
        return jsonify({"error": "Missing session_id or image"}), 400

    try:
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_b64)

        # Validate session
        collection = get_attendance_collection()
        session_doc = collection.find_one({"_id": ObjectId(session_id)})
        if not session_doc:
            return jsonify({"error": "Session not found"}), 404
        if session_doc.get("finalized"):
            return jsonify({"error": "Session already finalized"}), 400

        already_present_students = set(
            s.get("student_id") for s in session_doc.get("students", []) 
            if s.get("present")
        )

        results = []
        
        # Call AWS Rekognition to search face
        try:
            response = rek_client.search_faces_by_image(
                CollectionId=REK_COLLECTION,
                Image={'Bytes': image_bytes},
                MaxFaces=1,
                FaceMatchThreshold=80.0
            )
            
            face_matches = response.get('FaceMatches', [])
            
            if not face_matches:
                results.append({
                    "status": "no_match",
                    "message": "Face not recognized in the system"
                })
            else:
                match = face_matches[0]
                student_id = match['Face']['ExternalImageId'].replace("_", " ")
                confidence = match['Similarity']
                
                # We need student name from DB
                db = current_app.config.get("DB")
                student_doc = db.students.find_one({"studentId": student_id})
                student_name = student_doc.get("studentName", "Unknown") if student_doc else "Unknown"

                if student_id in already_present_students:
                    results.append({
                        "match": {"user_id": student_id, "name": student_name},
                        "confidence": round(confidence, 1),
                        "status": "duplicate",
                        "message": f"{student_name} is already marked present"
                    })
                else:
                    updated = collection.update_one(
                        {"_id": ObjectId(session_id), "students.student_id": student_id, "students.present": False},
                        {"$set": {"students.$.present": True, "students.$.marked_at": datetime.now()}}
                    )

                    if updated.matched_count > 0 and updated.modified_count > 0:
                        already_present_students.add(student_id)
                        results.append({
                            "match": {"user_id": student_id, "name": student_name},
                            "confidence": round(confidence, 1),
                            "status": "marked_present",
                            "message": f"{student_name} marked present successfully"
                        })
                    else:
                        collection.update_one(
                            {"_id": ObjectId(session_id)},
                            {"$push": {
                                "students": {
                                    "student_id": student_id,
                                    "student_name": student_name,
                                    "present": True,
                                    "marked_at": datetime.now()
                                }
                            }}
                        )
                        already_present_students.add(student_id)
                        results.append({
                            "match": {"user_id": student_id, "name": student_name},
                            "confidence": round(confidence, 1),
                            "status": "marked_present_new",
                            "message": f"{student_name} added to session and marked present"
                        })
        except rek_client.exceptions.InvalidParameterException:
            results.append({"status": "error", "message": "No face detected in image"})
        except Exception as aws_e:
            logger.error(f"AWS Rekognition Error: {aws_e}")
            results.append({"status": "error", "message": "Cloud recognition failed"})

        processing_time = time.time() - start_time
        
        return jsonify({
            "message": "Recognition processed", 
            "faces": results, 
            "processing_time": round(processing_time, 3),
            "session_info": {
                "session_id": session_id,
                "total_present_now": len(already_present_students),
                "faces_detected": 1 if face_matches else 0,
                "duplicates_prevented": sum(1 for r in results if r.get("status") == "duplicate")
            }
        })

    except Exception as e:
        logger.error(f"Attendance error: {e}")
        return jsonify({"error": str(e)}), 500


# Health check for attendance models
@attendance_session_bp.route("/models/status", methods=["GET"])
def attendance_model_status():
    """Check model status for attendance system"""
    model_manager = current_app.config.get("MODEL_MANAGER")
    
    if not model_manager:
        return jsonify({
            "success": False,
            "error": "Model manager not available"
        }), 500
    
    return jsonify({
        "success": True,
        "models_ready": model_manager.is_ready(),
        "health_check": model_manager.health_check(),
        "cache_info": {
            "embedding_cache_active": True,
            "cache_duration": "10 minutes"
        },
        "timestamp": time.time()
    })

@attendance_session_bp.route("/auto-mark", methods=["POST"])
def auto_mark_attendance():
    """Automated attendance marking using timetable Kiosk mode"""
    start_time = time.time()
    
    # 1. Determine current subject from timetable
    current_subject = get_current_subject()
    if not current_subject:
        return jsonify({"message": "No class currently scheduled", "faces": []})
        
    model_manager = current_app.config.get("MODEL_MANAGER")
    if not model_manager or not model_manager.is_ready():
        return jsonify({"error": "Face recognition models not initialized"}), 503
        
    data = request.get_json()
    image_b64 = data.get("image")
    if not image_b64:
        return jsonify({"error": "Missing image"}), 400
        
    try:
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_b64)

        collection = get_attendance_collection()
        db = current_app.config.get("DB")
        students_col = db.students
        
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # 3. Get or Create Session for current subject
        session_filter = {
            "date": date_str,
            "subject": current_subject,
            "department": "AI & DS",
            "year": "3" # VI Semester
        }
        
        session_doc = collection.find_one(session_filter)
        
        if not session_doc:
            session_doc = {
                "date": date_str,
                "subject": current_subject,
                "department": "AI & DS",
                "year": "3",
                "division": "A",
                "created_at": datetime.now(),
                "finalized": False,
                "ended_at": None,
                "students": []
            }
            
            class_students = list(students_col.find({
                "department": "AI & DS",
                "year": "3"
            }))
            
            for s in class_students:
                sid = s.get("studentId") or s.get("student_id")
                name = s.get("studentName") or s.get("student_name")
                session_doc["students"].append({
                    "student_id": sid,
                    "student_name": name,
                    "present": False,
                    "marked_at": None
                })
                
            session_id = str(collection.insert_one(session_doc).inserted_id)
            session_doc["_id"] = ObjectId(session_id)
        else:
            session_id = str(session_doc["_id"])
            if session_doc.get("finalized"):
                return jsonify({"error": "Current session already finalized", "subject": current_subject}), 400

        already_present_students = set(
            s.get("student_id") for s in session_doc.get("students", []) if s.get("present")
        )
        
        results = []
        
        try:
            response = rek_client.search_faces_by_image(
                CollectionId=REK_COLLECTION,
                Image={'Bytes': image_bytes},
                MaxFaces=1,
                FaceMatchThreshold=80.0
            )
            
            face_matches = response.get('FaceMatches', [])
            
            if not face_matches:
                results.append({"status": "no_match", "message": "Face not recognized"})
            else:
                match = face_matches[0]
                student_id = match['Face']['ExternalImageId'].replace("_", " ")
                
                student_doc = students_col.find_one({"studentId": student_id})
                student_name = student_doc.get("studentName", "Unknown") if student_doc else "Unknown"

                if student_id in already_present_students:
                    results.append({
                        "match": {"user_id": student_id, "name": student_name},
                        "status": "duplicate",
                        "message": f"{student_name} already present"
                    })
                else:
                    updated = collection.update_one(
                        {"_id": ObjectId(session_id), "students.student_id": student_id, "students.present": False},
                        {"$set": {"students.$.present": True, "students.$.marked_at": datetime.now()}}
                    )

                    if updated.matched_count > 0 and updated.modified_count > 0:
                        already_present_students.add(student_id)
                        results.append({
                            "match": {"user_id": student_id, "name": student_name},
                            "status": "marked_present",
                            "message": f"Marked {student_name} present for {current_subject}"
                        })
                    else:
                        collection.update_one(
                            {"_id": ObjectId(session_id)},
                            {"$push": {"students": {
                                "student_id": student_id,
                                "student_name": student_name,
                                "present": True,
                                "marked_at": datetime.now()
                            }}}
                        )
                        already_present_students.add(student_id)
                        results.append({
                            "match": {"user_id": student_id, "name": student_name},
                            "status": "marked_present_new",
                            "message": f"Added {student_name} to {current_subject}"
                        })
        except rek_client.exceptions.InvalidParameterException:
            results.append({"status": "error", "message": "No face detected in image"})
        except Exception as aws_e:
            logger.error(f"AWS Error: {aws_e}")
            results.append({"status": "error", "message": "Cloud recognition failed"})

        return jsonify({
            "message": "Auto-recognition processed",
            "subject": current_subject,
            "session_id": session_id,
            "faces": results,
            "processing_time": round(time.time() - start_time, 3)
        })

    except Exception as e:
        logger.error(f"Auto-mark error: {e}")
        return jsonify({"error": str(e)}), 500
