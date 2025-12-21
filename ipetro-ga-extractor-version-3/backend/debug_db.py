from database import SessionLocal, Extraction, User


def check_db():
    db = SessionLocal()
    try:
        print("✅ Connected to Database")

        # Check Extraction Table
        count = db.query(Extraction).count()
        print(f"✅ Extraction Table is accessible. Row count: {count}")

        # List first few IDs to confirm PKs exist
        extractions = db.query(Extraction).limit(5).all()
        for ext in extractions:
            print(f"   - ID: {ext.id}, Status: {ext.status}, User: {ext.user_id}")

    except Exception as e:
        print(f"❌ Database Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    check_db()
