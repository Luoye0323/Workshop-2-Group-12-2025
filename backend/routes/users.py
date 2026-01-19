from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any
from services.firebase_service import get_profile, list_all_users, verify_token

router = APIRouter()


# Dependency for authentication
async def get_current_user(user_info: dict = Depends(verify_token)):
    """Verify user token and return user info"""
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_info


@router.get("/me")
async def get_current_user_profile(user_info: dict = Depends(get_current_user)):
    """Get the current user's profile"""
    uid = user_info["uid"]

    # Fetch user profile from Firestore
    user_profile = get_profile(uid)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    return user_profile


@router.get("/all_by_position")
@router.get("/all_by_position")
async def get_all_users_by_position(user_info: dict = Depends(get_current_user)) -> Dict[str, List[Dict[str, Any]]]:
    """
    Return all users grouped by position.
    """
    result = list_all_users()
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result.get("message", "Failed to fetch users")
        )

    users = result["users"]

    # Initialize groups
    grouped = {
        "rbi_lead": [],
        "rbi_engineer": [],
        "tech_assistant": [],
        "admin": []
    }

    for user in users:
        pos = user.get("position", "").lower()  # Convert to lowercase
        
        # Normalize position: replace spaces with underscores
        normalized_pos = pos.replace(" ", "_")
        
        if normalized_pos in grouped:
            grouped[normalized_pos].append(user)

    # Ensure all keys exist even if empty
    return grouped


@router.get("/all_users")
async def get_all_users(user_info: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Return all users.
    """
    result = list_all_users()
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result.get("message", "Failed to fetch users")
        )

    users = result["users"]

    # Return object with users array and total count
    return {
        "users": users,
        "total": len(users)
    }