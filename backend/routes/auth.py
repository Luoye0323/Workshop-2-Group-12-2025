# routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Request
from pydantic import BaseModel
from services.firebase_service import create_user, verify_token
import os

router = APIRouter()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
APP_JWT_SECRET = os.environ.get("APP_JWT_SECRET")
FRONTEND_URL = os.environ.get("FRONTEND_URL")
BACKEND_URL = os.environ.get("BACKEND_URL")

# --------------------- Pydantic model for request ---------------------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    gender: str
    position: str


async def get_current_user(user_info: dict = Depends(verify_token)):
    """Verify user token and return user info"""
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_info

# --------------------- REGISTER ---------------------
@router.post("/register")
async def register(request_data: RegisterRequest,user_info: dict = Depends(get_current_user)):
    
    # 1 Extract data
    name = request_data.name
    email = request_data.email
    password = request_data.password
    phone = request_data.phone
    gender = request_data.gender
    position = request_data.position

    # 3️⃣ Validate (Pydantic already ensures fields are present)
    # Additional validation can be added here if needed

    # 4️⃣ Create Firebase user + Firestore profile
    success, msg = create_user({
        "name": name,
        "email": email,
        "password": password,
        "phone": phone,
        "gender": gender,
        "position": position
    })

    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    return {"message": msg}
    
