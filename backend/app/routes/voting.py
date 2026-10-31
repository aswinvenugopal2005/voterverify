from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.models.models import Voter, VotingRecord, Ballot, Election, Candidate, Booth, AuditLog, User
from app.schemas.schemas import VotingConfirmRequest, VotingConfirmResponse, VotingStatusResponse, VotingStatsResponse
from app.core.deps import get_current_user, require_roles
from app.services.voting_service import confirm_vote_atomic

router = APIRouter(prefix="/api/voting", tags=["Voting & Duplicate Prevention"])

@router.post("/confirm", response_model=VotingConfirmResponse)
def confirm_vote(
    data: VotingConfirmRequest,
    request: Request,
    current_user: User = Depends(require_roles(["ADMIN", "BOOTH_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Booth Officer Explicit Confirmation Step:
    Atomically records the voter's vote and marks has_voted = True.
    Guarantees that simultaneous or duplicate attempts are blocked and audited.
    """
    result = confirm_vote_atomic(
        db=db,
        voter_id=data.voter_id,
        election_id=data.election_id,
        candidate_id=data.candidate_id,
        booth_id=data.booth_id,
        user_id=current_user.username,
        verification_score=data.verification_score,
        ip_address=request.client.host if request.client else None
    )
    return result

@router.get("/status/{voter_id}", response_model=VotingStatusResponse)
def get_voter_status(
    voter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    voter = db.query(Voter).filter(Voter.voter_id == voter_id.strip().upper()).first()
    if not voter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voter ID '{voter_id}' not found."
        )

    voting_rec = db.query(VotingRecord).filter(VotingRecord.voter_reference == voter.voter_id).first()
    rec_dict = None
    if voting_rec:
        rec_dict = {
            "record_id": voting_rec.record_id,
            "election_id": voting_rec.election_id,
            "booth_id": voting_rec.booth_id,
            "timestamp": voting_rec.timestamp,
            "verification_status": voting_rec.verification_status
        }

    return VotingStatusResponse(
        voter_id=voter.voter_id,
        name=voter.name,
        is_eligible=voter.is_eligible,
        has_voted=voter.has_voted,
        voting_record=rec_dict
    )

@router.get("/statistics", response_model=VotingStatsResponse)
def get_voting_statistics(
    election_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aggregates real-time statistics from the centralized SQLite database:
    - Total registered voters
    - Eligible voters
    - Total votes cast
    - Pending votes
    - Turnout percentage
    - Duplicate attempts blocked
    - Candidate aggregate votes
    - Booth turnout metrics
    """
    total_voters = db.query(func.count(Voter.voter_id)).scalar() or 0
    eligible_voters = db.query(func.count(Voter.voter_id)).filter(Voter.is_eligible == True).scalar() or 0
    total_votes = db.query(func.count(Voter.voter_id)).filter(Voter.has_voted == True).scalar() or 0
    pending_votes = max(0, eligible_voters - total_votes)
    turnout_pct = round((total_votes / eligible_voters * 100), 2) if eligible_voters > 0 else 0.0

    total_booths = db.query(func.count(Booth.booth_id)).scalar() or 0

    # Count blocked duplicate attempts from AuditLogs
    duplicate_attempts = db.query(func.count(AuditLog.log_id)).filter(
        AuditLog.action.like("%DUPLICATE_VOTE_BLOCKED%")
    ).scalar() or 0

    # Candidate aggregate results for active/selected election
    target_election = None
    if election_id:
        target_election = db.query(Election).filter(Election.election_id == election_id).first()
    if not target_election:
        target_election = db.query(Election).filter(Election.status == "ACTIVE").first()

    candidate_results = []
    if target_election:
        candidates = db.query(Candidate).filter(Candidate.election_id == target_election.election_id).all()
        for cand in candidates:
            c_votes = db.query(func.count(Ballot.ballot_id)).filter(
                Ballot.election_id == target_election.election_id,
                Ballot.candidate_id == cand.candidate_id
            ).scalar() or 0

            cand_pct = round((c_votes / total_votes * 100), 1) if total_votes > 0 else 0.0

            candidate_results.append({
                "candidate_id": cand.candidate_id,
                "candidate_name": cand.candidate_name,
                "party_name": cand.party_name,
                "candidate_symbol": cand.candidate_symbol,
                "votes_count": c_votes,
                "percentage": cand_pct
            })

    # Booth-wise turnout
    booths = db.query(Booth).all()
    booth_turnout = []
    for b in booths:
        b_total = db.query(func.count(Voter.voter_id)).filter(Voter.booth_id == b.booth_id).scalar() or 0
        b_voted = db.query(func.count(Voter.voter_id)).filter(
            Voter.booth_id == b.booth_id,
            Voter.has_voted == True
        ).scalar() or 0
        b_pct = round((b_voted / b_total * 100), 1) if b_total > 0 else 0.0

        booth_turnout.append({
            "booth_id": b.booth_id,
            "booth_name": b.booth_name,
            "location": b.location,
            "total_registered": b_total,
            "votes_cast": b_voted,
            "turnout_percentage": b_pct
        })

    return VotingStatsResponse(
        total_voters=total_voters,
        eligible_voters=eligible_voters,
        total_votes=total_votes,
        pending_votes=pending_votes,
        turnout_percentage=turnout_pct,
        duplicate_attempts_blocked=duplicate_attempts,
        total_booths=total_booths,
        candidate_results=candidate_results,
        booth_turnout=booth_turnout
    )
