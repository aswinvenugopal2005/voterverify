from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
import os
import shutil
import base64
import uuid

from app.database.session import get_db
from app.models.models import Voter, Booth, User
from app.schemas.schemas import VoterResponse, VoterUpdate
from app.core.config import settings
from app.core.deps import get_current_user, require_roles
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/voters", tags=["Voter Management"])

def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def mask_aadhaar(aadhaar: str) -> str:
    cleaned = aadhaar.replace("-", "").replace(" ", "")
    if len(cleaned) >= 4:
        return f"XXXX-XXXX-{cleaned[-4:]}"
    return "XXXX-XXXX-XXXX"

def format_voter_response(voter: Voter, booth_name: Optional[str] = None) -> dict:
    image_filename = os.path.basename(voter.image_path)
    return {
        "voter_id": voter.voter_id,
        "name": voter.name,
        "date_of_birth": voter.date_of_birth,
        "age": voter.age,
        "gender": voter.gender,
        "address": voter.address,
        "aadhaar_masked": mask_aadhaar(voter.aadhaar_id),
        "booth_id": voter.booth_id,
        "booth_name": booth_name or (voter.booth.booth_name if voter.booth else None),
        "image_url": f"/api/voters/{voter.voter_id}/photo",
        "is_eligible": voter.is_eligible,
        "has_voted": voter.has_voted,
        "created_at": voter.created_at
    }

@router.post("", status_code=status.HTTP_201_CREATED)
async def register_voter(
    voter_id: str = Form(...),
    name: str = Form(...),
    date_of_birth: str = Form(...), # YYYY-MM-DD
    gender: str = Form(...),
    address: str = Form(...),
    aadhaar_id: str = Form(...),
    booth_id: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    photo_base64: Optional[str] = Form(None),
    current_user: User = Depends(require_roles(["ADMIN", "DATA_ENTRY"])),
    db: Session = Depends(get_db)
):
    """
    Registers a new voter with automatic age calculation and eligibility evaluation.
    Requires ADMIN or DATA_ENTRY role.
    """
    # 1. Check Voter ID uniqueness
    voter_id_clean = voter_id.strip().upper()
    existing_voter = db.query(Voter).filter(Voter.voter_id == voter_id_clean).first()
    if existing_voter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Voter ID '{voter_id_clean}' is already registered in the system."
        )

    # 2. Check Aadhaar uniqueness (synthetic test values)
    aadhaar_clean = aadhaar_id.strip()
    existing_aadhaar = db.query(Voter).filter(Voter.aadhaar_id == aadhaar_clean).first()
    if existing_aadhaar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aadhaar ID '{aadhaar_clean}' is already registered with another voter."
        )

    # 3. Check Booth existence
    booth = db.query(Booth).filter(Booth.booth_id == booth_id.strip()).first()
    if not booth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assigned Polling Booth '{booth_id}' does not exist. Please assign an existing booth."
        )

    # 4. Parse Date of Birth and calculate age
    try:
        dob = datetime.strptime(date_of_birth.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format for date_of_birth. Expected YYYY-MM-DD."
        )

    age = calculate_age(dob)
    is_eligible = (age >= 18)

    # 5. Handle Photograph upload (file or base64)
    file_ext = ".jpg"
    target_filename = f"{voter_id_clean}_{uuid.uuid4().hex[:8]}{file_ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, "voters", target_filename)

    if photo and photo.filename:
        # File upload
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
    elif photo_base64:
        # Base64 webcam capture
        try:
            b64_clean = photo_base64.split(",", 1)[1] if "," in photo_base64 else photo_base64
            img_data = base64.b64decode(b64_clean)
            with open(target_path, "wb") as f:
                f.write(img_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process photograph data: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A voter photograph is mandatory. Please upload a photo or capture via webcam."
        )

    # 6. Create Voter record
    voter = Voter(
        voter_id=voter_id_clean,
        name=name.strip(),
        date_of_birth=dob,
        age=age,
        gender=gender.strip(),
        address=address.strip(),
        aadhaar_id=aadhaar_clean,
        booth_id=booth.booth_id,
        image_path=target_path,
        is_eligible=is_eligible,
        has_voted=False,
        created_at=datetime.utcnow()
    )
    db.add(voter)
    db.commit()
    db.refresh(voter)

    log_audit(
        db,
        action="VOTER_REGISTERED",
        user_id=current_user.username,
        voter_reference=voter.voter_id,
        details=f"Voter registered: {voter.name}, Age: {voter.age}, Eligible: {voter.is_eligible}, Booth: {voter.booth_id}"
    )

    return {
        "success": True,
        "message": f"Voter '{voter.name}' registered successfully." if is_eligible else f"Voter '{voter.name}' registered but marked INELIGIBLE (Age: {age} years < 18).",
        "voter": format_voter_response(voter, booth.booth_name)
    }

@router.get("")
def get_voters(
    search: Optional[str] = None,
    booth_id: Optional[str] = None,
    eligible_only: Optional[bool] = None,
    has_voted: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List registered voters with filtering, search and pagination.
    """
    query = db.query(Voter)

    # If Booth Officer, can optionally restrict to their booth
    if current_user.role == "BOOTH_OFFICER" and current_user.booth_id:
        query = query.filter(Voter.booth_id == current_user.booth_id)
    elif booth_id:
        query = query.filter(Voter.booth_id == booth_id)

    if eligible_only is not None:
        query = query.filter(Voter.is_eligible == eligible_only)

    if has_voted is not None:
        query = query.filter(Voter.has_voted == has_voted)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Voter.voter_id.ilike(search_pattern)) |
            (Voter.name.ilike(search_pattern)) |
            (Voter.address.ilike(search_pattern))
        )

    total_count = query.count()
    voters = query.order_by(Voter.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "voters": [format_voter_response(v) for v in voters]
    }

@router.get("/search/{voter_id}")
def search_voter_by_id(
    voter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Booth Officer / Verification Voter Lookup by Voter ID.
    Returns clear voting status: NOT VOTED, VOTED, or INELIGIBLE.
    """
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voter with ID '{voter_id}' not found in the electoral roll."
        )

    # Check voting status string
    status_label = "INELIGIBLE" if not voter.is_eligible else ("VOTED" if voter.has_voted else "NOT VOTED")

    return {
        "found": True,
        "status_label": status_label,
        "has_voted": voter.has_voted,
        "is_eligible": voter.is_eligible,
        "duplicate_alert": voter.has_voted,
        "alert_message": "ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED." if voter.has_voted else None,
        "voter": format_voter_response(voter)
    }

@router.get("/{voter_id}/photo")
def get_voter_photo(voter_id: str, db: Session = Depends(get_db)):
    """
    Serves the voter photograph securely.
    """
    from fastapi.responses import FileResponse
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter or not os.path.exists(voter.image_path):
        # Fallback to default placeholder image if file missing
        placeholder = os.path.join(settings.UPLOAD_DIR, "voters", "default.png")
        if os.path.exists(placeholder):
            return FileResponse(placeholder, media_type="image/png")
        raise HTTPException(status_code=404, detail="Photograph not found.")
    return FileResponse(voter.image_path)

@router.get("/{voter_id}")
def get_voter_detail(
    voter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter '{voter_id}' not found.")
    return format_voter_response(voter)

@router.put("/{voter_id}")
def update_voter(
    voter_id: str,
    data: VoterUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "DATA_ENTRY"])),
    db: Session = Depends(get_db)
):
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter '{voter_id}' not found.")

    if data.name is not None:
        voter.name = data.name.strip()
    if data.date_of_birth is not None:
        voter.date_of_birth = data.date_of_birth
        voter.age = calculate_age(data.date_of_birth)
        voter.is_eligible = (voter.age >= 18)
    if data.gender is not None:
        voter.gender = data.gender.strip()
    if data.address is not None:
        voter.address = data.address.strip()
    if data.booth_id is not None:
        booth = db.query(Booth).filter(Booth.booth_id == data.booth_id.strip()).first()
        if not booth:
            raise HTTPException(status_code=404, detail=f"Booth '{data.booth_id}' not found.")
        voter.booth_id = booth.booth_id
    if data.is_eligible is not None:
        voter.is_eligible = data.is_eligible

    db.commit()
    db.refresh(voter)

    log_audit(
        db,
        action="VOTER_UPDATED",
        user_id=current_user.username,
        voter_reference=voter.voter_id,
        details=f"Voter details updated by {current_user.username}"
    )

    return {
        "success": True,
        "message": "Voter details updated successfully.",
        "voter": format_voter_response(voter)
    }

@router.delete("/{voter_id}")
def delete_voter(
    voter_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter '{voter_id}' not found.")

    # Check if voter has cast a vote
    if voter.has_voted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a voter who has already cast a vote in an election."
        )

    # Delete photo file if exists
    if voter.image_path and os.path.exists(voter.image_path):
        try:
            os.remove(voter.image_path)
        except Exception:
            pass

    db.delete(voter)
    db.commit()

    log_audit(
        db,
        action="VOTER_DELETED",
        user_id=current_user.username,
        voter_reference=voter_id,
        details=f"Voter '{voter_id}' deleted by Administrator."
    )

    return {"success": True, "message": f"Voter '{voter_id}' removed from electoral roll."}
