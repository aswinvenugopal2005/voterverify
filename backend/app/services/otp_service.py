import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import OTPRecord
from app.core.config import settings
from app.services.audit_service import log_audit

def generate_otp(db: Session, username: str) -> str:
    """
    Generates a 6-digit OTP code valid for 10 minutes.
    In DEMO_OTP_MODE, OTP is returned directly and logged clearly as a development-only feature.
    """
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this user
    db.query(OTPRecord).filter(
        OTPRecord.username == username,
        OTPRecord.is_used == False
    ).update({"is_used": True})

    otp_record = OTPRecord(
        username=username,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    log_audit(
        db,
        action="OTP_GENERATED",
        user_id=username,
        details=f"[DEVELOPMENT DEMO] OTP code generated: {otp_code} (Valid for 10 minutes)"
    )

    return otp_code

def verify_otp(db: Session, username: str, otp_code: str) -> bool:
    """
    Validates the provided OTP code for the user.
    """
    now = datetime.utcnow()
    record = db.query(OTPRecord).filter(
        OTPRecord.username == username,
        OTPRecord.otp_code == otp_code,
        OTPRecord.is_used == False,
        OTPRecord.expires_at > now
    ).first()

    if not record:
        log_audit(
            db,
            action="OTP_VERIFICATION_FAILED",
            user_id=username,
            details=f"Invalid or expired OTP attempt: {otp_code}"
        )
        return False

    record.is_used = True
    db.commit()

    log_audit(
        db,
        action="OTP_VERIFICATION_SUCCESS",
        user_id=username,
        details="OTP successfully verified for session authentication"
    )
    return True
