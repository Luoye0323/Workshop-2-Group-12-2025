import os
import io
import traceback
from dotenv import load_dotenv 
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


# ===============================================================================
# CONFIGURATION - EDIT THESE VALUES
# ===============================================================================

load_dotenv()
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
SCOPES = [
    "https://www.googleapis.com/auth/presentations"
]

# >>> EDIT: Component to Row mapping (adjust row numbers if needed)
COMPONENT_ROW_MAPPING = {
    'Top Head': 2,
    'Shell': 3,
    'Bottom Head': 4,
    'Top Channel': 2,
    'Bottom Channel': 4,
    'Channel': 2,
    'Head': 2
}

# >>> EDIT: Column mapping (adjust column indices if needed)
COLUMN_MAPPING = {
    'FLUID': 0,
    'SPEC': 4,
    'GR': 5,
    'INSULATED': 6,
    'T': 7,
    'P': 8
}

# >>> EDIT: Field mappings from Google Sheets to Slides
# Left side = Your Google Sheet header names
# Right side = Slide column names (from COLUMN_MAPPING above)
FIELD_MAPPINGS = {
    'FLUID': 'FLUID',
    'MATERIAL INFORMATION SPEC.': 'SPEC',
    'MATERIAL INFORMATION GRADE': 'GR',
    'INSULATION (yes/No)': 'INSULATED',
    'OPERATING TEMP.  (°C)': 'T',
    'OPERATING PRESSURE (Mpa)': 'P',
}



def build_slide_table_updates(api_response):
    updates = []

    for row in api_response["data"]:
        part = row.get("PARTS")

        # Skip components not in mapping
        if part not in COMPONENT_ROW_MAPPING:
            continue

        slide_row = COMPONENT_ROW_MAPPING[part]

        for sheet_header, slide_col_key in FIELD_MAPPINGS.items():
            slide_col = COLUMN_MAPPING[slide_col_key]

            value = row.get(sheet_header, "")

            updates.append({
                "row": slide_row,
                "col": slide_col,
                "value": value
            })

    return updates


from collections import defaultdict

def build_slide_table_updates_grouped_by_no(api_response):
    grouped_updates = defaultdict(list)

    for row in api_response["data"]:
        # Only include rows with numeric NO
        no_value = row.get("NO.", "").strip()
        if not no_value or not no_value.isdigit():
            continue

        part = row.get("PARTS")
        if part not in COMPONENT_ROW_MAPPING:
            continue

        slide_row = COMPONENT_ROW_MAPPING[part]

        for sheet_header, slide_col_key in FIELD_MAPPINGS.items():
            slide_col = COLUMN_MAPPING[slide_col_key]
            value = row.get(sheet_header, "")

            # ✅ Only include non-empty values
            if value and str(value).strip():
                grouped_updates[no_value].append({
                    "row": slide_row,
                    "col": slide_col,
                    "value": value
                })

    return grouped_updates


# ===============================================================================
# AUTHENTICATION & SERVICE FUNCTIONS
# ===============================================================================

def get_slide_service():
    """Get Google Slides API service."""
    if not all([CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN]):
        raise ValueError("OAuth environment variables missing")

    creds = Credentials(
        token=None,
        refresh_token=REFRESH_TOKEN,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES
    )

    try:
        creds.refresh(Request())
    except Exception:
        traceback.print_exc()
        raise

    return build("slides", "v1", credentials=creds)

def overwrite_table_cells(table_id, updates, slide_id):
    service = get_slide_service()
    if not updates:
        print("No data to overwrite.")
        return

    # First, get the current table object
    presentation = service.presentations().get(presentationId=slide_id).execute()
    table_obj = None
    for page in presentation.get("slides", []):
        for element in page.get("pageElements", []):
            if element.get("objectId") == table_id and "table" in element:
                table_obj = element["table"]
                break
    if not table_obj:
        print(f"Table {table_id} not found in slide.")
        return

    requests = []

    for cell in updates:
        cell_location = {"rowIndex": cell["row"], "columnIndex": cell["col"]}
        value = cell["value"]

        # Safely get existing text
        existing_text = ""
        try:
            table_cell = table_obj["tableRows"][cell["row"]]["tableCells"][cell["col"]]
            if "text" in table_cell:
                for te in table_cell["text"].get("textElements", []):
                    if "textRun" in te:
                        existing_text += te["textRun"].get("content", "")
        except IndexError:
            continue  # Skip if cell indices are out of range

        # Delete existing text if present
        if existing_text.strip():
            requests.append({
                "deleteText": {
                    "objectId": table_id,
                    "cellLocation": cell_location,
                    "textRange": {"type": "ALL"}
                }
            })

        # Insert new value if provided
        if value:
            requests.append({
                "insertText": {
                    "objectId": table_id,
                    "cellLocation": cell_location,
                    "text": value
                }
            })

            # Apply style
            requests.append({
                "updateTextStyle": {
                    "objectId": table_id,
                    "cellLocation": cell_location,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "fontFamily": "Arial",
                        "fontSize": {"magnitude": 8, "unit": "PT"},
                        "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0, "green": 0, "blue": 0}}}
                    },
                    "fields": "fontFamily,fontSize,foregroundColor"
                }
            })

            # Center-align
            requests.append({
                "updateParagraphStyle": {
                    "objectId": table_id,
                    "cellLocation": cell_location,
                    "textRange": {"type": "ALL"},
                    "style": {"alignment": "CENTER"},
                    "fields": "alignment"
                }
            })

    if not requests:
        print("No valid data to insert.")
        return

    try:
        response = service.presentations().batchUpdate(
            presentationId=slide_id,
            body={"requests": requests}
        ).execute()
        print(f"Inserted/Updated {len(updates)} cells in table {table_id}")
        return response
    except Exception:
        traceback.print_exc()
        raise




def read_textboxes_from_slide(presentation_id, slide_id):
    """
    Read all textboxes from a specific slide in a presentation using slide object ID.

    Args:
        presentation_id (str): Google Slides presentation ID.
        slide_id (str): Object ID of the slide to read.

    Returns:
        list of dicts: Each dict contains slide_id, object_id, and text content.
    """
    service = get_slide_service()
    textboxes = []

    presentation = service.presentations().get(presentationId=presentation_id).execute()
    slides = presentation.get("slides", [])

    # Find the slide with the given object ID
    slide = next((s for s in slides if s["objectId"] == slide_id), None)
    if not slide:
        raise ValueError(f"Slide with object ID '{slide_id}' not found")

    for element in slide.get("pageElements", []):
        if "shape" in element:
            text_content = ""
            text_info = element["shape"].get("text", {})
            for te in text_info.get("textElements", []):
                if "textRun" in te:
                    text_content += te["textRun"].get("content", "")
            textboxes.append({
                "slide_id": slide_id,
                "object_id": element["objectId"],
                "text": text_content.strip()
            })

    return textboxes

def build_slide_textbox_updates_from_first_row(data_rows, textbox_ids):
    """
    Updates three textboxes with data from the first row.
    """
    if not data_rows or not textbox_ids or len(textbox_ids) != 3:
        return []

    row = data_rows[0]
    values = [
        row.get("EQUIPMENT DESCRIPTION", ""),
        row.get("EQUIPMENT NO.", ""),
        row.get("PMT NO.", "")
    ]

    requests = []

    for obj_id, value in zip(textbox_ids, values):
        if value:
            requests.append({
                "insertText": {"objectId": obj_id, "text": value}
            })
            requests.append({
                "updateTextStyle": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "fontFamily": "Arial",
                        "fontSize": {"magnitude": 10, "unit": "PT"},
                        "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0, "green": 0, "blue": 0}}}
                    },
                    "fields": "fontFamily,fontSize,foregroundColor"
                }
            })
            requests.append({
                "updateParagraphStyle": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"},
                    "style": {"alignment": "CENTER"},
                    "fields": "alignment"
                }
            })

    return requests

def overwrite_textboxes(presentation_id, updates):
    """
    Updates textboxes in a Google Slides presentation.
    Clears existing text first, then inserts new text and applies styles.

    Args:
        presentation_id (str): The presentation's ID.
        updates (list): List of requests including insertText, updateTextStyle, updateParagraphStyle.
    """
    service = get_slide_service()
    if not updates:
        print("No textboxes to update")
        return

    # Get current presentation
    presentation = service.presentations().get(presentationId=presentation_id).execute()

    smart_requests = []

    for req in updates:
        # Only handle insertText here
        if "insertText" not in req:
            continue

        obj_id = req["insertText"].get("objectId")
        text_to_insert = req["insertText"].get("text", "")
        if not obj_id or not text_to_insert:
            continue

        # Find the textbox element
        textbox_obj = None
        for slide in presentation.get("slides", []):
            for element in slide.get("pageElements", []):
                if element.get("objectId") == obj_id and "shape" in element:
                    textbox_obj = element["shape"]
                    break
            if textbox_obj:
                break

        if not textbox_obj:
            print(f"Textbox {obj_id} not found, skipping.")
            continue

        # 1️⃣ Delete existing text if any
        if "text" in textbox_obj and any("textRun" in te for te in textbox_obj["text"].get("textElements", [])):
            smart_requests.append({
                "deleteText": {"objectId": obj_id, "textRange": {"type": "ALL"}}
            })

        # 2️⃣ Insert new text
        smart_requests.append({
            "insertText": {"objectId": obj_id, "text": text_to_insert}
        })

        # 3️⃣ Apply styles (find all style updates for this obj_id)
        for style_req in updates:
            if style_req.get("updateTextStyle", {}).get("objectId") == obj_id or \
               style_req.get("updateParagraphStyle", {}).get("objectId") == obj_id:
                smart_requests.append(style_req)

    if not smart_requests:
        print("No valid updates for textboxes.")
        return

    # Execute all requests in order
    try:
        response = service.presentations().batchUpdate(
            presentationId=presentation_id,
            body={"requests": smart_requests}
        ).execute()
        print(f"Updated {len(smart_requests)} requests in presentation {presentation_id}")
        return response
    except Exception:
        traceback.print_exc()
        raise


def overwrite_grouped_tables(grouped_updates, slide_id):
    """
    Iterate over grouped updates, generate table ID dynamically,
    and overwrite cells for each group.
    """
    for no, updates in grouped_updates.items():
        table_id = f"p{no}_i4"  # dynamically generate table ID
        print(f"Updating table {table_id} with {len(updates)} cells")
        overwrite_table_cells(table_id, updates, slide_id)

def read_textboxes_grouped_by_slide(presentation_id):
    """
    Read all textboxes from a Google Slides presentation
    and group them by slide ID.

    Args:
        presentation_id (str): Google Slides presentation ID.

    Returns:
        dict: Keys are slide IDs, values are lists of textboxes:
            {"slide_id": [{"object_id": ..., "text": ...}, ...], ...}
    """
    service = get_slide_service()
    presentation = service.presentations().get(presentationId=presentation_id).execute()
    slides = presentation.get("slides", [])

    grouped_textboxes = {}

    for slide in slides:
        slide_id = slide["objectId"]
        textboxes = []

        for element in slide.get("pageElements", []):
            if "shape" in element:
                text_content = ""
                text_info = element["shape"].get("text", {})
                for te in text_info.get("textElements", []):
                    if "textRun" in te:
                        text_content += te["textRun"].get("content", "")
                textboxes.append({
                    "object_id": element["objectId"],
                    "text": text_content.strip()
                })

        grouped_textboxes[slide_id] = textboxes

    return grouped_textboxes

def build_slide_textbox_updates(rows, textbox_response):
    """
    Build Google Slides batchUpdate requests.

    Rules:
    - Group rows by NO.
    - Take ONLY the first row per NO.
    - First NO matches first slide (p1), second NO → p2, etc.
    - textbox_response keys ARE the slide IDs.
    - If EQUIPMENT DESCRIPTION > 30 chars → font size = 8, else 10
    """

    requests = []

    # 1. Group rows by NO
    grouped = {}
    for row in rows:
        no = row.get("NO.")
        if not no:
            continue
        grouped.setdefault(no, []).append(row)

    # 2. Sort NOs numerically
    no_keys = sorted(grouped.keys(), key=lambda x: int(x))

    # 3. Slides are already in correct order
    slide_ids = list(textbox_response.keys())

    # 4. Match first NO → first slide
    for no, slide_id in zip(no_keys, slide_ids):
        first_row = grouped[no][0]
        textboxes = textbox_response.get(slide_id, [])

        if len(textboxes) < 3:
            print(f"Warning: Slide {slide_id} does not have 3 textboxes. Skipping...")
            continue

        description = first_row.get("EQUIPMENT DESCRIPTION", "")
        equipment_no = first_row.get("EQUIPMENT NO.", "")
        pmt_no = first_row.get("PMT NO.", "")

        values = [description, equipment_no, pmt_no]

        for index, (tb, value) in enumerate(zip(textboxes[:3], values)):
            if not value:
                continue

            obj_id = tb["object_id"]

            # 🔹 Font size logic
            font_size = 10
            if index == 0 and len(value) > 30:  # DESCRIPTION only
                font_size = 8

            # Insert text
            requests.append({
                "insertText": {
                    "objectId": obj_id,
                    "text": value
                }
            })

            # Text style
            requests.append({
                "updateTextStyle": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "fontFamily": "Arial",
                        "fontSize": {"magnitude": font_size, "unit": "PT"},
                        "foregroundColor": {
                            "opaqueColor": {
                                "rgbColor": {"red": 0, "green": 0, "blue": 0}
                            }
                        }
                    },
                    "fields": "fontFamily,fontSize,foregroundColor"
                }
            })

            # Center alignment
            requests.append({
                "updateParagraphStyle": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"},
                    "style": {"alignment": "CENTER"},
                    "fields": "alignment"
                }
            })

    return requests
