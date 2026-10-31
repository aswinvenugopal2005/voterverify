from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Booth, Voter, User
from app.schemas.schemas import BoothCreate, BoothUpdate, BoothResponse
from app.core.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/booths", tags=["Booth Management"])

@router.post("", response_model=BoothResponse, status_code=status.HTTP_201_CREATED)
def create_booth(
    data: BoothCreate,
    current_user: User = Depends(require_roles(["ADMIN", "DATA_ENTRY"])),
    db: Session = Depends(get_db)
):
    booth_id_clean = data.booth_id.strip().upper()
    existing = db.query(Booth).filter(Booth.booth_id == booth_id_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booth ID '{booth_id_clean}' already exists."
        )

    booth = Booth(
        booth_id=booth_id_clean,
        booth_name=data.booth_name.strip(),
        location=data.location.strip(),
        officer_name=data.officer_name.strip() if data.officer_name else None
    )
    db.add(booth)
    db.commit()
    db.refresh(booth)

    # If officer username and password are provided, create or link Booth Officer account
    if data.officer_username and data.officer_password:
        existing_user = db.query(User).filter(User.username == data.officer_username.strip()).first()
        if existing_user:
            existing_user.booth_id = booth.booth_id
            existing_user.role = "BOOTH_OFFICER"
            if data.officer_name:
                existing_user.full_name = data.officer_name.strip()
            db.commit()
        else:
            officer_user = User(
                username=data.officer_username.strip(),
                password_hash=get_password_hash(data.officer_password.strip()),
                full_name=data.officer_name.strip() if data.officer_name else f"Officer {booth.booth_id}",
                role="BOOTH_OFFICER",
                booth_id=booth.booth_id,
                is_active=True
            )
            db.add(officer_user)
            db.commit()

    log_audit(
        db,
        action="BOOTH_CREATED",
        user_id=current_user.username,
        details=f"Created booth {booth.booth_id} - {booth.booth_name} ({booth.location})"
    )

    return booth

@router.get("", response_model=List[BoothResponse])
def get_all_booths(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booth)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Booth.booth_id.ilike(search_pattern)) |
            (Booth.booth_name.ilike(search_pattern)) |
            (Booth.location.ilike(search_pattern))
        )

    booths = query.all()
    result = []
    for b in booths:
        voter_count = db.query(func.count(Voter.voter_id)).filter(Voter.booth_id == b.booth_id).scalar() or 0
        resp = BoothResponse(
            booth_id=b.booth_id,
            booth_name=b.booth_name,
            location=b.location,
            officer_name=b.officer_name,
            created_at=b.created_at,
            voter_count=voter_count
        )
        result.append(resp)
    return result

@router.put("/{booth_id}", response_model=BoothResponse)
def update_booth(
    booth_id: str,
    data: BoothUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "DATA_ENTRY"])),
    db: Session = Depends(get_db)
):
    booth = db.query(Booth).filter(Booth.booth_id == booth_id.strip().upper()).first()
    if not booth:
        raise HTTPException(status_code=404, detail=f"Booth '{booth_id}' not found.")

    if data.booth_name is not None:
        booth.booth_name = data.booth_name.strip()
    if data.location is not None:
        booth.location = data.location.strip()
    if data.officer_name is not None:
        booth.officer_name = data.officer_name.strip()

    db.commit()
    db.refresh(booth)

    log_audit(
        db,
        action="BOOTH_UPDATED",
        user_id=current_user.username,
        details=f"Updated booth {booth.booth_id}"
    )

    voter_count = db.query(func.count(Voter.voter_id)).filter(Voter.booth_id == booth.booth_id).scalar() or 0
    return BoothResponse(
        booth_id=booth.booth_id,
        booth_name=booth.booth_name,
        location=booth.location,
        officer_name=booth.officer_name,
        created_at=booth.created_at,
        voter_count=voter_count
    )

@router.delete("/{booth_id}")
def delete_booth(
    booth_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    booth = db.query(Booth).filter(Booth.booth_id == booth_id.strip().upper()).first()
    if not booth:
        raise HTTPException(status_code=404, detail=f"Booth '{booth_id}' not found.")

    # Check dependent voters
    voter_count = db.query(func.count(Voter.voter_id)).filter(Voter.booth_id == booth.booth_id).scalar() or 0
    if voter_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete booth '{booth_id}'. There are {voter_count} voters currently assigned to this booth."
        )

    db.delete(booth)
    db.commit()

    log_audit(
        db,
        action="BOOTH_DELETED",
        user_id=current_user.username,
        details=f"Deleted booth {booth_id}"
    )

    return {"success": True, "message": f"Polling Booth '{booth_id}' deleted successfully."}
