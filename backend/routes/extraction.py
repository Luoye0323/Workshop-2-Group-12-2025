from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.sheet_service import format_rows_with_pdf, get_rows_by_equipment
from services.firebase_service import verify_token, update_pdf_metadata, get_pdf_metadata
from services.drive_service import get_drive_service
from services.extraction_service import extract_data_from_pdf
import traceback
from datetime import datetime, timedelta
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

LOCK_TIMEOUT = timedelta(minutes=10)
DOC_LOCKS = {}  # Key: sheet_id, Value: lock info dict
EXTRACTION_LOCKS = {}  # Key: task_id:file_id, Value: lock info dict

# Pydantic Models
class ExtractSinglePDFRequest(BaseModel):
    sheet_id: str


class ExtractMultiplePDFsRequest(BaseModel):
    file_ids: List[str]
    sheet_id: str


class InsertToSheetRequest(BaseModel):
    file_ids: List[str]
    sheet_id: str


# Dependency for authentication
async def get_current_user(user_info: dict = Depends(verify_token)):
    """Verify user token and return user info"""
    if not user_info:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_info


def download_pdf_from_drive(file_id: str) -> Dict[str, Any]:
    """Download PDF file from Google Drive"""
    try:
        drive_service = get_drive_service()
        
        # Download file content
        request = drive_service.files().get_media(fileId=file_id)
        
        # Get file as bytes
        file_bytes = request.execute()
        
        return {
            "success": True,
            "bytes": file_bytes
        }
    
    except Exception as e:
        print(f"Error downloading PDF from Drive:")
        traceback.print_exc()
        return {
            "success": False,
            "message": str(e)
        }


def get_equipment_no_from_filename(filename: str) -> str:
    """
    Extract equipment_no from PDF file name.
    - Remove extension
    - Take last 5 characters
    """
    if not filename:
        return ""
    name_without_ext = filename.rsplit(".", 1)[0]
    return name_without_ext[-5:]


def acquire_extraction_lock(task_id: str, file_id: str, user_id: str) -> None:
    """Acquire lock for PDF extraction. Raises HTTPException if locked."""
    lock_key = f"{task_id}:{file_id}"
    
    lock = EXTRACTION_LOCKS.get(lock_key)
    if lock:
        # Auto-unlock if timed out
        if datetime.utcnow() - lock["locked_at"] > LOCK_TIMEOUT:
            EXTRACTION_LOCKS.pop(lock_key)
        else:
            raise HTTPException(
                status_code=423,
                detail=f"PDF extraction already in progress by a user"
            )
    
    # Acquire lock
    EXTRACTION_LOCKS[lock_key] = {
        "locked": True,
        "locked_by": user_id,
        "locked_at": datetime.utcnow()
    }


def release_extraction_lock(task_id: str, file_id: str, user_id: str) -> None:
    """Release extraction lock for the given task and file."""
    lock_key = f"{task_id}:{file_id}"
    lock = EXTRACTION_LOCKS.get(lock_key)
    if lock and lock["locked_by"] == user_id:
        EXTRACTION_LOCKS.pop(lock_key)


# -------------------- EXTRACT SINGLE PDF --------------------
@router.post("/extract_pdf/{task_id}/{file_id}")
async def extract_single_pdf_route(
    task_id: str,
    file_id: str,
    request_data: ExtractSinglePDFRequest,
    user_info: dict = Depends(get_current_user)
):
    """
    Extract a single PDF, merge with Google Sheet rows, and store merged data.
    Request body: { "sheet_id": "1cftK61Y..." }
    """
    user_id = user_info.get("uid") or user_info.get("email")
    
    try:
        # 🔒 ACQUIRE EXTRACTION LOCK
        acquire_extraction_lock(task_id, file_id, user_id)
        
        sheet_id = request_data.sheet_id

        # Get PDF metadata
        pdf_metadata = get_pdf_metadata(task_id, file_id)
        if not pdf_metadata:
            raise HTTPException(status_code=404, detail="PDF not found")

        file_name = pdf_metadata.get("fileName", "")
        equipment_no = get_equipment_no_from_filename(file_name)
        if not equipment_no:
            raise HTTPException(status_code=400, detail="equipment_no not found in PDF data")

        # Use sheet_id from request
        sheet_rows = get_rows_by_equipment(sheet_id, equipment_no)
        if not sheet_rows:
            raise HTTPException(
                status_code=404,
                detail=f"No sheet data found for equipment '{equipment_no}'"
            )

        # Extract parts list
        parts_needed = []
        has_tube_or_channel = False
        for row in sheet_rows:
            part = row.get("PARTS", "").strip()
            if part and part not in parts_needed:
                parts_needed.append(part)
                if "tube" in part.lower() or "channel" in part.lower():
                    has_tube_or_channel = True

        # Download PDF from Drive
        download_result = await run_in_threadpool(download_pdf_from_drive, file_id)
        if not download_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download PDF: {download_result['message']}"
            )

        # Extract data with customized prompt
        extraction_result = await run_in_threadpool(
            extract_data_from_pdf,
            download_result["bytes"],
            True,  # use_preprocessing
            parts_needed,
            has_tube_or_channel
        )
        
        if not extraction_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Extraction failed: {extraction_result.get('message')}"
            )

        pdf_data = extraction_result["data"]

        # Merge with Google Sheet
        merged_data = await run_in_threadpool(format_rows_with_pdf, sheet_rows, pdf_data)

        # Store in Firestore
        update_pdf_metadata(task_id, file_id, {
            "status": "extracted",
            "extractedData": merged_data
        })

        return {
            "message": "Extraction and merge successful",
            "fileId": file_id,
            "fileName": pdf_metadata.get("fileName"),
            "extractedData": merged_data
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in extract_single_pdf_and_merge: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    
    finally:
        # 🔓 RELEASE EXTRACTION LOCK
        release_extraction_lock(task_id, file_id, user_id)


# -------------------- EXTRACT MULTIPLE PDFs --------------------
@router.post("/extract_multiple/{task_id}")
async def extract_multiple_pdfs_route(
    task_id: str,
    request_data: ExtractMultiplePDFsRequest,
    user_info: dict = Depends(get_current_user)
):
    """
    Extract multiple PDFs, merge with Google Sheet rows, and store merged data.
    Request body: { "file_ids": ["file_id1", "file_id2", ...], "sheet_id": "1cftK61Y..." }
    """
    user_id = user_info.get("uid") or user_info.get("email")
    
    try:
        file_ids = request_data.file_ids
        sheet_id = request_data.sheet_id
        
        if not file_ids:
            raise HTTPException(status_code=400, detail="No file IDs provided")

        results_summary = []
        successful_count = 0

        for file_id in file_ids:
            # 🔒 TRY TO ACQUIRE LOCK FOR THIS FILE
            try:
                acquire_extraction_lock(task_id, file_id, user_id)
            except HTTPException as lock_error:
                results_summary.append({
                    "file_id": file_id,
                    "file_name": "",
                    "extraction_result": {
                        "success": False,
                        "message": f"Lock error: {lock_error.detail}"
                    }
                })
                continue
            
            try:
                pdf_metadata = get_pdf_metadata(task_id, file_id)
                if not pdf_metadata:
                    results_summary.append({
                        "file_id": file_id,
                        "file_name": "",
                        "extraction_result": {
                            "success": False,
                            "message": "PDF not found in database"
                        }
                    })
                    continue

                # Download PDF
                download_result = download_pdf_from_drive(file_id)
                if not download_result.get("success"):
                    results_summary.append({
                        "file_id": file_id,
                        "file_name": pdf_metadata.get("fileName", ""),
                        "extraction_result": {
                            "success": False,
                            "message": f"Failed to download PDF: {download_result.get('message')}"
                        }
                    })
                    continue

                # Get equipment_no from file name
                file_name = pdf_metadata.get("fileName", "")
                equipment_no = get_equipment_no_from_filename(file_name)

                # Use sheet_id from request
                sheet_rows = get_rows_by_equipment(sheet_id, equipment_no)
                if not sheet_rows:
                    results_summary.append({
                        "file_id": file_id,
                        "file_name": pdf_metadata.get("fileName", ""),
                        "extraction_result": {
                            "success": False,
                            "message": f"No sheet data found for equipment '{equipment_no}'"
                        }
                    })
                    continue

                # Extract parts list
                parts_needed = []
                has_tube_or_channel = False
                for row in sheet_rows:
                    part = row.get("PARTS", "").strip()
                    if part and part not in parts_needed:
                        parts_needed.append(part)
                        if "tube" in part.lower() or "channel" in part.lower():
                            has_tube_or_channel = True

                # Extract data with customized prompt
                extraction_result = extract_data_from_pdf(
                    download_result["bytes"], 
                    use_preprocessing=True,
                    parts_list=parts_needed,
                    has_shell_tube=has_tube_or_channel
                )
                
                if not extraction_result or not extraction_result.get("success"):
                    results_summary.append({
                        "file_id": file_id,
                        "file_name": pdf_metadata.get("fileName", ""),
                        "extraction_result": {
                            "success": False,
                            "message": extraction_result.get("message", "Extraction failed")
                        }
                    })
                    continue

                pdf_data = extraction_result.get("data", {})

                # Merge PDF data with sheet rows
                merged_data = format_rows_with_pdf(sheet_rows, pdf_data)

                # Store merged data in Firestore
                update_pdf_metadata(task_id, file_id, {
                    "status": "extracted",
                    "extractedData": merged_data
                })

                results_summary.append({
                    "file_id": file_id,
                    "file_name": pdf_metadata.get("fileName", ""),
                    "extraction_result": {
                        "success": True,
                        "data": merged_data
                    }
                })
                successful_count += 1
                
            finally:
                # 🔓 RELEASE LOCK FOR THIS FILE
                release_extraction_lock(task_id, file_id, user_id)

        return {
            "message": f"Extraction and merge completed for {successful_count}/{len(file_ids)} PDFs",
            "results": results_summary,
            "summary": {
                "total": len(file_ids),
                "successful": successful_count,
                "failed": len(file_ids) - successful_count
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in extract_multiple_pdfs_route: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# -------------------- GET EXTRACTION RESULT --------------------
@router.get("/get_extraction/{task_id}/{file_id}")
async def get_extraction_result(
    task_id: str,
    file_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Get extraction result for a specific PDF."""
    try:
        # Get PDF metadata from Firestore
        pdf_metadata = get_pdf_metadata(task_id, file_id)
        
        if not pdf_metadata:
            raise HTTPException(status_code=404, detail="PDF not found")

        extracted_data = pdf_metadata.get("extractedData")
        
        if not extracted_data:
            return {
                "message": "No extraction data available",
                "status": pdf_metadata.get("status", "pending")
            }

        return {
            "fileId": file_id,
            "fileName": pdf_metadata.get("fileName"),
            "status": pdf_metadata.get("status"),
            "extractedData": extracted_data,
            "updatedAt": pdf_metadata.get("updatedAt")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_extraction_result:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# -------------------- EXTRACT PDF ONLY --------------------
@router.post("/extract_pdfs/{task_id}/{file_id}")
async def extract_pdf_only(
    task_id: str,
    file_id: str,
    request_data: ExtractSinglePDFRequest,
    user_info: dict = Depends(get_current_user)
):
    """
    Extract a single PDF without merging, and store extracted data.
    Request body: { "sheet_id": "1cftK61Y..." }
    """
    user_id = user_info.get("uid") or user_info.get("email")
    
    try:
        # 🔒 ACQUIRE EXTRACTION LOCK
        acquire_extraction_lock(task_id, file_id, user_id)
        
        sheet_id = request_data.sheet_id

        # Get PDF metadata
        pdf_metadata = get_pdf_metadata(task_id, file_id)
        if not pdf_metadata:
            raise HTTPException(status_code=404, detail="PDF not found")

        file_name = pdf_metadata.get("fileName", "")
        equipment_no = get_equipment_no_from_filename(file_name)
        if not equipment_no:
            raise HTTPException(status_code=400, detail="equipment_no not found in PDF data")

        # Use sheet_id from request
        sheet_rows = get_rows_by_equipment(sheet_id, equipment_no)
        if not sheet_rows:
            raise HTTPException(
                status_code=404,
                detail=f"No sheet data found for equipment '{equipment_no}'"
            )

        # Extract parts list
        parts_needed = []
        has_tube_or_channel = False
        for row in sheet_rows:
            part = row.get("PARTS", "").strip()
            if part and part not in parts_needed:
                parts_needed.append(part)
                if "tube" in part.lower() or "channel" in part.lower():
                    has_tube_or_channel = True

        # Download PDF from Drive
        download_result = download_pdf_from_drive(file_id)
        if not download_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download PDF: {download_result['message']}"
            )

        # Extract data with customized prompt
        extraction_result = extract_data_from_pdf(
            download_result["bytes"], 
            use_preprocessing=True,
            parts_list=parts_needed,
            has_shell_tube=has_tube_or_channel
        )
        
        if not extraction_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Extraction failed: {extraction_result.get('message')}"
            )

        pdf_data = extraction_result["data"]

        # Store in Firestore
        update_pdf_metadata(task_id, file_id, {
            "status": "extracted",
            "extractedData": pdf_data
        })

        return {
            "message": "Extraction successful",
            "fileId": file_id,
            "fileName": pdf_metadata.get("fileName"),
            "extractedData": pdf_data
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in extract_pdf_only: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    
    finally:
        # 🔓 RELEASE EXTRACTION LOCK
        release_extraction_lock(task_id, file_id, user_id)


# -------------------- INSERT TO SHEET --------------------
@router.post("/insert_to_sheet/{task_id}")
async def insert_to_sheet_route(
    task_id: str,
    request_data: InsertToSheetRequest,
    user_info: dict = Depends(get_current_user)
):
    """Insert extracted data back to Google Sheet with critical session lock."""
    user_id = user_info.get("uid") or user_info.get("email")
    sheet_id = request_data.sheet_id
    doc_key = sheet_id  # Lock per sheet

    try:
        # ------------------------------
        # 🔐 CHECK LOCK
        # ------------------------------
        lock = DOC_LOCKS.get(doc_key)
        if lock:
            # auto-unlock if timed out
            if datetime.utcnow() - lock["locked_at"] > LOCK_TIMEOUT:
                DOC_LOCKS.pop(doc_key)
            else:
                raise HTTPException(
                    status_code=423,
                    detail=f"Sheet is currently being updated by a user"
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
        # 🔁 YOUR EXISTING LOGIC
        # ------------------------------
        file_ids = request_data.file_ids
        
        if not file_ids or not sheet_id:
            raise HTTPException(status_code=400, detail="file_ids and sheet_id required")

        # Collect all merged data

        all_merged_data = [] 
        for file_id in file_ids: 
            pdf_metadata = await run_in_threadpool(get_pdf_metadata,task_id, file_id) 
            if pdf_metadata and pdf_metadata.get("extractedData"): 
                all_merged_data.extend(pdf_metadata["extractedData"])
                 

        if not all_merged_data:
            raise HTTPException(status_code=400, detail="No extracted data found")
        
        from services.sheet_service import prepare_sheet_update_data, execute_sheet_batch_update
        
        prep_result = await run_in_threadpool(prepare_sheet_update_data, sheet_id, all_merged_data)
        if not prep_result["success"]:
            raise HTTPException(status_code=500, detail=prep_result["message"])
        
        exec_result = await run_in_threadpool(execute_sheet_batch_update, sheet_id, prep_result["batch_data"])
        
        if exec_result["success"]:
            # UPDATE FIRESTORE STATUS
            for file_id in file_ids:
                try:
                    update_pdf_metadata(task_id, file_id, {"status": "completed"})
                except Exception as e:
                    print(f"✗ Failed to update status for {file_id}: {e}")
            
            return {
                "message": f"Updated {prep_result['rows_to_update']} rows",
                "rows_updated": prep_result["rows_to_update"],
                "cells_updated": exec_result.get("updated_cells", 0)
            }
        else:
            raise HTTPException(status_code=500, detail=exec_result["message"])

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    finally:
        # ------------------------------
        # 🔓 RELEASE LOCK
        # ------------------------------
        lock = DOC_LOCKS.get(doc_key)
        if lock and lock["locked_by"] == user_id:
            DOC_LOCKS.pop(doc_key)