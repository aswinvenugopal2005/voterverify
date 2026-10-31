import os
import cv2
import numpy as np
from datetime import datetime, date, timedelta
from app.database.session import engine, Base, SessionLocal
from app.models.models import User, Booth, Voter, Election, Candidate, VotingRecord, Ballot, AuditLog
from app.core.security import get_password_hash
from app.core.config import settings

def create_synthetic_face_image(filepath: str, seed_num: int = 1):
    """
    Creates a clear, high-contrast synthetic human portrait face image with OpenCV
    that contains realistic facial structure (face oval, eyes, pupils, nose, mouth, hair)
    so Haar Cascade and template/facial feature matchers can recognize and verify it.
    """
    img = np.ones((300, 300, 3), dtype=np.uint8) * 240 # Light background
    
    # Skin tone variation
    skin_tones = [
        (180, 205, 235), # BGR
        (160, 190, 220),
        (170, 200, 230),
        (150, 185, 215)
    ]
    skin = skin_tones[seed_num % len(skin_tones)]
    
    # Hair colors
    hair_colors = [
        (30, 30, 30),
        (20, 25, 45),
        (40, 45, 55)
    ]
    hair = hair_colors[seed_num % len(hair_colors)]

    # Draw Hair / head outline
    cv2.circle(img, (150, 130), 80, hair, -1)

    # Face Oval
    cv2.ellipse(img, (150, 155), (65, 85), 0, 0, 360, skin, -1)
    cv2.ellipse(img, (150, 155), (65, 85), 0, 0, 360, (skin[0]-20, skin[1]-20, skin[2]-20), 2)

    # Hair on top
    cv2.ellipse(img, (150, 100), (70, 35), 0, 0, 180, hair, -1)

    # Eyebrows
    cv2.line(img, (115, 128), (135, 126), hair, 3)
    cv2.line(img, (165, 126), (185, 128), hair, 3)

    # Eyes (whites)
    cv2.ellipse(img, (125, 138), (12, 7), 0, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(img, (175, 138), (12, 7), 0, 0, 360, (255, 255, 255), -1)

    # Iris & Pupil
    cv2.circle(img, (125, 138), 5, (50, 30, 20), -1)
    cv2.circle(img, (175, 138), 5, (50, 30, 20), -1)
    cv2.circle(img, (125, 138), 2, (0, 0, 0), -1)
    cv2.circle(img, (175, 138), 2, (0, 0, 0), -1)

    # Nose
    cv2.line(img, (150, 142), (147, 168), (skin[0]-30, skin[1]-30, skin[2]-30), 2)
    cv2.line(img, (147, 168), (155, 168), (skin[0]-30, skin[1]-30, skin[2]-30), 2)

    # Mouth / Lips
    cv2.ellipse(img, (150, 195), (18, 7), 0, 0, 360, (110, 110, 190), -1)
    cv2.line(img, (135, 195), (165, 195), (80, 80, 150), 2)

    # Neck and Shoulders
    cv2.rectangle(img, (130, 235), (170, 280), skin, -1)
    cv2.ellipse(img, (150, 310), (120, 50), 0, 0, 360, (180, 100, 60), -1)

    # Save
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    cv2.imwrite(filepath, img)

def init_db():
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already contains data. Skipping initial seeding.")
        db.close()
        return

    print("Seeding synthetic test data...")

    # 1. Create Polling Booths
    booth1 = Booth(
        booth_id="B-101",
        booth_name="Central Community Hall",
        location="Sector 4, North Ward, Metropolis",
        officer_name="Officer Rajesh Kumar"
    )
    booth2 = Booth(
        booth_id="B-102",
        booth_name="Model Senior Secondary School",
        location="Block B, Green Avenue, North Ward",
        officer_name="Officer Anita Sharma"
    )
    booth3 = Booth(
        booth_id="B-103",
        booth_name="Town Civic Center & Library",
        location="Main Market Road, South Ward",
        officer_name="Officer Vikram Patel"
    )
    db.add_all([booth1, booth2, booth3])
    db.commit()

    # 2. Create Users for all 3 roles
    users = [
        User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            full_name="System Administrator",
            role="ADMIN",
            is_active=True
        ),
        User(
            username="dataentry",
            password_hash=get_password_hash("deo123"),
            full_name="Pooja Sharma (Data Entry Officer)",
            role="DATA_ENTRY",
            is_active=True
        ),
        User(
            username="booth101",
            password_hash=get_password_hash("booth123"),
            full_name="Officer Rajesh Kumar",
            role="BOOTH_OFFICER",
            booth_id="B-101",
            is_active=True
        ),
        User(
            username="booth102",
            password_hash=get_password_hash("booth123"),
            full_name="Officer Anita Sharma",
            role="BOOTH_OFFICER",
            booth_id="B-102",
            is_active=True
        )
    ]
    db.add_all(users)
    db.commit()

    # 3. Create Demonstration Election & Candidates
    election = Election(
        election_id="ELEC-2026",
        election_name="General Legislative Assembly Election 2026",
        start_time=datetime.utcnow() - timedelta(days=1),
        end_time=datetime.utcnow() + timedelta(days=30),
        status="ACTIVE"
    )
    db.add(election)
    db.commit()

    candidates = [
        Candidate(
            candidate_id="CAND-01",
            election_id="ELEC-2026",
            candidate_name="Dr. A. P. Sengupta",
            party_name="Progressive Citizens Coalition",
            candidate_symbol="Rising Sun"
        ),
        Candidate(
            candidate_id="CAND-02",
            election_id="ELEC-2026",
            candidate_name="Mrs. Meenakshi Sundaram",
            party_name="National Heritage Front",
            candidate_symbol="Lotus Flower"
        ),
        Candidate(
            candidate_id="CAND-03",
            election_id="ELEC-2026",
            candidate_name="Mr. Arvind Deshmukh",
            party_name="Democratic People's Forum",
            candidate_symbol="Oak Tree"
        )
    ]
    db.add_all(candidates)
    db.commit()

    # 4. Generate Synthetic Voter Photos & Register Voters
    voters_data = [
        {
            "voter_id": "VTR-1001",
            "name": "Rahul Sharma",
            "dob": date(1992, 5, 14),
            "age": 34,
            "gender": "Male",
            "address": "Flat 14B, Rose Garden, Sector 4, North Ward",
            "aadhaar_id": "9988-1122-3344",
            "booth_id": "B-101",
            "is_eligible": True,
            "has_voted": False,
            "seed": 1
        },
        {
            "voter_id": "VTR-1002",
            "name": "Priya Verma",
            "dob": date(1998, 11, 20),
            "age": 27,
            "gender": "Female",
            "address": "22 Lake View Apartments, North Ward",
            "aadhaar_id": "9988-2233-4455",
            "booth_id": "B-101",
            "is_eligible": True,
            "has_voted": False,
            "seed": 2
        },
        {
            "voter_id": "VTR-1003",
            "name": "Aakash Patel",
            "dob": date(1985, 3, 10),
            "age": 41,
            "gender": "Male",
            "address": "58 Sunrise Enclave, Sector 4",
            "aadhaar_id": "9988-3344-5566",
            "booth_id": "B-101",
            "is_eligible": True,
            "has_voted": True, # Pre-seeded voted voter to test duplicate vote barrier
            "seed": 3
        },
        {
            "voter_id": "VTR-1004",
            "name": "Sneha Iyer",
            "dob": date(2009, 8, 15), # Under 18
            "age": 17,
            "gender": "Female",
            "address": "10 Hill View Apt, Block B, Green Avenue",
            "aadhaar_id": "9988-4455-6677",
            "booth_id": "B-102",
            "is_eligible": False,
            "has_voted": False,
            "seed": 4
        },
        {
            "voter_id": "VTR-1005",
            "name": "Vikramaditya Roy",
            "dob": date(1978, 1, 25),
            "age": 48,
            "gender": "Male",
            "address": "74 Heritage Road, Metropolis",
            "aadhaar_id": "9988-5566-7788",
            "booth_id": "B-102",
            "is_eligible": True,
            "has_voted": False,
            "seed": 5
        }
    ]

    for v_info in voters_data:
        photo_filename = f"{v_info['voter_id']}_registered.jpg"
        photo_path = os.path.join(settings.UPLOAD_DIR, "voters", photo_filename)
        create_synthetic_face_image(photo_path, seed_num=v_info["seed"])

        voter = Voter(
            voter_id=v_info["voter_id"],
            name=v_info["name"],
            date_of_birth=v_info["dob"],
            age=v_info["age"],
            gender=v_info["gender"],
            address=v_info["address"],
            aadhaar_id=v_info["aadhaar_id"],
            booth_id=v_info["booth_id"],
            image_path=photo_path,
            is_eligible=v_info["is_eligible"],
            has_voted=v_info["has_voted"],
            created_at=datetime.utcnow()
        )
        db.add(voter)

    db.commit()

    # Pre-seed voting record and ballot for VTR-1003 (already voted)
    v_record = VotingRecord(
        election_id="ELEC-2026",
        voter_reference="VTR-1003",
        booth_id="B-101",
        timestamp=datetime.utcnow() - timedelta(hours=2),
        verification_status="VERIFIED_MATCH",
        verification_score=94.5
    )
    db.add(v_record)

    ballot = Ballot(
        election_id="ELEC-2026",
        candidate_id="CAND-01",
        timestamp=datetime.utcnow() - timedelta(hours=2)
    )
    db.add(ballot)

    audit = AuditLog(
        user_id="admin",
        action="SYSTEM_INITIALIZED",
        details="Database schema initialized with synthetic demonstration voter records."
    )
    db.add(audit)
    db.commit()
    db.close()
    print("Database initialization and synthetic seeding completed successfully!")

if __name__ == "__main__":
    init_db()
