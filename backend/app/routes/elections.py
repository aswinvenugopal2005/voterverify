from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.session import get_db
from app.models.models import Election, Candidate, User, Ballot
from app.schemas.schemas import ElectionCreate, ElectionUpdate, ElectionResponse, CandidateResponse
from app.core.deps import get_current_user, require_roles
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/elections", tags=["Election Management"])

@router.post("", response_model=ElectionResponse, status_code=status.HTTP_201_CREATED)
def create_election(
    data: ElectionCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    elec_id = data.election_id.strip().upper()
    existing = db.query(Election).filter(Election.election_id == elec_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Election ID '{elec_id}' already exists."
        )

    election = Election(
        election_id=elec_id,
        election_name=data.election_name.strip(),
        start_time=data.start_time,
        end_time=data.end_time,
        status=data.status
    )
    db.add(election)
    db.commit()
    db.refresh(election)

    log_audit(
        db,
        action="ELECTION_CREATED",
        user_id=current_user.username,
        details=f"Created election: {election.election_name} ({election.election_id})"
    )

    return election

@router.get("", response_model=List[ElectionResponse])
def get_elections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    elections = db.query(Election).order_by(Election.created_at.desc()).all()
    results = []
    for e in elections:
        candidates_out = []
        for c in e.candidates:
            v_count = db.query(Ballot).filter(
                Ballot.election_id == e.election_id,
                Ballot.candidate_id == c.candidate_id
            ).count()
            candidates_out.append(CandidateResponse(
                candidate_id=c.candidate_id,
                election_id=c.election_id,
                candidate_name=c.candidate_name,
                party_name=c.party_name,
                candidate_symbol=c.candidate_symbol,
                votes_count=v_count
            ))
        results.append(ElectionResponse(
            election_id=e.election_id,
            election_name=e.election_name,
            start_time=e.start_time,
            end_time=e.end_time,
            status=e.status,
            created_at=e.created_at,
            candidates=candidates_out
        ))
    return results

@router.put("/{election_id}", response_model=ElectionResponse)
def update_election(
    election_id: str,
    data: ElectionUpdate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    election = db.query(Election).filter(Election.election_id == election_id.strip().upper()).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"Election '{election_id}' not found.")

    if data.election_name is not None:
        election.election_name = data.election_name.strip()
    if data.start_time is not None:
        election.start_time = data.start_time
    if data.end_time is not None:
        election.end_time = data.end_time
    if data.status is not None:
        election.status = data.status.strip().upper()

    db.commit()
    db.refresh(election)

    log_audit(
        db,
        action="ELECTION_UPDATED",
        user_id=current_user.username,
        details=f"Updated election {election.election_id}: status={election.status}"
    )

    candidates_out = [
        CandidateResponse(
            candidate_id=c.candidate_id,
            election_id=c.election_id,
            candidate_name=c.candidate_name,
            party_name=c.party_name,
            candidate_symbol=c.candidate_symbol,
            votes_count=0
        ) for c in election.candidates
    ]

    return ElectionResponse(
        election_id=election.election_id,
        election_name=election.election_name,
        start_time=election.start_time,
        end_time=election.end_time,
        status=election.status,
        created_at=election.created_at,
        candidates=candidates_out
    )
