from PIL import Image
import io
from deepface import DeepFace
from db_helper import DynamoDBWrapper
import logging
from flask import Blueprint, request, jsonify, current_app
import time
import base64
import numpy as np

student_registration_bp = Blueprint("student_registration", __name__)
logger = logging.getLogger(__name__)

import boto3
import uuid
import os

# Initialize AWS clients
rek_client = boto3.client('rekognition', region_name='eu-west-1')
s3_client = boto3.client('s3', region_name='eu-west-1')
REK_COLLECTION = 'attendance_students_collection'

def get_s3_bucket():
    try:
        with open('s3_bucket_name.txt', 'r') as f:
            return f.read().strip()
    except:
        # Fallback to env var or default if file missing
        return os.environ.get('S3_BUCKET_NAME', 'attendancesystem-faces-default')

@student_registration_bp.route('/api/register-student', methods=['POST'])
def register_student():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON data"}), 400

    db = current_app.config.get("DB")
    students_col = db.students

    # Check required fields
    required_fields = ['studentName', 'studentId', 'department', 'year', 'division', 'semester', 'email', 'phoneNumber', 'images']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"{field} is required"}), 400

    # Check uniqueness of studentId and email
    if students_col.find_one({'studentId': data['studentId']}):
        return jsonify({"success": False, "error": "Student ID already exists"}), 400
    if students_col.find_one({'email': data['email']}):
        return jsonify({"success": False, "error": "Email already registered"}), 400

    # Validate images
    images = data.get('images')
    if not isinstance(images, list) or len(images) != 5:
        return jsonify({"success": False, "error": "Exactly 5 images are required"}), 400

    bucket_name = get_s3_bucket()
    student_id = data['studentId']
    
    # Process images with AWS
    rekognition_face_ids = []
    
    for idx, img_b64 in enumerate(images):
        try:
            if img_b64.startswith("data:"):
                img_b64 = img_b64.split(",", 1)[1]
            image_bytes = base64.b64decode(img_b64)
            
            # 1. Upload to S3
            s3_key = f"students/{student_id}/face_{idx}_{uuid.uuid4().hex[:6]}.jpg"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=image_bytes,
                ContentType='image/jpeg'
            )
            
            # 2. Index face in Rekognition
            # Note: ExternalImageId must be alphanumeric + punctuation, so we use student_id
            # AWS only indexes the largest face found.
            response = rek_client.index_faces(
                CollectionId=REK_COLLECTION,
                Image={'S3Object': {'Bucket': bucket_name, 'Name': s3_key}},
                ExternalImageId=student_id.replace(" ", "_"),
                DetectionAttributes=['DEFAULT'],
                MaxFaces=1,
                QualityFilter='AUTO'
            )
            
            for faceRecord in response['FaceRecords']:
                rekognition_face_ids.append(faceRecord['Face']['FaceId'])
                
        except Exception as e:
            logger.error(f"AWS Error processing image {idx}: {e}")
            return jsonify({"success": False, "error": f"Cloud processing failed for image {idx+1}: {str(e)}"}), 500

    if not rekognition_face_ids:
        return jsonify({"success": False, "error": "No faces could be recognized by AWS in the provided images."}), 400

    # Save to DynamoDB
    student_data = {
        "studentId": data['studentId'],
        "studentName": data['studentName'],
        "department": data['department'],
        "year": data['year'],
        "division": data['division'],
        "semester": data['semester'],
        "email": data['email'],
        "phoneNumber": data['phoneNumber'],
        "status": "active",
        "rekognition_face_ids": rekognition_face_ids,
        "face_registered": True,
        "created_at": time.time(),
        "updated_at": time.time()
    }

    # Save to Students Collection
    result = students_col.insert_one(student_data)
    
    # ALSO: Automatically create an Auth account for the student
    # Default password is set to their studentId
    try:
        from flask_bcrypt import Bcrypt
        bcrypt = Bcrypt()
        hashed_pw = bcrypt.generate_password_hash(data['studentId']).decode('utf-8')
        
        auth_col = db.auth_users
        # Check if auth account already exists (to avoid duplicates)
        if not auth_col.find_one({'email': data['email']}):
            auth_doc = {
                "username": data['studentName'],
                "email": data['email'],
                "password": hashed_pw,
                "userType": "student",
                "studentId": data['studentId'],
                "status": "active",
                "created_at": time.time()
            }
            auth_col.insert_one(auth_doc)
            logger.info(f"Automatically created auth account for student: {data['email']}")
    except Exception as auth_err:
        logger.error(f"Failed to create auto-auth account: {auth_err}")
        # We don't fail the whole registration if auth creation fails, 
        # but we log it.

    return jsonify({
        "success": True, 
        "studentId": data['studentId'], 
        "record_id": str(result.inserted_id),
        "message": "Student registered successfully. Default password is set to Student ID."
    })

@student_registration_bp.route('/api/students/count', methods=['GET'])
def get_student_count():
    db = current_app.config.get("DB")
    return jsonify({"success": True, "count": db.students.count_documents({})})

@student_registration_bp.route('/api/students/departments', methods=['GET'])
def get_departments():
    db = current_app.config.get("DB")
    departments = db.students.distinct("department")
    return jsonify({"success": True, "departments": departments, "count": len(departments)})
