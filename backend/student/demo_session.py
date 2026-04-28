# student/demo_session.py - OPTIMIZED VERSION
from flask import Blueprint, request, jsonify, current_app
import time
import base64
import boto3
import os
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

demo_session_bp = Blueprint("demo_session", __name__)

REK_REGION = "eu-west-1"
REK_COLLECTION = "attendance_students_collection"

rek_client = boto3.client('rekognition', region_name=REK_REGION)

@demo_session_bp.route("/api/demo/recognize", methods=["POST"])
def demo_recognize_optimized():
    """AWS Rekognition demo face recognition endpoint"""
    start_time = time.time()

    data = request.get_json()
    db = current_app.config.get("DB")
    students_col = db.students

    image_b64 = data.get("image", "")
    if image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        return jsonify({"success": False, "error": "Invalid base64 image"}), 400

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
            results.append({
                "match": None,
                "status": "no_match",
                "message": "Face not recognized in the system"
            })
        else:
            match = face_matches[0]
            student_id = match['Face']['ExternalImageId'].replace("_", " ")
            confidence = match['Similarity']
            
            student_doc = students_col.find_one({"studentId": student_id})
            student_name = student_doc.get("studentName", "Unknown") if student_doc else "Unknown"

            results.append({
                "match": {
                    "user_id": student_id,
                    "name": student_name
                },
                "confidence": round(confidence, 1),
                "distance": 1.0 - (confidence / 100.0) # Mock distance
            })
            
    except rek_client.exceptions.InvalidParameterException:
        pass # No face detected
    except Exception as aws_e:
        logger.error(f"AWS Error: {aws_e}")
        return jsonify({"success": False, "error": "Cloud recognition failed"}), 500

    total_time = time.time() - start_time

    return jsonify({
        "success": True, 
        "faces": results, 
        "processing_time": round(total_time, 3),
        "performance_info": {
            "backend": "AWS Rekognition"
        }
    })

@demo_session_bp.route('/api/demo/session', methods=['POST'])
def create_demo_session():
    """Create a new demo session"""
    db = current_app.config.get("DB")
    demo_sessions_col = db.demo_sessions

    session_data = {
        "session_id": f"demo_{int(time.time())}",
        "started_at": time.time(),
        "status": "active",
        "recognitions": []
    }

    try:
        result = demo_sessions_col.insert_one(session_data)
        session_data['_id'] = str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error creating session: {e}")

    return jsonify({
        "success": True,
        "session": session_data
    })

@demo_session_bp.route('/api/demo/session/<session_id>/log', methods=['POST'])
def log_recognition(session_id):
    """Log recognition result to session"""
    db = current_app.config.get("DB")
    demo_sessions_col = db.demo_sessions

    data = request.get_json()
    recognition_log = {
        "timestamp": time.time(),
        "result": data.get('result'),
        "confidence": data.get('confidence'),
        "processing_time": data.get('processing_time')
    }

    try:
        demo_sessions_col.update_one(
            {"session_id": session_id},
            {"$push": {"recognitions": recognition_log}}
        )
    except Exception as e:
        logger.error(f"Error logging recognition: {e}")

    return jsonify({"success": True, "message": "Recognition logged"})

@demo_session_bp.route('/api/demo/models/status', methods=['GET'])
def model_status():
    """Check AWS Rekognition status"""
    try:
        # Just describe collection to check connection
        rek_client.describe_collection(CollectionId=REK_COLLECTION)
        models_ready = True
    except Exception as e:
        logger.error(f"AWS Rekognition connection failed: {e}")
        models_ready = False

    return jsonify({
        "success": True,
        "models_ready": models_ready,
        "health_check": models_ready,
        "timestamp": time.time()
    })