from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from datetime import datetime
from typing import Dict, Any, Optional

from app.models.models import Voter, VotingRecord, Ballot, Election, Candidate, Booth
from app.services.audit_service import log_audit

def confirm_vote_atomic(
    db: Session,
    voter_id: str,
    election_id: str,
    candidate_id: str,
    booth_id: str,
    user_id: Optional[str] = None,
    verification_score: Optional[float] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """
    Atomic Voting & Duplicate Prevention Engine:
    Executes in a single database transaction with atomic checking.
    Guarantees that even with simultaneous requests, only ONE vote can ever be cast.
    Logs all duplicate voting attempts into AuditLogs.
    """
    # Verify election exists and is ACTIVE
    election = db.query(Election).filter(Election.election_id == election_id).first()
    if not election:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Election '{election_id}' not found."
        )
    if election.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Election '{election.election_name}' is currently {election.status}. Voting is not allowed."
        )

    # Verify candidate belongs to this election
    candidate = db.query(Candidate).filter(
        Candidate.candidate_id == candidate_id,
        Candidate.election_id == election_id
    ).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid candidate selected for this election."
        )

    # Check Booth exists
    booth = db.query(Booth).filter(Booth.booth_id == booth_id).first()
    if not booth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Polling booth '{booth_id}' not found."
        )

    # Atomically lock and check voter record
    # Note: SQLite supports atomic transaction blocks. We query the voter and check status.
    voter = db.query(Voter).filter(Voter.voter_id == voter_id).first()
    if not voter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Voter ID '{voter_id}' does not exist in the voter database."
        )

    if not voter.is_eligible:
        log_audit(
            db,
            action="INELIGIBLE_VOTE_BLOCKED",
            user_id=user_id,
            voter_reference=voter_id,
            details=f"Ineligible voter attempted voting at booth {booth_id}. Age: {voter.age}",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Voter is marked INELIGIBLE (Age: {voter.age} years). Cannot cast ballot."
        )

    # Central Real-Time Duplicate Vote Check
    if voter.has_voted:
        # Log duplicate vote attempt in audit logs
        log_audit(
            db,
            action="DUPLICATE_VOTE_BLOCKED",
            user_id=user_id,
            voter_reference=voter_id,
            details=f"DUPLICATE VOTE ATTEMPT BLOCKED for Voter {voter_id} at booth {booth_id}. Voter had already voted.",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED."
        )

    # Also verify existing voting record for this election
    existing_record = db.query(VotingRecord).filter(
        VotingRecord.election_id == election_id,
        VotingRecord.voter_reference == voter_id
    ).first()

    if existing_record:
        # Sync flag and reject
        voter.has_voted = True
        db.commit()
        log_audit(
            db,
            action="DUPLICATE_VOTE_BLOCKED",
            user_id=user_id,
            voter_reference=voter_id,
            details=f"Duplicate vote record detected for election {election_id} at booth {booth_id}.",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED."
        )

    # Atomic write operations
    try:
        # 1. Update voter status
        voter.has_voted = True

        # 2. Record voting transaction
        voting_record = VotingRecord(
            election_id=election_id,
            voter_reference=voter_id,
            booth_id=booth_id,
            timestamp=datetime.utcnow(),
            verification_status="VERIFIED_MATCH",
            verification_score=verification_score
        )
        db.add(voting_record)

        # 3. Record anonymous ballot (maintains separation of voter identity from secret ballot choice)
        ballot = Ballot(
            election_id=election_id,
            candidate_id=candidate_id,
            timestamp=datetime.utcnow()
        )
        db.add(ballot)

        # Commit all atomically
        db.commit()
        db.refresh(voting_record)

        # 4. Audit log of success
        log_audit(
            db,
            action="VOTE_CAST_SUCCESS",
            user_id=user_id,
            voter_reference=voter_id,
            details=f"Vote successfully cast and confirmed for voter {voter_id} at booth {booth_id}.",
            ip_address=ip_address
        )

        return {
            "success": True,
            "message": "Vote confirmed and recorded successfully.",
            "record_id": voting_record.record_id,
            "timestamp": voting_record.timestamp,
            "has_voted": True
        }

    except IntegrityError as ie:
        db.rollback()
        # Enforced by unique constraint: uix_election_voter
        log_audit(
            db,
            action="DUPLICATE_VOTE_BLOCKED_CONCURRENCY",
            user_id=user_id,
            voter_reference=voter_id,
            details=f"Concurrent duplicate voting prevented by DB unique constraint: {str(ie)}",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record vote: {str(e)}"
        )
