from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Voter Verification System with Real-Time Duplicate Vote Detection"
    SECRET_KEY: str = "development_secret_key_change_in_production_min_32_chars_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    DATABASE_URL: str = "sqlite:///./voter_verification.db"
    
    # Face verification settings
    FACE_VERIFICATION_THRESHOLD: float = 0.55
    FACE_MODEL_NAME: str = "Facenet"
    ENABLE_MOCK_FACE_IF_UNAVAILABLE: bool = True
    
    # Demo settings
    DEMO_OTP_MODE: bool = True
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }

settings = Settings()

# Ensure directories exist
os.makedirs(os.path.join(settings.UPLOAD_DIR, "voters"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "captures"), exist_ok=True)
