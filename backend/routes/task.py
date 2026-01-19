from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.firebase_service import (
    list_user_tasks, save_task_to_firestore, update_task_status, verify_token, 
    save_pdf_metadata, list_task_pdfs, update_pdf_metadata, delete_pdf_metadata,
    update_task_in_firestore,update_extracted_data_in_firestore
)
from services.drive_service import (
    copy_google_sheet, copy_google_slide, create_task_in_folder, 
    upload_pdf_to_task_folder, delete_pdf_from_drive
)
from services.sheet_service import extract_yellow_headers, format_rows_with_pdf, get_rows_by_equipment

router = APIRouter()


# Pydantic Models
class CreateTaskRequest(BaseModel):
    taskName: str
    startDate: Optional[str] = None
    dueDate: Optional[str] = None
    members: List[str] = []
    sheetTemplateId: str
    slideTemplateId: str


class UpdatePDFRequest(BaseModel):
    status: Optional[str] = None
    extractedData: Optional[List[Dict[str, Any]]] = None


class MergePDFWithSheetRequest(BaseModel):
    equipment_no: str
    pdfData: Dict[str, Any]

class UpdateTaskRequest(BaseModel):
    taskName: str
    startDate: Optional[str] = None
    dueDate: Optional[str] = None
    members: List[str] = []

# Dependency for authentication
async def get_current_user(user_info: dict = Depends(verify_token)):
    """Verify user token and return user info"""
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_info


# -------------------- CREATE TASK --------------------
@router.post("/create_task")
async def create_task_route(
    request_data: CreateTaskRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new task with associated Google Sheet and Slide"""
    created_by = user_info["email"]
    task_name = request_data.taskName
    start_date = request_data.startDate
    due_date = request_data.dueDate
    members = request_data.members
    sheet_template_id = request_data.sheetTemplateId
    slide_template_id = request_data.slideTemplateId
    status = "In Progress"

    if not task_name or task_name.strip() == "":
        raise HTTPException(status_code=400, detail="Task name cannot be empty")

    # 1️⃣ Create Drive folder (taskId)
    folder_result = create_task_in_folder(
        task_name.strip(), 
        created_by, 
        members
    )

    if not folder_result["success"]:
        if "already exists" in folder_result["message"].lower():
            raise HTTPException(status_code=409, detail=folder_result["message"])
        raise HTTPException(status_code=500, detail=folder_result["message"])

    folder_id = folder_result["folder_id"]

    # 2️⃣ Copy Sheet
    sheet = copy_google_sheet(task_name, folder_id, sheet_template_id)
    if not sheet["success"]:
        raise HTTPException(status_code=500, detail="Folder created, but failed to create sheet")

    # 3️⃣ Copy Slide
    slide = copy_google_slide(task_name, folder_id, slide_template_id)
    if not slide["success"]:
        raise HTTPException(status_code=500, detail="Folder created, but failed to create slide")

    # 4️⃣ Save to Firestore
    firestore_result = save_task_to_firestore(
        created_by=created_by,
        folder_id=folder_id,
        task_name=task_name,
        sheet_data=sheet,
        slide_data=slide,
        members=members,
        start_date=start_date,
        due_date=due_date,
        status=status
    )

    if not firestore_result["success"]:
        raise HTTPException(status_code=500, detail="Failed to save task metadata")

    # 5️⃣ Return FULL task object
    return {
        "message": "Task created successfully",
        "task": {
            "taskId": folder_id,
            "taskName": task_name,
            "folderId": folder_id,
            "createdBy": created_by,
            "sheet": {
                "id": sheet["sheet_id"],
                "name": sheet["sheet_name"],
                "url": f"https://docs.google.com/spreadsheets/d/{sheet['sheet_id']}"
            },
            "slide": {
                "id": slide["slide_id"],
                "name": slide["slide_name"],
                "url": f"https://docs.google.com/presentation/d/{slide['slide_id']}"
            },
            "members": members,
            "startDate": start_date,
            "dueDate": due_date,
            "status": status
        }
    }


# -------------------- GET USER TASKS --------------------
@router.get("/my_tasks")
async def get_my_tasks(user_info: dict = Depends(get_current_user)):
    """Get all tasks for the current user"""
    user_email = user_info["email"]

    tasks_result = list_user_tasks(user_email)
    if not tasks_result["success"]:
        raise HTTPException(status_code=500, detail="Failed to retrieve tasks")

    return {"tasks": tasks_result["tasks"]}


# -------------------- UPLOAD PDF --------------------
@router.post("/upload_pdf/{task_id}")
async def upload_pdf_route(
    task_id: str,
    file: UploadFile = File(...),
    user_info: dict = Depends(get_current_user)
):
    """Upload a PDF file to a task folder"""
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # 1️⃣ Upload to Google Drive
    result = upload_pdf_to_task_folder(task_id, file.file, file.filename)

    if not result["success"]:
        # Check if it's a duplicate error
        if result.get("error_code") == "DUPLICATE_FILE":
            raise HTTPException(status_code=409, detail=result["message"])
        raise HTTPException(status_code=500, detail=result["message"])

    # 2️⃣ Save metadata to Firestore
    pdf_metadata = {
        "fileId": result["file_id"],
        "fileName": result["file_name"],
        "url": result["url"],
        "thumbnail": result.get("thumbnail"),
        "uploadedBy": user_info["email"],
        "status": "pending",
        "extractedData": []
    }

    firestore_result = save_pdf_metadata(task_id, pdf_metadata)
    
    if not firestore_result["success"]:
        print(f"Warning: Failed to save PDF metadata to Firestore: {firestore_result.get('message')}")
        # Don't fail the upload, just log the warning

    return {
        "message": "PDF uploaded successfully",
        "pdf": {
            "fileId": result["file_id"],
            "fileName": result["file_name"],
            "url": result["url"],
            "thumbnail": result.get("thumbnail"),
            "createdAt": result.get("created_at"),
            "status": "pending",
            "extractedData": []
        }
    }


# -------------------- LIST PDFs --------------------
@router.get("/list_pdfs/{task_id}")
async def list_pdfs_route(
    task_id: str,
    user_info: dict = Depends(get_current_user)
):
    """List all PDFs in a task"""
    # Get PDFs from Firestore (includes metadata like extractedData, status)
    result = list_task_pdfs(task_id)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])

    return {
        "pdfs": result["pdfs"],
        "count": len(result["pdfs"])
    }


# -------------------- UPDATE PDF METADATA --------------------
@router.patch("/update_pdf/{task_id}/{file_id}")
async def update_pdf_route(
    task_id: str,
    file_id: str,
    request_data: UpdatePDFRequest,
    user_info: dict = Depends(get_current_user)
):
    """Update PDF metadata (status, extractedData)"""
    # Build updates dict from non-None fields
    updates = {}
    if request_data.status is not None:
        updates["status"] = request_data.status
    if request_data.extractedData is not None:
        updates["extractedData"] = request_data.extractedData

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = update_pdf_metadata(task_id, file_id, updates)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])

    return {"message": "PDF metadata updated successfully"}


# -------------------- DELETE PDF --------------------
@router.delete("/delete_pdf/{task_id}/{file_id}")
async def delete_pdf_route(
    task_id: str,
    file_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Delete a PDF from both Google Drive and Firestore"""
    # 1️⃣ Delete from Google Drive
    drive_result = delete_pdf_from_drive(file_id)
    
    if not drive_result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete from Google Drive: {drive_result['message']}"
        )

    # 2️⃣ Delete metadata from Firestore
    firestore_result = delete_pdf_metadata(task_id, file_id)

    if not firestore_result["success"]:
        # File deleted from Drive but not from Firestore - log warning
        print(f"Warning: File deleted from Drive but failed to delete Firestore metadata: {firestore_result.get('message')}")
        raise HTTPException(
            status_code=207,
            detail="PDF deleted from Google Drive but failed to delete metadata from database"
        )

    return {"message": "PDF deleted successfully from both Google Drive and database"}


# -------------------- GET HEADERS --------------------
@router.get("/get_headers")
async def get_headers_route():
    """Get yellow headers from the Google Sheet"""
    headers = extract_yellow_headers("1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE")

    if headers is None:
        raise HTTPException(status_code=500, detail="Failed to extract headers")

    return {"headers": headers}


# -------------------- GET ORIGINAL DATA --------------------
@router.get("/get_original_data")
async def get_original_data_route(
    equipment_no: str = Query(..., description="Equipment number to search for")
):
    """
    Get original row data from the Google Sheet for a specific equipment number.
    Query param: ?equipment_no=V-001
    """
    if not equipment_no or not equipment_no.strip():
        raise HTTPException(
            status_code=400,
            detail="Missing or empty 'equipment_no' query parameter"
        )

    # Call the service method to get rows
    rows = get_rows_by_equipment("1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE", equipment_no.strip())

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for equipment number '{equipment_no}'"
        )

    return {
        "success": True,
        "equipment_no": equipment_no,
        "row_count": len(rows),
        "rows": rows
    }


# -------------------- MERGE PDF WITH SHEET --------------------
@router.post("/merge_pdf_with_sheet")
async def merge_pdf_with_sheet_route(request_data: MergePDFWithSheetRequest):
    """
    Merge extracted PDF data with original Google Sheet rows
    Body:
    {
        "equipment_no": "V-002",
        "pdfData": { ... extracted pdf json ... }
    }
    """
    equipment_no = request_data.equipment_no.strip()
    pdf_data = request_data.pdfData

    if not equipment_no:
        raise HTTPException(status_code=400, detail="equipment_no is required")

    if not pdf_data:
        raise HTTPException(status_code=400, detail="pdfData is required")

    # 1️⃣ Get original rows from Google Sheet
    rows = get_rows_by_equipment(
        "1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE",
        equipment_no
    )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No sheet data found for equipment '{equipment_no}'"
        )

    # 2️⃣ Merge & format
    formatted_rows = format_rows_with_pdf(rows, pdf_data)

    return {
        "success": True,
        "equipment_no": equipment_no,
        "row_count": len(formatted_rows),
        "rows": formatted_rows
    }

@router.patch("/update_task/{task_id}")
async def update_task_route(
    task_id: str,
    request_data: UpdateTaskRequest,
    user_info: dict = Depends(get_current_user)
):
    
    # Validate input
    if not request_data.taskName or request_data.taskName.strip() == "":
        raise HTTPException(status_code=400, detail="Task name cannot be empty")
    
    # Prepare updates
    updates = {
        "taskName": request_data.taskName.strip(),
        "members": request_data.members,
    }
    
    if request_data.startDate:
        updates["startDate"] = request_data.startDate
    if request_data.dueDate:
        updates["dueDate"] = request_data.dueDate
    
    # Update in Firestore
    result = update_task_in_firestore(task_id, updates)
    
    if not result["success"]:
        if "not found" in result["message"].lower():
            raise HTTPException(status_code=404, detail=result["message"])
        raise HTTPException(status_code=500, detail=result["message"])
    
    return {
        "success": True,
        "message": "Task updated successfully"
    }

# Add this Pydantic model at the top with other models
class UpdateExtractedDataRequest(BaseModel):
    extracted_data: List[Dict[str, Any]]


# Add this route after the other PDF routes
# -------------------- UPDATE EXTRACTED DATA --------------------
@router.put("/update_extracted_data/{task_id}/{file_id}")
async def update_extracted_data_route(
    task_id: str,
    file_id: str,
    request_data: UpdateExtractedDataRequest,
    user_info: dict = Depends(get_current_user)
):
    """Update extracted data for a specific PDF"""
    
    if not request_data.extracted_data:
        raise HTTPException(status_code=400, detail="extracted_data cannot be empty")
    
    # Update in Firestore
    result = update_extracted_data_in_firestore(task_id, file_id, request_data.extracted_data)
    
    if not result["success"]:
        if "not found" in result["message"].lower():
            raise HTTPException(status_code=404, detail=result["message"])
        raise HTTPException(status_code=500, detail=result["message"])
    
    return {
        "success": True,
        "message": "Extracted data updated successfully"
    }

# Add this model with other Pydantic models at the top
class UpdateTaskStatusRequest(BaseModel):
    status: str


# Add this route after update_task_route
# -------------------- UPDATE TASK STATUS --------------------
@router.patch("/tasks/{task_id}/status")
async def update_task_status_route(
    task_id: str,
    request_data: UpdateTaskStatusRequest,
    user_info: dict = Depends(get_current_user)
):
    """
    Update the status of a task (pending, in-progress, completed)
    Only task creator can mark task as completed
    """
    
    # Validate status
    if not request_data.status or request_data.status.strip() == "":
        raise HTTPException(status_code=400, detail="Status cannot be empty")
    
    # Update task status
    result = update_task_status(
        task_id=task_id,
        new_status=request_data.status.strip(),
        user_email=user_info["email"]
    )
    
    if not result["success"]:
        # Determine appropriate status code
        if "not found" in result["message"].lower():
            raise HTTPException(status_code=404, detail=result["message"])
        elif "not authorized" in result["message"].lower():
            raise HTTPException(status_code=403, detail=result["message"])
        elif "invalid status" in result["message"].lower():
            raise HTTPException(status_code=400, detail=result["message"])
        else:
            raise HTTPException(status_code=500, detail=result["message"])
    
    return {
        "success": True,
        "message": result["message"]
    }