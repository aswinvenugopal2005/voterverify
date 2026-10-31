from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False) # ADMIN, DATA_ENTRY, BOOTH_OFFICER
    booth_id = Column(String(50), ForeignKey("booths.booth_id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    booth = relationship("Booth", back_populates="officers")

class Booth(Base):
    __tablename__ = "booths"

    booth_id = Column(String(50), primary_key=True, index=True)
    booth_name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    officer_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    officers = relationship("User", back_populates="booth")
    voters = relationship("Voter", back_populates="booth")
    voting_records = relationship("VotingRecord", back_populates="booth")

class Voter(Base):
    __tablename__ = "voters"

    voter_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    aadhaar_id = Column(String(50), unique=True, index=True, nullable=False) # Synthetic test Aadhaar
    booth_id = Column(String(50), ForeignKey("booths.booth_id", ondelete="RESTRICT"), nullable=False)
    image_path = Column(String(255), nullable=False)
    is_eligible = Column(Boolean, default=True)
    has_voted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    booth = relationship("Booth", back_populates="voters")

class Election(Base):
    __tablename__ = "elections"

    election_id = Column(String(50), primary_key=True, index=True)
    election_name = Column(String(150), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="ACTIVE") # UPCOMING, ACTIVE, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)

    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    ballots = relationship("Ballot", back_populates="election")
    voting_records = relationship("VotingRecord", back_populates="election")

class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(String(50), primary_key=True, index=True)
    election_id = Column(String(50), ForeignKey("elections.election_id", ondelete="CASCADE"), nullable=False)
    candidate_name = Column(String(100), nullable=False)
    party_name = Column(String(100), nullable=False)
    candidate_symbol = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    election = relationship("Election", back_populates="candidates")
    ballots = relationship("Ballot", back_populates="candidate")

class VotingRecord(Base):
    __tablename__ = "voting_records"

    record_id = Column(Integer, primary_key=True, autoincrement=True)
    election_id = Column(String(50), ForeignKey("elections.election_id", ondelete="CASCADE"), nullable=False)
    voter_reference = Column(String(50), nullable=False, index=True)
    booth_id = Column(String(50), ForeignKey("booths.booth_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(50), default="VERIFIED_MATCH")
    verification_score = Column(Float, nullable=True)

    election = relationship("Election", back_populates="voting_records")
    booth = relationship("Booth", back_populates="voting_records")

    __table_args__ = (
        UniqueConstraint('election_id', 'voter_reference', name='uix_election_voter'),
    )

class Ballot(Base):
    """
    Decoupled Secret Ballot representation.
    Maintains complete separation between voter identity records and candidate selections.
    """
    __tablename__ = "ballots"

    ballot_id = Column(Integer, primary_key=True, autoincrement=True)
    election_id = Column(String(50), ForeignKey("elections.election_id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(String(50), ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    election = relationship("Election", back_populates="ballots")
    candidate = relationship("Candidate", back_populates="ballots")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    voter_reference = Column(String(50), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)

class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, index=True)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
