from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def test_hash(password):
    print(f"Testing password: '{password}' (Length: {len(password)})")
    try:
        hashed = pwd_context.hash(password)
        print(f"✅ Success! Hash: {hashed[:10]}...")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


# Test 1: Short password
test_hash("testpassword123")

# Test 2: Long password (to reproduce error)
test_hash("a" * 73)
