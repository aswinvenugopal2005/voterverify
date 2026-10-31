from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models.models import AuditLog

def log_audit(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    voter_reference: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Records an immutable audit log entry for system transparency and security.
    """
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        voter_reference=voter_reference,
        timestamp=datetime.utcnow(),
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    try:
        db.commit()
        db.refresh(log_entry)
    except Exception:
        db.rollback()
    return log_entry
