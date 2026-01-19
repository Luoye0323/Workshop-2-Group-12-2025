import traceback
from fastapi import APIRouter, HTTPException, Query,Depends
from typing import Optional
from services.slide_service import (
    build_slide_table_updates, build_slide_table_updates_grouped_by_no, 
    build_slide_textbox_updates, build_slide_textbox_updates_from_first_row, 
    overwrite_grouped_tables, overwrite_table_cells, overwrite_textboxes, 
    read_textboxes_from_slide, read_textboxes_grouped_by_slide
)
from services.sheet_service import get_all_rows_with_no, get_rows_by_no
from services.firebase_service import verify_token
from services.drive_service import create_empty_template, list_templates
from datetime import datetime, timedelta
from fastapi.concurrency import run_in_threadpool

router = APIRouter()
# ------------------------------
# 🔐 LOCK SYSTEM
# ------------------------------
LOCK_TIMEOUT = timedelta(minutes=10)
# Key: spreadsheet_id + presentation_id, Value: lock info dict
DOC_LOCKS = {}

async def get_current_user(user_info: dict = Depends(verify_token)):
    """Verify user token and return user info"""
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_info


@router.get("/all_templates")
async def get_templates():
    """
    Fetch all templates (Excel & Inspection Plan) from Drive.
    """
    try:
        # Retrieve templates
        result = list_templates()

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Failed to retrieve templates")
            )

        # Return the templates JSON
        return result

    except HTTPException:
        raise
    except Exception as e:
        print("Error in get_templates route:", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/get-rows-by-no")
async def get_rows_by_no_route(
    spreadsheet_id: str = Query(..., description="Google Sheets spreadsheet ID"),
    target_no: str = Query(..., description="Target NO. to filter rows"),
    presentation_id: str = Query(..., description="Google Slides presentation ID"),
    table_id: str = Query(..., description="Table ID in the slide"),
    sheet_index: int = Query(0, description="Sheet index (0-based)"),
    slide_id: str = Query("p1", description="Slide ID")
):
    """
    Get rows from Google Sheets by NO., update table and textboxes in Google Slides.
    """
    try:
        # 1️⃣ Get rows from Google Sheets
        rows = get_rows_by_no(
            spreadsheet_id=spreadsheet_id,
            target_no=target_no,
            sheet_index=sheet_index
        )

        api_response = {
            "success": True,
            "count": len(rows),
            "data": rows
        }

        # 2️⃣ Build table insert data
        insert_data = build_slide_table_updates(api_response)
        insert_response = (
            overwrite_table_cells(table_id, insert_data, presentation_id) 
            if insert_data 
            else {"message": "No data to insert in table"}
        )

        # 3️⃣ Read textboxes from the slide
        textbox_response = read_textboxes_from_slide(presentation_id, slide_id)
        textbox_ids = [item["object_id"] for item in textbox_response]

        # 4️⃣ Build textbox updates using the first row
        textbox_updates = build_slide_textbox_updates_from_first_row(rows, textbox_ids)
        textbox_insert_response = (
            overwrite_textboxes(presentation_id, textbox_updates) 
            if textbox_updates 
            else {"message": "No data to insert in textboxes"}
        )

        # 5️⃣ Return combined response
        return {
            "success": True,
            "table_count": len(insert_data),
            "insert_data": insert_data,
            "insert_response": insert_response,
            "textbox_count": len(textbox_updates) // 3,  # 3 requests per textbox
            "textbox_updates": textbox_updates,
            "textbox_response": textbox_insert_response
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get-all-rows")
async def get_all_rows(
    spreadsheet_id: str = Query(..., description="Google Sheets spreadsheet ID"),
    presentation_id: str = Query(..., description="Google Slides presentation ID"),
    sheet_index: int = Query(0, description="Sheet index (0-based)"),
    current_user: dict = Depends(get_current_user)  # 👈 get user identity
):
    """
    Get all rows from Google Sheets, update grouped tables and textboxes in Google Slides.
    Only one user can edit this spreadsheet+presentation at a time.
    """
    user_id = current_user.get("uid") or current_user.get("email")
    doc_key = f"{spreadsheet_id}_{presentation_id}"  # Unique lock per document

    try:
        # ------------------------------
        # 🔐 CHECK LOCK
        # ------------------------------
        lock = DOC_LOCKS.get(doc_key)
        if lock:
            # Auto-unlock if timeout
            if datetime.utcnow() - lock["locked_at"] > LOCK_TIMEOUT:
                DOC_LOCKS.pop(doc_key)
            else:
                raise HTTPException(
                    status_code=423,  # Locked
                    detail=f"Another user is editing this document"
                )

        # ------------------------------
        # 🔒 ACQUIRE LOCK
        # ------------------------------
        DOC_LOCKS[doc_key] = {
            "locked": True,
            "locked_by": user_id,
            "locked_at": datetime.utcnow()
        }

        # ------------------------------
        # 🔁 GET SHEET ROWS
        # ------------------------------
        rows = await run_in_threadpool(
            get_all_rows_with_no,
            spreadsheet_id,
            sheet_index
        )

        api_response = {
            "success": True,
            "count": len(rows),
            "data": rows
        }

        # ------------------------------
        # 🔁 UPDATE GROUPED TABLES IN SLIDES
        # ------------------------------
        grouped_updates = await run_in_threadpool(build_slide_table_updates_grouped_by_no, api_response)
        if grouped_updates:
            await run_in_threadpool(overwrite_grouped_tables, grouped_updates, presentation_id)

        # ------------------------------
        # 🔁 UPDATE TEXTBOXES IN SLIDES
        # ------------------------------
        textbox_response = await run_in_threadpool(read_textboxes_grouped_by_slide,presentation_id)
        textbox_updates = await run_in_threadpool(build_slide_textbox_updates,rows, textbox_response)
        if textbox_updates:
            await run_in_threadpool(overwrite_textboxes,presentation_id, textbox_updates)

        return {
            "success": True,
            "message": "Inspection Plan inserted successfully",
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # ------------------------------
        # 🔓 RELEASE LOCK
        # ------------------------------
        lock = DOC_LOCKS.get(doc_key)
        if lock and lock["locked_by"] == user_id:
            DOC_LOCKS.pop(doc_key)