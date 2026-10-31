from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Candidate, Election, User
from app.schemas.schemas import CandidateCreate, CandidateResponse
from app.core.deps import get_current_user, require_roles
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/candidates", tags=["Candidate Management"])

@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    data: CandidateCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    election = db.query(Election).filter(Election.election_id == data.election_id.strip()).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"Election '{data.election_id}' not found.")

    cand_id = data.candidate_id.strip().upper()
    existing = db.query(Candidate).filter(Candidate.candidate_id == cand_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Candidate ID '{cand_id}' already exists.")

    candidate = Candidate(
        candidate_id=cand_id,
        election_id=election.election_id,
        candidate_name=data.candidate_name.strip(),
        party_name=data.party_name.strip(),
        candidate_symbol=data.candidate_symbol.strip()
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    log_audit(
        db,
        action="CANDIDATE_ADDED",
        user_id=current_user.username,
        details=f"Added candidate {candidate.candidate_name} ({candidate.party_name}) to {election.election_id}"
    )

    return CandidateResponse(
        candidate_id=candidate.candidate_id,
        election_id=candidate.election_id,
        candidate_name=candidate.candidate_name,
        party_name=candidate.party_name,
        candidate_symbol=candidate.candidate_symbol,
        votes_count=0
    )

@router.get("", response_model=List[CandidateResponse])
def get_candidates(
    election_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Candidate)
    if election_id:
        query = query.filter(Candidate.election_id == election_id)
    candidates = query.all()
    return [
        CandidateResponse(
            candidate_id=c.candidate_id,
            election_id=c.election_id,
            candidate_name=c.candidate_name,
            party_name=c.party_name,
            candidate_symbol=c.candidate_symbol,
            votes_count=0
        ) for c in candidates
    ]
