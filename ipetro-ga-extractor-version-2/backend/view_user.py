from app import app, db, User

with app.app_context():
    users = User.query.all()
    
    if not users:
        print("No users found in database")
    else:
        print(f"\n📋 Total users: {len(users)}\n")
        for user in users:
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Created: {user.created_at}")
            print("-" * 40)