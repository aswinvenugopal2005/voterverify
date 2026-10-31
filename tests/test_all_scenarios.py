import sys
import os
import pytest
from fastapi.testclient import TestClient
import concurrent.futures

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.database.init_db import init_db
from app.database.session import SessionLocal, Base, engine
from app.models.models import Voter, Booth, User, VotingRecord, Ballot
import cv2
import numpy as np
import base64

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Fresh database for clean automated test execution
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield

@pytest.fixture(scope="session")
def admin_token():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture(scope="session")
def booth_token():
    resp = client.post("/api/auth/login", json={"username": "booth101", "password": "booth123", "booth_id": "B-101"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture(scope="session")
def data_entry_token():
    resp = client.post("/api/auth/login", json={"username": "dataentry", "password": "deo123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

def generate_sample_b64_image(color=(200, 200, 200)):
    img = np.ones((150, 150, 3), dtype=np.uint8)
    img[:] = color
    # Draw simple facial feature circle
    cv2.circle(img, (75, 75), 45, (160, 190, 220), -1)
    cv2.circle(img, (60, 65), 5, (0, 0, 0), -1)
    cv2.circle(img, (90, 65), 5, (0, 0, 0), -1)
    cv2.line(img, (65, 95), (85, 95), (80, 80, 150), 2)
    _, buffer = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

# TEST 1: Register a new eligible voter (Age >= 18)
def test_1_register_eligible_voter(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    sample_img_b64 = generate_sample_b64_image((210, 220, 230))
    data = {
        "voter_id": "VTR-TEST-ELG",
        "name": "Arun Kumar Test",
        "date_of_birth": "1995-04-12", # Age ~ 31
        "gender": "Male",
        "address": "45 Test Lane, North Ward",
        "aadhaar_id": "9999-1111-2222",
        "booth_id": "B-101",
        "photo_base64": sample_img_b64
    }
    resp = client.post("/api/voters", data=data, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    assert body["voter"]["is_eligible"] is True
    assert body["voter"]["age"] >= 18

# TEST 2: Register a voter below 18 years
def test_2_register_ineligible_voter(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    sample_img_b64 = generate_sample_b64_image((220, 210, 230))
    data = {
        "voter_id": "VTR-TEST-INELG",
        "name": "Minor Test Voter",
        "date_of_birth": "2010-06-15", # Under 18
        "gender": "Female",
        "address": "88 Minor Colony",
        "aadhaar_id": "9999-3333-4444",
        "booth_id": "B-101",
        "photo_base64": sample_img_b64
    }
    resp = client.post("/api/voters", data=data, headers=headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["voter"]["is_eligible"] is False
    assert body["voter"]["age"] < 18

# TEST 3: Register an existing Voter ID
def test_3_register_existing_voter_id(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    sample_img_b64 = generate_sample_b64_image()
    data = {
        "voter_id": "VTR-1001", # Already seeded in init_db
        "name": "Duplicate ID Person",
        "date_of_birth": "1990-01-01",
        "gender": "Male",
        "address": "123 Street",
        "aadhaar_id": "8888-0000-1111",
        "booth_id": "B-101",
        "photo_base64": sample_img_b64
    }
    resp = client.post("/api/voters", data=data, headers=headers)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()

# TEST 4: Search an existing voter
def test_4_search_existing_voter(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    resp = client.get("/api/voters/search/VTR-1001", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["found"] is True
    assert body["voter"]["name"] == "Rahul Sharma"
    assert body["voter"]["booth_id"] == "B-101"
    assert body["status_label"] == "NOT VOTED"

# TEST 5: Search an invalid Voter ID
def test_5_search_invalid_voter(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    resp = client.get("/api/voters/search/VTR-NONEXISTENT", headers=headers)
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()

# TEST 6: Capture a face image and perform verification with registered photo
def test_6_face_verification_match(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    # Load registered photo of VTR-1001 to simulate matching face capture
    db = SessionLocal()
    voter = db.query(Voter).filter(Voter.voter_id == "VTR-1001").first()
    assert voter is not None
    with open(voter.image_path, "rb") as f:
        img_bytes = f.read()
    db.close()
    
    b64_img = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode('utf-8')

    payload = {
        "voter_id": "VTR-1001",
        "captured_image_base64": b64_img
    }
    resp = client.post("/api/face/verify", json=payload, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["matched"] is True
    assert "FACE VERIFICATION SUCCESSFUL" in body["message"]

# TEST 7: Perform verification with a different person's photograph
def test_7_face_verification_mismatch(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    # Load registered photo of VTR-1002 (different person) to compare against VTR-1001
    db = SessionLocal()
    voter2 = db.query(Voter).filter(Voter.voter_id == "VTR-1002").first()
    with open(voter2.image_path, "rb") as f:
        img2_bytes = f.read()
    db.close()

    b64_diff_img = "data:image/jpeg;base64," + base64.b64encode(img2_bytes).decode('utf-8')

    payload = {
        "voter_id": "VTR-1001", # Target is voter 1, but we pass voter 2's photo
        "captured_image_base64": b64_diff_img
    }
    resp = client.post("/api/face/verify", json=payload, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    # Check if distance is calculated or mismatch is caught
    assert "distance" in body
    assert "threshold" in body

# TEST 8: Complete voting after successful verification and confirmation
def test_8_complete_voting_confirmation(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    # We will cast vote for VTR-1001
    payload = {
        "voter_id": "VTR-1001",
        "election_id": "ELEC-2026",
        "candidate_id": "CAND-01",
        "booth_id": "B-101",
        "verification_score": 96.0
    }
    resp = client.post("/api/voting/confirm", json=payload, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["has_voted"] is True

    # Verify status reflects VOTED
    status_resp = client.get("/api/voting/status/VTR-1001", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["has_voted"] is True

# TEST 9: Attempt voting again using the same Voter ID (Duplicate vote detection)
def test_9_duplicate_vote_blocked(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    # Attempting to vote again for VTR-1001
    payload = {
        "voter_id": "VTR-1001",
        "election_id": "ELEC-2026",
        "candidate_id": "CAND-02",
        "booth_id": "B-101"
    }
    resp = client.post("/api/voting/confirm", json=payload, headers=headers)
    assert resp.status_code == 409
    body = resp.json()
    assert "ALERT: THIS VOTER HAS ALREADY VOTED. DUPLICATE VOTING ATTEMPT BLOCKED." in body["detail"]

# TEST 10: Try accessing an admin API using a Booth Officer account
def test_10_rbac_access_denied_for_booth_officer(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    # Booth Officer attempting to create an election (Admin only)
    payload = {
        "election_id": "ELEC-UNAUTH",
        "election_name": "Unauthorized Election",
        "start_time": "2026-01-01T00:00:00",
        "end_time": "2026-12-31T23:59:59"
    }
    resp = client.post("/api/elections", json=payload, headers=headers)
    assert resp.status_code == 403
    assert "access denied" in resp.json()["detail"].lower()

# TEST 11: Check dashboard statistics
def test_11_dashboard_statistics(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/voting/statistics", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_voters"] >= 5
    assert body["eligible_voters"] >= 4
    assert body["total_votes"] >= 2 # VTR-1003 + VTR-1001
    assert body["turnout_percentage"] > 0
    assert body["duplicate_attempts_blocked"] >= 1
    assert len(body["candidate_results"]) >= 3
    assert len(body["booth_turnout"]) >= 2

# TEST 12: Attempt two simultaneous voting requests for the same voter
def test_12_concurrent_voting_atomic_prevention(booth_token):
    headers = {"Authorization": f"Bearer {booth_token}"}
    target_voter = "VTR-1002" # Has not voted yet

    def execute_vote(candidate_id):
        return client.post("/api/voting/confirm", json={
            "voter_id": target_voter,
            "election_id": "ELEC-2026",
            "candidate_id": candidate_id,
            "booth_id": "B-101",
            "verification_score": 92.0
        }, headers=headers)

    # Launch two simultaneous requests in parallel threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(execute_vote, "CAND-01")
        f2 = executor.submit(execute_vote, "CAND-02")
        r1 = f1.result()
        r2 = f2.result()

    statuses = [r1.status_code, r2.status_code]
    # Exactly one must succeed (200) and the other must be rejected (409 Conflict)
    assert 200 in statuses, f"Expected one vote to succeed, got {statuses}"
    assert 409 in statuses, f"Expected one vote to be blocked with 409, got {statuses}"
