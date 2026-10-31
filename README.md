# Voter Verification System with Real-Time Duplicate Vote Detection

An enterprise-grade, three-layer web-based electoral verification prototype featuring deep learning facial recognition, centralized database transaction locking, and real-time duplicate vote prevention. Developed as an academic demonstration and institutional mock-election prototype.

---

## 🏛️ System Architecture

The application is structured into a clean three-layer architecture with a single authoritative database as the source of truth:

```
┌────────────────────────────────────────────────────────┐
│               A. FRONTEND LAYER (React + Vite)         │
│  - Modern Government UI with Tailwind CSS              │
│  - HTML5 Live Webcam Biometric Facial Scanner          │
│  - Role-Based Dashboards & Real-Time Alerts            │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs + JWT
┌───────────────────────────▼────────────────────────────┐
│               B. BACKEND LAYER (FastAPI)               │
│  - OpenCV + DeepFace FaceNet Embeddings Engine         │
│  - Cosine Distance Biometric Matching (Threshold 0.55) │
│  - Atomic Transaction Check & Duplicate Vote Blocker   │
│  - Demo OTP Verification Module                        │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy ORM
┌───────────────────────────▼────────────────────────────┐
│               C. DATABASE LAYER (SQLite)               │
│  - Central Authoritative Source of Truth               │
│  - Unique Constraint: election_id + voter_reference    │
│  - Decoupled Anonymous Secret Ballot Architecture      │
│  - Immutable Audit Logs                                │
└────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Demonstration Credentials

> **Notice:** The system is pre-seeded with synthetic test records for demonstration purposes only.

| Role | Username | Password | Assigned Booth | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Global | Manage elections, candidates, polling booths, view turnout analytics, review blocked duplicate attempts, and audit trails. |
| **Data Entry Officer** | `dataentry` | `deo123` | Global | Register new voters, auto-calculate eligibility from DOB (<18 ineligible), upload photos, and demo OTP login mode. |
| **Booth Officer (Station 1)** | `booth101` | `booth123` | `B-101` | Search voters, conduct live biometric webcam facial verification, and cast confirmed secret ballots. |
| **Booth Officer (Station 2)** | `booth102` | `booth123` | `B-102` | Conduct verification and voting for Booth B-102. |

---

## 🚀 Quick Start (Windows)

### Option 1: One-Click Launcher
Double click `start_project.bat` in the project root directory. It will launch both the FastAPI backend and React frontend dev server in separate windows.

### Option 2: Individual Batch Scripts
- Start Backend: `start_backend.bat`
- Start Frontend: `start_frontend.bat`

### Option 3: Manual Execution

#### 1. Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.database.init_db
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Test Suite (All 12 Scenarios)

The project includes an automated test suite verifying all 12 core requirements, including atomic concurrency and duplicate prevention:

```bash
.\backend\venv\Scripts\pytest tests\test_all_scenarios.py -v
```

### Verified Test Cases:
1. `test_1_register_eligible_voter`: Enrolls citizen (Age >= 18) as ELIGIBLE.
2. `test_2_register_ineligible_voter`: Enrolls minor (Age < 18) marked as INELIGIBLE.
3. `test_3_register_existing_voter_id`: Rejects duplicate Voter ID registration.
4. `test_4_search_existing_voter`: Retrieves voter profile and confirms NOT VOTED status.
5. `test_5_search_invalid_voter`: Correctly returns 404 for non-existent voter.
6. `test_6_face_verification_match`: Confirms biometric face match with registered photo.
7. `test_7_face_verification_mismatch`: Detects cosine distance divergence between different persons.
8. `test_8_complete_voting_confirmation`: Updates voter status atomically to VOTED and casts ballot.
9. `test_9_duplicate_vote_blocked`: Immediately blocks duplicate vote attempt with 409 Conflict.
10. `test_10_rbac_access_denied_for_booth_officer`: Rejects unauthorized administrative requests.
11. `test_11_dashboard_statistics`: Validates aggregated turnout, votes, and blocked attempt counts.
12. `test_12_concurrent_voting_atomic_prevention`: Executes simultaneous parallel voting requests and ensures only one succeeds while the duplicate is rejected.

---

## 🔒 Security & Privacy Implementation

1. **Centralized Atomic Duplicate Prevention:**
   - Voting transactions check `has_voted == False` inside a database transaction.
   - Enforced by a composite database uniqueness constraint: `UniqueConstraint('election_id', 'voter_reference')`.
   - Every blocked duplicate attempt writes an immutable entry to `AuditLogs`.

2. **Secret Ballot Decoupling:**
   - Voter identity records (`VotingRecords`) are strictly isolated from candidate selection records (`Ballots`). Candidate selections cannot be reverse-engineered back to individual voter profiles.

3. **Facial Verification Engine:**
   - Powered by OpenCV face detection and DeepFace FaceNet 512-dimensional facial embeddings.
   - Configurable threshold (default `0.55` cosine distance) with clear MATCH / MISMATCH / NO FACE alerts.
   - Requires explicit booth officer authorization before any ballot can be submitted.

4. **Synthetic Data Compliance:**
   - Aadhaar numbers are masked synthetic demonstration formats (`XXXX-XXXX-XXXX`) and not connected to any government identity infrastructure.
