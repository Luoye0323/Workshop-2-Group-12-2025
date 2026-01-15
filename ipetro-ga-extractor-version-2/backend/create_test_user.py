from app import app, db, User

def create_test_user():
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username='admin').first()
        
        if existing_user:
            print("❌ User 'admin' already exists!")
            return
        
        # Create new user
        test_user = User(
            username='admin',
            email='admin@example.com'
        )
        test_user.set_password('admin123')
        
        db.session.add(test_user)
        db.session.commit()
        
        print("✅ Test user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Email: admin@example.com")

if __name__ == '__main__':
    create_test_user()