from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import UserLogin, Token, OTPRequest, OTPVerify, UserResponse
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.core.deps import get_current_user
from app.services.otp_service import generate_otp, verify_otp
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Standard username and password authentication.
    Supports Booth ID verification for Booth Officers.
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        log_audit(
            db,
            action="LOGIN_FAILED",
            user_id=login_data.username,
            details="Invalid username or password attempt.",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive. Please contact system administrator."
        )

    # If user is a BOOTH_OFFICER, check booth assignment if provided
    if user.role == "BOOTH_OFFICER" and login_data.booth_id:
        if user.booth_id and user.booth_id != login_data.booth_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Officer '{user.username}' is assigned to booth '{user.booth_id}', not '{login_data.booth_id}'."
            )

    token_data = {
        "sub": user.username,
        "role": user.role,
        "booth_id": user.booth_id,
        "full_name": user.full_name
    }
    access_token = create_access_token(token_data)

    log_audit(
        db,
        action="LOGIN_SUCCESS",
        user_id=user.username,
        details=f"Successful login for role {user.role} (Booth: {user.booth_id or 'N/A'})",
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "booth_id": user.booth_id
    }

@router.post("/request-otp")
def request_otp(data: OTPRequest, request: Request, db: Session = Depends(get_db)):
    """
    Demo OTP Generation for Data Entry Officer login.
    In DEMO_OTP_MODE, the generated OTP is logged and returned in the response with a clear development label.
    """
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{data.username}' not found."
        )

    otp_code = generate_otp(db, user.username)

    return {
        "success": True,
        "message": "OTP generated successfully.",
        "username": user.username,
        "demo_mode": settings.DEMO_OTP_MODE,
        "demo_otp": otp_code if settings.DEMO_OTP_MODE else None,
        "note": "NOTICE: This is an academic development mock-OTP feature. Do not use without an official SMS gateway in production."
    }

@router.post("/verify-otp", response_model=Token)
def verify_user_otp(data: OTPVerify, request: Request, db: Session = Depends(get_db)):
    """
    Validates OTP and returns JWT bearer token.
    """
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{data.username}' not found."
        )

    is_valid = verify_otp(db, user.username, data.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code."
        )

    token_data = {
        "sub": user.username,
        "role": user.role,
        "booth_id": user.booth_id,
        "full_name": user.full_name
    }
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "booth_id": user.booth_id
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's details.
    """
    return current_user
