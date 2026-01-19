import io
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.http import MediaIoBaseUpload
import os
import traceback

# ------------------- CONFIG -------------------
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
SCOPES = ["https://www.googleapis.com/auth/drive"]

TEMPLATES_FOLDER_ID = "1VcWHP-CUd7yUnBi1Np-3XCTGMX1tUal0"
TASKS_FOLDER_ID = "1eafvfAg0c8MSUedZio8OYDI2HeqtCEYE"
EXCEL_TEMPLATE_ID = '1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE'
EXCEL_TEMPLATE_FOLDER_ID = "1E5oAOY29sE5t5fOf8hXK3kBrI_qsO09z"
PPTX_TEMPLATE_FOLDER_ID = "1wY4dhgIHVqoptMtmHjbMo5Nq6cykpP4X"

# ------------------- HELPERS -------------------
def get_drive_service():
    # Validate environment variables
    if not all([CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]):
        raise ValueError("CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN must be set!")

    # Create credentials object
    creds = Credentials(
        token=None,
        refresh_token=REFRESH_TOKEN,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES
    )

    try:
        # Force refresh token to ensure valid access token
        creds.refresh(Request())
    except Exception as e:
        print("Failed to refresh access token:")
        traceback.print_exc()
        raise e

    return build("drive", "v3", credentials=creds)

def create_task_in_folder(folder_name, created_by_email, members=None):
    try:
        drive_service = get_drive_service()

        # Check if folder already exists
        existing_folders = task_exists(drive_service, folder_name)
        if existing_folders:
            return {
                'success': False,
                'message': f"Task '{folder_name}' already exists."
            }

        # Create the folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [TASKS_FOLDER_ID]
        }

        folder = drive_service.files().create(
            body=folder_metadata,
            fields='id, name'
        ).execute()

        folder_id = folder.get('id')

        # Add permissions for creator and members
        emails_to_share = [created_by_email]
        if members:
            emails_to_share.extend(members)
        
        # Remove duplicates
        emails_to_share = list(set(emails_to_share))

        # Share folder with each email
        for email in emails_to_share:
            try:
                permission = {
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': email
                }
                drive_service.permissions().create(
                    fileId=folder_id,
                    body=permission,
                    fields='id',
                    sendNotificationEmail=False  # Set to True if you want to notify users
                ).execute()
            except Exception as perm_error:
                print(f"Warning: Could not share with {email}: {str(perm_error)}")

        return {
            'success': True,
            'folder_id': folder_id,
            'folder': folder,
            'message': f"Folder '{folder_name}' created successfully and shared with {len(emails_to_share)} user(s)."
        }

    except Exception as e:
        traceback.print_exc()
        return {
            'success': False,
            'message': str(e)
        }

    
def task_exists(service, name):
    query = (
        f"name='{name}' and "
        f"mimeType='application/vnd.google-apps.folder' and "
        f"'{TASKS_FOLDER_ID}' in parents and "
        f"trashed=false"
    )

    results = service.files().list(
        q=query,
        fields="files(id, name)"
    ).execute()

    return results.get("files", [])


def copy_google_sheet(task_name,parent_folder_id,excel_template_id):
    """
    Make an exact copy of a Google Sheet and keep the original sheet name.
    Optionally place it inside a specific folder.
    Returns the new sheet ID and name.
    """
    try:
        drive_service = get_drive_service()

        # 1️⃣ Get original sheet name
        original_file = drive_service.files().get(
            fileId=excel_template_id,
            fields="name"
        ).execute()
        
        original_name = original_file["name"]

        safe_task_name = task_name.replace("/", "-").strip()
        new_name = f"{original_name}_{safe_task_name}"

        # 2️⃣ Copy the sheet using the same name
        file_metadata = {"name": new_name}
        if parent_folder_id:
            file_metadata["parents"] = [parent_folder_id]

        new_file = drive_service.files().copy(
            fileId=excel_template_id,
            body=file_metadata,
            fields="id, name"
        ).execute()

        return {
            "success": True,
            "sheet_id": new_file["id"],
            "sheet_name": new_file["name"],
            "message": f"Sheet copied successfully with name '{new_file['name']}'"
        }

    except Exception as e:
        print("Error copying Google Sheet:")
        traceback.print_exc()
        return {"success": False, "message": str(e)}

def copy_google_slide(task_name,parent_folder_id, slide_template_id):
    """
    Make an exact copy of a Google Slides file and keep the original name.
    Optionally place it inside a specific folder.
    Returns the new slide ID and name.
    """
    try:
        drive_service = get_drive_service()

        # 1️⃣ Get original slide name
        original_file = drive_service.files().get(
            fileId=slide_template_id,
            fields="name"
        ).execute()

        safe_task_name = task_name.replace("/", "-").strip()
        new_name = f"InspectionPlan_{safe_task_name}"

        # 2️⃣ Copy the slide using the same name
        file_metadata = {"name": new_name}
        if parent_folder_id:
            file_metadata["parents"] = [parent_folder_id]

        new_file = drive_service.files().copy(
            fileId=slide_template_id,
            body=file_metadata,
            fields="id, name"
        ).execute()

        return {
            "success": True,
            "slide_id": new_file["id"],
            "slide_name": new_file["name"],
            "message": f"Slide copied successfully with name '{new_file['name']}'"
        }

    except Exception as e:
        print("Error copying Google Slide:")
        traceback.print_exc()
        return {"success": False, "message": str(e)}

def list_templates():
    """
    Retrieve all templates from separate Excel and PPTX folders.
    Returns a dictionary with Excel and Inspection Plan templates separately.
    """
    try:
        drive_service = get_drive_service()

        # ---------------- Excel Templates ----------------
        excel_query = f"'{EXCEL_TEMPLATE_FOLDER_ID}' in parents and trashed=false"
        excel_results = drive_service.files().list(
            q=excel_query,
            fields="files(id, name, mimeType, createdTime, webViewLink)",
            pageSize=100
        ).execute()

        excel_files = excel_results.get("files", [])
        excel_templates = []

        for f in excel_files:
            excel_templates.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": f["mimeType"],
                "createdAt": f.get("createdTime"),
                "url": f.get("webViewLink"),
                "downloadUrl": f"https://docs.google.com/spreadsheets/d/{f['id']}/export?format=xlsx"
            })

        # ---------------- Inspection Plan Templates ----------------
        pptx_query = f"'{PPTX_TEMPLATE_FOLDER_ID}' in parents and trashed=false"
        pptx_results = drive_service.files().list(
            q=pptx_query,
            fields="files(id, name, mimeType, createdTime, webViewLink)",
            pageSize=100
        ).execute()

        pptx_files = pptx_results.get("files", [])
        inspection_templates = []

        for f in pptx_files:
            inspection_templates.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": f["mimeType"],
                "createdAt": f.get("createdTime"),
                "url": f.get("webViewLink"),
                "downloadUrl": f"https://docs.google.com/presentation/d/{f['id']}/export/pptx"
            })

        return {
            "success": True,
            "excelTemplates": excel_templates,
            "inspectionTemplates": inspection_templates
        }

    except Exception as e:
        print("Error retrieving templates:")
        traceback.print_exc()
        return {"success": False, "message": str(e)}

def create_empty_template(name: str, template_type: str):
    """
    Create a new empty Google Sheet or Google Slides file in Drive.
    """
    try:
        drive_service = get_drive_service()

        # Determine MIME type
        if template_type == "excel":
            parent_id = EXCEL_TEMPLATE_FOLDER_ID
            mime_type = "application/vnd.google-apps.spreadsheet"
        elif template_type == "inspection":
            parent_id = PPTX_TEMPLATE_FOLDER_ID
            mime_type = "application/vnd.google-apps.presentation"
        else:
            return {"success": False, "message": "Invalid template type"}

        # Prepare metadata
        file_metadata = {"name": name, "mimeType": mime_type}
        if parent_id:
            file_metadata["parents"] = [parent_id]

        # Create the file
        new_file = drive_service.files().create(
            body=file_metadata,
            fields="id, name, mimeType, webViewLink"
        ).execute()

        # 🔑 IMPORTANT: Make file public (view-only)
        drive_service.permissions().create(
            fileId=new_file["id"],
            body={
                "type": "anyone",
                "role": "reader"
            }
        ).execute()

        # Generate download link
        download_url = ""
        if template_type == "excel":
            download_url = f"https://docs.google.com/spreadsheets/d/{new_file['id']}/export?format=xlsx"
        elif template_type == "inspection":
            download_url = f"https://docs.google.com/presentation/d/{new_file['id']}/export/pptx"

        return {
            "success": True,
            "id": new_file["id"],
            "name": new_file["name"],
            "mimeType": new_file["mimeType"],
            "url": new_file["webViewLink"],
            "downloadUrl": download_url
        }

    except Exception as e:
        print("Error creating empty template:")
        traceback.print_exc()
        return {"success": False, "message": str(e)}



def check_pdf_exists_in_folder(task_folder_id: str, filename: str):
    """
    Check if a PDF with the given filename already exists in the task folder.
    
    Args:
        task_folder_id: The Google Drive folder ID for the task
        filename: Name of the PDF file to check
    
    Returns:
        dict with exists (bool) and file_id (if exists)
    """
    try:
        drive_service = get_drive_service()

        # Query for PDF with exact filename in the task folder
        query = (
            f"name='{filename}' and "
            f"'{task_folder_id}' in parents and "
            f"mimeType='application/pdf' and "
            f"trashed=false"
        )
        
        results = drive_service.files().list(
            q=query,
            fields="files(id, name)",
            pageSize=1
        ).execute()

        files = results.get("files", [])
        
        if files:
            return {
                "exists": True,
                "file_id": files[0]["id"],
                "file_name": files[0]["name"]
            }
        
        return {"exists": False}

    except Exception as e:
        print(f"Error checking if PDF exists:")
        traceback.print_exc()
        return {"exists": False}


def upload_pdf_to_task_folder(task_folder_id: str, pdf_file, filename: str):
    """
    Upload a PDF file to a specific task folder in Google Drive.
    Prevents duplicate uploads by checking if filename already exists.
    
    Args:
        task_folder_id: The Google Drive folder ID for the task
        pdf_file: File object (from Flask request.files)
        filename: Name of the PDF file
    
    Returns:
        dict with success status, file_id, file_name, and url
    """
    try:
        # Check if PDF already exists
        existing_check = check_pdf_exists_in_folder(task_folder_id, filename)
        
        if existing_check.get("exists"):
            return {
                "success": False,
                "message": f"A PDF named '{filename}' already exists in this task folder",
                "error_code": "DUPLICATE_FILE"
            }

        drive_service = get_drive_service()

        # Prepare file metadata
        file_metadata = {
            'name': filename,
            'parents': [task_folder_id],
            'mimeType': 'application/pdf'
        }

        # Read file content into BytesIO
        file_content = io.BytesIO(pdf_file.read())
        
        # Create media upload
        media = MediaIoBaseUpload(
            file_content,
            mimetype='application/pdf',
            resumable=True
        )

        # Upload the file
        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink, thumbnailLink, createdTime'
        ).execute()

        # Convert webViewLink to embeddable preview URL
        file_id = uploaded_file["id"]
        preview_url = f"https://drive.google.com/file/d/{file_id}/preview"

        return {
            "success": True,
            "file_id": uploaded_file["id"],
            "file_name": uploaded_file["name"],
            "url": preview_url,  # Use preview URL instead of webViewLink
            "thumbnail": uploaded_file.get("thumbnailLink"),
            "created_at": uploaded_file.get("createdTime"),
            "message": f"PDF '{filename}' uploaded successfully"
        }

    except Exception as e:
        print(f"Error uploading PDF to task folder:")
        traceback.print_exc()
        return {
            "success": False,
            "message": str(e)
        }



def list_pdfs_in_task_folder(task_folder_id: str):
    """
    List all PDF files in a specific task folder.
    
    Args:
        task_folder_id: The Google Drive folder ID for the task
    
    Returns:
        dict with success status and list of PDFs
    """
    try:
        drive_service = get_drive_service()

        # Query for PDFs in the task folder
        query = f"'{task_folder_id}' in parents and mimeType='application/pdf' and trashed=false"
        
        results = drive_service.files().list(
            q=query,
            fields="files(id, name, webViewLink, thumbnailLink, createdTime, size)",
            orderBy="createdTime desc"
        ).execute()

        pdf_files = results.get("files", [])
        
        pdfs = []
        for pdf in pdf_files:
            # Convert to embeddable preview URL
            file_id = pdf["id"]
            preview_url = f"https://drive.google.com/file/d/{file_id}/preview"
            
            pdfs.append({
                "file_id": pdf["id"],
                "file_name": pdf["name"],
                "url": preview_url,  # Use preview URL instead of webViewLink
                "thumbnail": pdf.get("thumbnailLink"),
                "created_at": pdf.get("createdTime"),
                "size": pdf.get("size")
            })

        return {
            "success": True,
            "pdfs": pdfs,
            "count": len(pdfs)
        }

    except Exception as e:
        print(f"Error listing PDFs in task folder:")
        traceback.print_exc()
        return {
            "success": False,
            "message": str(e),
            "pdfs": []
        }


def delete_pdf_from_drive(file_id: str):
    """
    Delete a PDF file from Google Drive.
    
    Args:
        file_id: The Google Drive file ID to delete
    
    Returns:
        dict with success status and message
    """
    try:
        drive_service = get_drive_service()
        
        # Delete the file
        drive_service.files().delete(fileId=file_id).execute()
        
        return {
            "success": True,
            "message": f"File with ID '{file_id}' deleted successfully from Google Drive"
        }
    
    except Exception as e:
        print(f"Error deleting file from Google Drive:")
        traceback.print_exc()
        return {
            "success": False,
            "message": str(e)
        }