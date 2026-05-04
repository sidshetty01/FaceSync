# teacher/attendance_records.py - MULTI-FACE DYNAMODB COMPATIBLE
import io
import base64
import numpy as np
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from PIL import Image
import logging
import time
import boto3

logger = logging.getLogger(__name__)

# Attendance Blueprint with URL prefix
attendance_session_bp = Blueprint(
    "attendance_session",
    __name__,
    url_prefix="/api/attendance"
)

rek_client = boto3.client('rekognition', region_name='eu-west-1')
REK_COLLECTION = 'attendance_students_collection'

@attendance_session_bp.route("/create_session", methods=["POST"])
def create_session():
    """Create a new attendance session"""
    data = request.json
    db = current_app.config.get("DB")
    students_col = db.students
    records_col = db.attendance_records

    # Build base session document
    session_doc = {
        "date": data.get("date"),
        "subject": data.get("subject"),
        "department": data.get("department"),
        "year": data.get("year"),
        "division": data.get("division"),
        "created_at": time.time(),
        "finalized": False,
        "ended_at": None,
        "students": []
    }

    # Prepopulate session with all students in that class
    try:
        # Build filter query for DynamoDB
        query = {}
        if data.get("department"): query["department"] = data.get("department")
        if data.get("year"): query["year"] = data.get("year")
        if data.get("division"): query["division"] = data.get("division")

        all_students = students_col.find(query)
        count = 0
        for s in all_students:
            sid = s.get("studentId") or s.get("student_id")
            name = s.get("studentName") or s.get("student_name")
            session_doc["students"].append({
                "student_id": sid,
                "student_name": name,
                "present": False,
                "marked_at": None
            })
            count += 1
        
        logger.info(f"Created session with {count} students preloaded")
        
    except Exception as e:
        logger.error(f"Error preloading students: {e}")

    result = records_col.insert_one(session_doc)
    return jsonify({"session_id": str(result.inserted_id), "students_count": len(session_doc["students"])})

@attendance_session_bp.route("/real-mark", methods=["POST"])
def mark_attendance():
    """Attendance marking using AWS Rekognition with Multi-Face Support"""
    data = request.get_json()
    session_id = data.get("session_id")
    image_b64 = data.get("image")

    if not session_id or not image_b64:
        return jsonify({"error": "Missing session_id or image"}), 400

    db = current_app.config.get("DB")
    records_col = db.attendance_records

    try:
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_b64)
        
        # 1. Detect all faces in the image
        detect_response = rek_client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['DEFAULT']
        )
        
        face_details = detect_response.get('FaceDetails', [])
        if not face_details:
            return jsonify({"success": True, "faces": [], "message": "No faces detected"})

        # Load image for cropping
        original_image = Image.open(io.BytesIO(image_bytes))
        width, height = original_image.size

        # Validate session
        session_doc = records_col.find_one({"record_id": session_id})
        if not session_doc:
            return jsonify({"error": "Session not found"}), 404
        
        recognized_results = []
        doc_changed = False

        for face in face_details:
            # Crop the face
            box = face['BoundingBox']
            left = width * box['Left']
            top = height * box['Top']
            right = left + (width * box['Width'])
            bottom = top + (height * box['Height'])
            
            # Add some padding
            padding_w = (right - left) * 0.2
            padding_h = (bottom - top) * 0.2
            crop_left = max(0, left - padding_w)
            crop_top = max(0, top - padding_h)
            crop_right = min(width, right + padding_w)
            crop_bottom = min(height, bottom + padding_h)

            face_crop = original_image.crop((crop_left, crop_top, crop_right, crop_bottom))
            
            # Convert crop to bytes
            crop_io = io.BytesIO()
            face_crop.save(crop_io, format='JPEG')
            crop_bytes = crop_io.getvalue()

            # 2. Search for THIS face
            try:
                search_response = rek_client.search_faces_by_image(
                    CollectionId=REK_COLLECTION,
                    Image={'Bytes': crop_bytes},
                    MaxFaces=1,
                    FaceMatchThreshold=80.0
                )
                
                face_matches = search_response.get('FaceMatches', [])
                if face_matches:
                    match = face_matches[0]
                    student_id = match['Face']['ExternalImageId'].replace("_", " ")
                    confidence = match['Similarity']
                    
                    # Find student name and update record
                    found_in_session = False
                    student_name = "Unknown"

                    for student in session_doc.get("students", []):
                        if student.get("student_id") == student_id:
                            found_in_session = True
                            student_name = student.get("student_name")
                            if not student.get("present"):
                                student["present"] = True
                                student["marked_at"] = time.time()
                                doc_changed = True
                                status = "marked_present"
                            else:
                                status = "duplicate"
                            break
                    
                    if not found_in_session:
                        # Student not in preloaded list, check database
                        student_doc = db.students.find_one({"studentId": student_id})
                        if student_doc:
                            student_name = student_doc.get("studentName", "Unknown")
                            session_doc["students"].append({
                                "student_id": student_id,
                                "student_name": student_name,
                                "present": True,
                                "marked_at": time.time()
                            })
                            doc_changed = True
                            status = "marked_present_new"
                        else:
                            status = "no_match"
                    
                    recognized_results.append({
                        "match": {"user_id": student_id, "name": student_name},
                        "confidence": round(confidence, 1),
                        "status": status,
                        "box": box
                    })
                else:
                    recognized_results.append({
                        "status": "no_match",
                        "box": box
                    })
            except Exception as e:
                logger.error(f"Error searching cropped face: {e}")

        # 3. Save session back to DynamoDB if any changes were made
        if doc_changed:
            records_col.table.put_item(Item=records_col._to_decimal(session_doc))

        return jsonify({
            "success": True,
            "faces": recognized_results
        })

    except Exception as e:
        logger.error(f"Error in multi-face marking: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@attendance_session_bp.route("/list_sessions", methods=["GET"])
def list_sessions():
    """List all attendance sessions with summary statistics"""
    try:
        db = current_app.config.get("DB")
        records_col = db.attendance_records
        
        # Fetch all records
        all_records = records_col.find()
        
        sessions_summary = []
        for r in all_records:
            present_count = sum(1 for s in r.get('students', []) if s.get('present'))
            sessions_summary.append({
                "record_id": r.get("record_id"),
                "date": r.get("date"),
                "subject": r.get("subject"),
                "department": r.get("department"),
                "year": r.get("year"),
                "division": r.get("division"),
                "present_count": present_count,
                "total_students": len(r.get("students", [])),
                "created_at": r.get("created_at")
            })
        
        # Sort by date (latest first)
        sessions_summary.sort(key=lambda x: str(x.get('date', '')), reverse=True)
            
        return jsonify({"success": True, "sessions": sessions_summary})
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@attendance_session_bp.route("/auto-mark", methods=["POST"])
def auto_mark():
    """Automated multi-face marking (for Kiosk)"""
    return mark_attendance()
