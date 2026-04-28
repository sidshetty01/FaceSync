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

# OPTIMIZED MODEL MANAGER CLASS
class ModelManager:
    """
    Singleton class to manage face recognition models
    Ensures models are loaded only once and shared across all requests
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize_models()
        return cls._instance

    def _initialize_models(self):
        """Initialize all face recognition models with proper error handling"""
        logger.info("🤖 Starting model initialization...")
        start_time = time.time()

        self.models_ready = False
        self.deepface_ready = False

        try:
            from deepface import DeepFace
            logger.info("Warming up DeepFace ArcFace model with retinaface detector...")

            # Force model download and initialization with dummy prediction
            dummy_img = np.zeros((160, 160, 3), dtype=np.uint8)

            # This forces the model to be downloaded and cached
            _ = DeepFace.represent(
                dummy_img, 
                model_name='ArcFace', 
                detector_backend='retinaface',
                enforce_detection=False,
                align=True
            )

            self.deepface_ready = True
            self.models_ready = True
            logger.info("✅ DeepFace ArcFace & retinaface warmed up successfully")

            initialization_time = time.time() - start_time
            logger.info(f"🎉 All models initialized successfully in {initialization_time:.2f} seconds")

        except Exception as e:
            logger.error(f"❌ Model initialization failed: {e}")
            self.models_ready = False
            raise e

    def is_ready(self):
        """Check if all models are ready"""
        return self.models_ready and self.deepface_ready

    def health_check(self):
        """Perform model health check"""
        try:
            if not self.models_ready:
                return False

            # Test DeepFace
            from deepface import DeepFace
            test_face = np.random.randint(0, 255, (160, 160, 3), dtype=np.uint8)
            _ = DeepFace.represent(
                test_face, 
                model_name='ArcFace', 
                detector_backend='retinaface',
                enforce_detection=False,
                align=True
            )

            return True

        except Exception as e:
            logger.error(f"Model health check failed: {e}")
            return False

# Initialize the model manager (singleton)
logger.info("Initializing Model Manager...")
model_manager = ModelManager()

# Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-User-Email", "X-User-Type"]
}})

@app.before_request
def log_request_info():
    logger.info(f"Incoming Request: {request.method} {request.url}")
    if request.is_json:
        logger.info(f"Body: {request.get_json()}")

# Configure Flask app with database and model instances
app.config["DB"] = db
app.config["THRESHOLD"] = 0.6
app.config["ATTENDANCE_COLLECTION"] = attendance_collection

app.config["MODEL_MANAGER"] = model_manager

bcrypt = Bcrypt(app)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify model status"""
    model_status = model_manager.is_ready()
    model_health = model_manager.health_check()

    return {
        "status": "healthy" if model_status and model_health else "unhealthy",
        "models_ready": model_status,
        "models_healthy": model_health,
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
    logger.info("🚀 Starting Flask server...")

    # Final model verification before starting
    if model_manager.is_ready():
        logger.info("🎯 All systems ready! Server starting on http://0.0.0.0:5000")
        app.run(host="0.0.0.0", port=5000, debug=False)  # Set debug=False for production
    else:
        logger.error("❌ Cannot start server - models not ready")
        exit(1)