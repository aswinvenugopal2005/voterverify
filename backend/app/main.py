from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database.init_db import init_db
from app.routes import auth, voters, booths, face, voting, elections, candidates, audit

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A secure web-based voter verification system using facial biometrics and centralized atomic transaction locks to eliminate duplicate voting.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for local development across ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static asset viewing
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(voters.router)
app.include_router(booths.router)
app.include_router(face.router)
app.include_router(voting.router)
app.include_router(elections.router)
app.include_router(candidates.router)
app.include_router(audit.router)


@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "ONLINE",
        "documentation": "/docs",
        "version": "1.0.0",
        "architecture": "Three-Layer Centralized SQLite with Facial Biometrics & Real-Time Duplicate Prevention"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "threshold": settings.FACE_VERIFICATION_THRESHOLD,
        "model": settings.FACE_MODEL_NAME,
        "demo_mode": settings.DEMO_OTP_MODE
    }
