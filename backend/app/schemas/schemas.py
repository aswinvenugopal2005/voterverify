from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str
    booth_id: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    booth_id: Optional[str] = None

# User Schemas
class UserLogin(BaseModel):
    username: str
    password: str
    booth_id: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str # ADMIN, DATA_ENTRY, BOOTH_OFFICER
    booth_id: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    booth_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# OTP Schemas
class OTPRequest(BaseModel):
    username: str

class OTPVerify(BaseModel):
    username: str
    otp_code: str

# Booth Schemas
class BoothCreate(BaseModel):
    booth_id: str
    booth_name: str
    location: str
    officer_name: Optional[str] = None
    officer_username: Optional[str] = None
    officer_password: Optional[str] = None

class BoothUpdate(BaseModel):
    booth_name: Optional[str] = None
    location: Optional[str] = None
    officer_name: Optional[str] = None

class BoothResponse(BaseModel):
    booth_id: str
    booth_name: str
    location: str
    officer_name: Optional[str] = None
    created_at: datetime
    voter_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Voter Schemas
class VoterCreate(BaseModel):
    voter_id: str
    name: str
    date_of_birth: date
    gender: str
    address: str
    aadhaar_id: str # synthetic test Aadhaar
    booth_id: str

class VoterUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    booth_id: Optional[str] = None
    is_eligible: Optional[bool] = None

class VoterResponse(BaseModel):
    voter_id: str
    name: str
    date_of_birth: date
    age: int
    gender: str
    address: str
    aadhaar_masked: str
    booth_id: str
    booth_name: Optional[str] = None
    image_url: str
    is_eligible: bool
    has_voted: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Face Verification Schemas
class FaceVerifyRequest(BaseModel):
    voter_id: str
    captured_image_base64: str # Base64 data URL from webcam
    election_id: Optional[str] = None

class FaceVerifyResponse(BaseModel):
    success: bool
    matched: bool
    similarity_score: float
    distance: float
    threshold: float
    message: str
    model_used: str
    is_mock_mode: bool = False
    voter_id: str
    has_voted: bool

# Voting Confirmation & Status
class VotingConfirmRequest(BaseModel):
    voter_id: str
    election_id: str
    candidate_id: str
    booth_id: str
    verification_score: Optional[float] = None

class VotingConfirmResponse(BaseModel):
    success: bool
    message: str
    record_id: Optional[int] = None
    timestamp: datetime
    has_voted: bool

class VotingStatusResponse(BaseModel):
    voter_id: str
    name: str
    is_eligible: bool
    has_voted: bool
    voting_record: Optional[Dict[str, Any]] = None

class VotingStatsResponse(BaseModel):
    total_voters: int
    eligible_voters: int
    total_votes: int
    pending_votes: int
    turnout_percentage: float
    duplicate_attempts_blocked: int
    total_booths: int
    candidate_results: List[Dict[str, Any]]
    booth_turnout: List[Dict[str, Any]]

# Election Schemas
class ElectionCreate(BaseModel):
    election_id: str
    election_name: str
    start_time: datetime
    end_time: datetime
    status: str = "ACTIVE"

class ElectionUpdate(BaseModel):
    election_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None

class CandidateCreate(BaseModel):
    candidate_id: str
    election_id: str
    candidate_name: str
    party_name: str
    candidate_symbol: str

class CandidateResponse(BaseModel):
    candidate_id: str
    election_id: str
    candidate_name: str
    party_name: str
    candidate_symbol: str
    votes_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ElectionResponse(BaseModel):
    election_id: str
    election_name: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
    candidates: List[CandidateResponse] = []

    class Config:
        from_attributes = True

# Audit Log Response
class AuditLogResponse(BaseModel):
    log_id: int
    user_id: Optional[str]
    action: str
    voter_reference: Optional[str]
    timestamp: datetime
    details: Optional[str]
    ip_address: Optional[str]

    class Config:
        from_attributes = True
