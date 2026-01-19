import firebase_admin
from firebase_admin import credentials, firestore,auth
from fastapi import Depends, HTTPException, status, Request
from datetime import datetime, timezone

# Initialize Firebase Admin SDK once
if not firebase_admin._apps:
    cred = credentials.Certificate("ipetro-firebase-adminsdk-fbsvc-d6e34ee91f.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Make sure Firebase app is initialized
# firebase_admin.initialize_app()

async def verify_token(request: Request):
    """
    Verify Firebase ID token from Authorization header.

    Args:
        request (Request): FastAPI request object

    Returns:
        dict: {"uid": str, "email": str} if valid

    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token missing or invalid",
        )

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        return {"uid": uid, "email": email}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


    
def create_user(user_data):
    email = user_data.get("email")
    password = user_data.get("password")

    if not email or not password:
        return False, "Email and password required"

    try:
        # 1️⃣ Create Firebase Auth user
        user = auth.create_user(
            email=email,
            password=password
        )

        uid = user.uid

        # 2️⃣ Store user profile (NO PASSWORD)
        db.collection("users").document(uid).set({
            "name": user_data.get("name"),
            "email": email,
            "phone": user_data.get("phone"),
            "gender": user_data.get("gender"),
            "position": user_data.get("position"),
            "created_at": firestore.SERVER_TIMESTAMP
        })

        return True, "User registered successfully"

    except auth.EmailAlreadyExistsError:
        return False, "Email already registered"

    except Exception as e:
        return False, str(e)


def get_profile(user_id):
    doc_ref = db.collection("users").document(user_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None

def save_task_to_firestore(created_by, folder_id, task_name, sheet_data, slide_data, members, start_date, due_date, status="In Progress"):
    """
    Save a new task's metadata to Firestore.
    
    Args:
        created_by (str): Email of the user who created the task.
        folder_id (str): The Drive folder ID for the task (used as taskId).
        task_name (str): Name of the task.
        sheet_data (dict): Info about the Google Sheet (id, name).
        slide_data (dict): Info about the Google Slide (id, name).
        members (list): List of user emails assigned to the task.
        start_date (str): Task start date (ISO format recommended).
        due_date (str): Task due date (ISO format recommended).
        status (str): Task status (default "pending").
    
    Returns:
        dict: {"success": True} or {"success": False, "message": str}
    """
    try:
        task_ref = db.collection("tasks").document(folder_id)

        task_doc = {
            "taskId": folder_id,
            "createdBy": created_by,
            "taskName": task_name,
            "sheet": {
                "id": sheet_data.get("sheet_id"),
                "name": sheet_data.get("sheet_name"),
                "url": f"https://docs.google.com/spreadsheets/d/{sheet_data.get('sheet_id')}"
            },
            "slide": {
                "id": slide_data.get("slide_id"),
                "name": slide_data.get("slide_name"),
                "url": f"https://docs.google.com/presentation/d/{slide_data.get('slide_id')}"
            },
            "members": members,
            "startDate": start_date,
            "dueDate": due_date,
            "status": status,
            "createdAt": firestore.SERVER_TIMESTAMP
        }

        task_ref.set(task_doc)
        return {"success": True}

    except Exception as e:
        print("Error saving task to Firestore:", e)
        return {"success": False, "message": str(e)}

def list_user_tasks(user_email):
    """
    List all tasks where the user is either the creator or a member.
    Tasks are sorted by status (overdue → in progress → completed) 
    and then by dueDate ascending.
    Assumes a creator cannot be a member.
    """
    try:
        tasks_ref = db.collection("tasks")

        # Fetch tasks where user is creator
        creator_tasks = []
        for doc in tasks_ref.where("createdBy", "==", user_email).stream():
            task = doc.to_dict()
            task["id"] = doc.id
            creator_tasks.append(task)

        # Fetch tasks where user is a member
        member_tasks = []
        for doc in tasks_ref.where("members", "array_contains", user_email).stream():
            task = doc.to_dict()
            task["id"] = doc.id
            member_tasks.append(task)

        # Combine all tasks
        all_tasks = creator_tasks + member_tasks

        # Define desired status order
        status_order = {
            "Overdue": 0,
            "In Progress": 1,
            "Completed": 2
        }

        # Sort by status, then by dueDate ascending
        sorted_tasks = sorted(
            all_tasks,
            key=lambda t: (
                status_order.get(t.get("status", "In Progress"), 99),  # default 99 for unknown status
                t.get("dueDate", "")
            )
        )

        return {"success": True, "tasks": sorted_tasks}

    except Exception as e:
        print("Error listing user tasks:", e)
        return {"success": False, "message": str(e)}



# In services/firebase_service.py, add this function:

def update_task_in_firestore(task_id: str, updates: dict):
    """
    Update task in Firestore
    
    Args:
        task_id: The task document ID (folder_id)
        updates: Dictionary with fields to update (taskName, startDate, dueDate, members)
    
    Returns:
        dict with success status and message
    """
    try:
        # Use the existing db instance instead of creating a new one
        task_ref = db.collection("tasks").document(task_id)
        task_doc = task_ref.get()
        
        if not task_doc.exists:
            return {"success": False, "message": "Task not found"}
        
        # Add timestamp
        updates["updatedAt"] = firestore.SERVER_TIMESTAMP
        
        # Update the document
        task_ref.update(updates)
        
        return {"success": True, "message": "Task updated successfully"}
        
    except Exception as e:
        print(f"Error updating task in Firestore: {str(e)}")
        return {"success": False, "message": str(e)}
    
def list_all_users():
    """
    Retrieve all users from Firestore.
    """
    try:
        users_ref = db.collection("users").stream()
        users = []

        for doc in users_ref:
            user = doc.to_dict()
            user["uid"] = doc.id  # Add document ID as uid
            users.append(user)

        return {"success": True, "users": users}

    except Exception as e:
        print("Error retrieving users:", e)
        return {"success": False, "message": str(e)}

# ==================== PDF METADATA FUNCTIONS ====================

def save_pdf_metadata(task_id, pdf_data):
    """
    Save PDF metadata to Firestore as a subcollection under a task.
    
    Structure: tasks/{taskId}/pdfs/{fileId}
    
    Args:
        task_id (str): The task/folder ID
        pdf_data (dict): PDF metadata including:
            - fileId: Google Drive file ID
            - fileName: Name of the PDF
            - url: Google Drive web view link
            - thumbnail: Thumbnail link (optional)
            - uploadedBy: User email who uploaded
            - status: 'pending', 'extracted', etc.
            - extractedData: List of extracted data (optional)
    
    Returns:
        dict: {"success": True} or {"success": False, "message": str}
    """
    try:
        file_id = pdf_data.get("fileId")
        if not file_id:
            return {"success": False, "message": "fileId is required"}

        # Reference to the PDF document in the subcollection
        pdf_ref = db.collection("tasks").document(task_id).collection("pdfs").document(file_id)

        pdf_doc = {
            "fileId": file_id,
            "fileName": pdf_data.get("fileName"),
            "url": pdf_data.get("url"),
            "thumbnail": pdf_data.get("thumbnail"),
            "uploadedBy": pdf_data.get("uploadedBy"),
            "status": pdf_data.get("status", "pending"),
            "extractedData": pdf_data.get("extractedData", []),
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }

        pdf_ref.set(pdf_doc)
        return {"success": True}

    except Exception as e:
        print(f"Error saving PDF metadata to Firestore:", e)
        return {"success": False, "message": str(e)}


def list_task_pdfs(task_id):
    """
    List all PDF metadata for a specific task.
    
    Args:
        task_id (str): The task/folder ID
    
    Returns:
        dict: {"success": True, "pdfs": [...]} or {"success": False, "message": str}
    """
    try:
        pdfs_ref = db.collection("tasks").document(task_id).collection("pdfs")
        pdf_docs = pdfs_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()

        pdfs = []
        for doc in pdf_docs:
            pdf = doc.to_dict()
            pdf["id"] = doc.id  # Add document ID
            pdfs.append(pdf)

        return {"success": True, "pdfs": pdfs}

    except Exception as e:
        print(f"Error listing task PDFs:", e)
        return {"success": False, "message": str(e)}


def update_pdf_metadata(task_id, file_id, updates):
    """
    Update PDF metadata in Firestore.
    
    Args:
        task_id (str): The task/folder ID
        file_id (str): The PDF's Google Drive file ID
        updates (dict): Fields to update (e.g., status, extractedData)
    
    Returns:
        dict: {"success": True} or {"success": False, "message": str}
    """
    try:
        pdf_ref = db.collection("tasks").document(task_id).collection("pdfs").document(file_id)
        
        # Add updatedAt timestamp
        updates["updatedAt"] = firestore.SERVER_TIMESTAMP
        
        pdf_ref.update(updates)
        return {"success": True}

    except Exception as e:
        print(f"Error updating PDF metadata:", e)
        return {"success": False, "message": str(e)}


def delete_pdf_metadata(task_id, file_id):
    """
    Delete PDF metadata from Firestore.
    
    Args:
        task_id (str): The task/folder ID
        file_id (str): The PDF's Google Drive file ID
    
    Returns:
        dict: {"success": True} or {"success": False, "message": str}
    """
    try:
        pdf_ref = db.collection("tasks").document(task_id).collection("pdfs").document(file_id)
        pdf_ref.delete()
        return {"success": True}

    except Exception as e:
        print(f"Error deleting PDF metadata:", e)
        return {"success": False, "message": str(e)}


def get_pdf_metadata(task_id, file_id):
    """
    Get specific PDF metadata from Firestore.
    
    Args:
        task_id (str): The task/folder ID
        file_id (str): The PDF's Google Drive file ID
    
    Returns:
        dict: PDF metadata or None if not found
    """
    try:
        pdf_ref = db.collection("tasks").document(task_id).collection("pdfs").document(file_id)
        pdf_doc = pdf_ref.get()
        
        if pdf_doc.exists:
            return pdf_doc.to_dict()
        return None

    except Exception as e:
        print(f"Error getting PDF metadata:", e)
        return None

def update_extracted_data_in_firestore(task_id: str, file_id: str, extracted_data: list):
    """
    Update the extracted data for a specific PDF in Firestore.
    
    Args:
        task_id (str): The task/folder ID
        file_id (str): The PDF's Google Drive file ID
        extracted_data (list): New extracted data to save
    
    Returns:
        dict: {"success": True, "message": str} or {"success": False, "message": str}
    """
    try:
        # Reference to the PDF document
        pdf_ref = db.collection("tasks").document(task_id).collection("pdfs").document(file_id)
        
        # Check if PDF exists
        pdf_doc = pdf_ref.get()
        if not pdf_doc.exists:
            return {"success": False, "message": "PDF not found"}
        
        # Update extracted data and timestamp
        pdf_ref.update({
            "extractedData": extracted_data,
            "status": "extracted",  # Update status to extracted
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        
        return {"success": True, "message": "Extracted data updated successfully"}
        
    except Exception as e:
        print(f"Error updating extracted data in Firestore: {str(e)}")
        return {"success": False, "message": str(e)}
    
def update_overdue_tasks():
    """
    Automatically mark tasks as Overdue if dueDate < today
    and status is not Completed.
    """
    try:
        print("⏰ Running overdue task updater...")
        today = datetime.now(timezone.utc).date()

        tasks_ref = db.collection("tasks")
        tasks = tasks_ref.where("status", "!=", "Completed").stream()

        updated_count = 0

        for doc in tasks:
            task = doc.to_dict()
            due_date_str = task.get("dueDate")

            if not due_date_str:
                continue

            # dueDate stored as ISO string (YYYY-MM-DD)
            due_date = datetime.fromisoformat(due_date_str).date()

            if due_date < today and task.get("status") != "Overdue":
                doc.reference.update({
                    "status": "Overdue",
                    "updatedAt": firestore.SERVER_TIMESTAMP
                })
                updated_count += 1

        print(f"[CRON] Overdue tasks updated: {updated_count}")
        return {"success": True, "updated": updated_count}

    except Exception as e:
        print("[CRON] Error updating overdue tasks:", e)
        return {"success": False, "message": str(e)}
    
# Add to services/firebase_service.py

def update_task_status(task_id: str, new_status: str, user_email: str) -> dict:
    """
    Update the status of a task
    
    Args:
        task_id: The ID of the task (folder ID)
        new_status: The new status ('pending', 'in-progress', 'completed')
        user_email: Email of the user making the request
    
    Returns:
        dict: Success status and message
    """
    from datetime import datetime
    
    try:
        # Get task document
        task_ref = db.collection('tasks').document(task_id)
        task_doc = task_ref.get()
        
        if not task_doc.exists:
            return {
                "success": False,
                "message": f"Task with ID {task_id} not found"
            }
        
        task_data = task_doc.to_dict()
        
        # Authorization check
        is_creator = task_data.get('createdBy') == user_email
        is_member = user_email in task_data.get('members', [])
        
        if not (is_creator or is_member):
            return {
                "success": False,
                "message": "You are not authorized to update this task"
            }
        
        # For completion status, only creator can update
        if new_status.lower() == 'completed' and not is_creator:
            return {
                "success": False,
                "message": "Only the task creator can mark the task as completed"
            }
        
        # Validate status
        valid_statuses = ['In Progress', 'Completed', 'Overdue']
        if new_status not in valid_statuses:
            return {
                "success": False,
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }
        
        # Prepare update data
        update_data = {
            'status': new_status,
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        # If marking as completed, add completion timestamp
        if new_status.lower() == 'completed':
            update_data['completedAt'] = datetime.utcnow().isoformat()
            update_data['completedBy'] = user_email
        
        # Update the document
        task_ref.update(update_data)
        
        return {
            "success": True,
            "message": f"Task status updated to {new_status}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error updating task status: {str(e)}"
        }