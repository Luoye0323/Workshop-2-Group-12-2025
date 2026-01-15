from app import app, db, User

with app.app_context():
    username = input("Enter username to check: ")
    user = User.query.filter_by(username=username).first()
    
    if user:
        print(f"\n✅ User found!")
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Password Hash: {user.password_hash}")
        
        # Test password
        test_password = input("\nEnter password to test: ")
        if user.check_password(test_password):
            print("✅ Password is CORRECT!")
        else:
            print("❌ Password is INCORRECT!")
    else:
        print(f"\n❌ User '{username}' not found in database")
        
        # Show all users
        all_users = User.query.all()
        if all_users:
            print("\n📋 Available users:")
            for u in all_users:
                print(f"  - {u.username} ({u.email})")
        else:
            print("\n⚠️ No users in database at all!")