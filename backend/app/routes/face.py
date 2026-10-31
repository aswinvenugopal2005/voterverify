from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.models.models import Voter, User
from app.schemas.schemas import FaceVerifyRequest, FaceVerifyResponse
from app.core.deps import get_current_user
from app.services.face_service import verify_faces
from app.services.audit_service import log_audit
from app.core.config import settings

router = APIRouter(prefix="/api/face", tags=["Face Verification"])

@router.post("/capture")
def test_capture(request_body: dict):
    """
    Utility endpoint to validate webcam base64 frame format.
    """
    image_b64 = request_body.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing base64 image data.")
    return {"success": True, "message": "Frame received and format valid."}

@router.post("/verify", response_model=FaceVerifyResponse)
def verify_voter_face(
    data: FaceVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Real-time Face Verification Pipeline:
    1. Checks if voter exists.
    2. Immediately checks if voter has already voted (Duplicate Vote Block).
    3. Retrieves registered photo.
    4. Runs OpenCV face detection + DeepFace / FaceNet embedding cosine distance comparison.
    5. Evaluates against threshold (0.55).
    6. Logs audit trail.
    """
    voter = db.query(Voter).filter(Voter.voter_id == data.voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voter ID '{data.voter_id}' does not exist in the electoral database."
        )

    # 1. Immediate duplicate vote barrier before biometric matching
    if voter.has_voted:
        log_audit(
            db,
            action="DUPLICATE_VOTE_BLOCKED_AT_FACE_VERIFICATION",
            user_id=current_user.username,
            voter_reference=voter.voter_id,
            details=f"Verification blocked for voter {voter.voter_id}. Voter already voted.",
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED."
        )

    if not voter.is_eligible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Voter '{voter.voter_id}' is marked INELIGIBLE (Age: {voter.age}). Verification cannot proceed."
        )

    # 2. Run verification pipeline
    verification_result = verify_faces(
        captured_base64=data.captured_image_base64,
        registered_image_path=voter.image_path,
        threshold=settings.FACE_VERIFICATION_THRESHOLD
    )

    action_label = "FACE_VERIFIED_SUCCESS" if verification_result["matched"] else "FACE_VERIFIED_FAILED"
    log_audit(
        db,
        action=action_label,
        user_id=current_user.username,
        voter_reference=voter.voter_id,
        details=f"Face verification result: {verification_result['message']}. Distance: {verification_result['distance']}, Model: {verification_result['model_used']}",
        ip_address=request.client.host if request.client else None
    )

    return FaceVerifyResponse(
        success=verification_result["success"],
        matched=verification_result["matched"],
        similarity_score=verification_result["similarity_score"],
        distance=verification_result["distance"],
        threshold=verification_result["threshold"],
        message=verification_result["message"],
        model_used=verification_result["model_used"],
        is_mock_mode=verification_result.get("is_mock_mode", False),
        voter_id=voter.voter_id,
        has_voted=voter.has_voted
    )
