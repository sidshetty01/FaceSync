# app.py - OPTIMIZED VERSION
import os
import time
import logging
import threading
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
import numpy as np
from db_helper import DynamoDBWrapper

# Blueprint imports
from auth.routes import auth_bp

from student.registration import student_registration_bp
from student.updatedetails import student_update_bp
from student.demo_session import demo_session_bp
from student.view_attendance import attendance_bp
from teacher.attendance_records import attendance_session_bp

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# DynamoDB setup instead of MongoDB
db = DynamoDBWrapper()
attendance_collection = db.attendance_records
students_collection = db.students

# Initialize the Flask app
logger.info("Initializing Flask App...")
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-User-Email", "X-User-Type"]
}})

@app.before_request
def log_request_info():
    logger.info(f"Incoming Request: {request.method} {request.url}")

# Configure Flask app with database
app.config["DB"] = db
app.config["THRESHOLD"] = 0.6
app.config["ATTENDANCE_COLLECTION"] = attendance_collection

bcrypt = Bcrypt(app)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend status"""
    return {
        "status": "healthy",
        "models_ready": True, # AWS Rekognition is always ready
        "models_healthy": True,
        "timestamp": time.time()
    }

# Register blueprints
app.register_blueprint(auth_bp)

app.register_blueprint(student_registration_bp)
app.register_blueprint(student_update_bp)
app.register_blueprint(demo_session_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(attendance_session_bp)

# List all registered routes
logger.info("\nRegistered Flask Routes:")
for rule in app.url_map.iter_rules():
    logger.info(f"  {rule}")

if __name__ == "__main__":
    logger.info("🚀 Starting Flask server using AWS Rekognition...")
    logger.info("🎯 All systems ready! Server starting on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)  # Set debug=False for production