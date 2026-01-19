from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import os, json, traceback
import re
from dotenv import load_dotenv 

load_dotenv()
# Your OAuth credentials from environment variables
GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SPREADSHEET_ID = "1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE"

YELLOW_RGB = {'red': 1.0, 'green': 1.0, 'blue': 0.0}
TOLERANCE = 0.1

def get_sheets_service():
    """Authenticate using OAuth credentials and return Google Sheets service"""
    try:
        creds = Credentials(
            token=None,
            refresh_token=GOOGLE_REFRESH_TOKEN,
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        creds.refresh(Request())
        service = build('sheets', 'v4', credentials=creds)
        return service
    except Exception:
        traceback.print_exc()
        return None


def col_idx_to_letter(idx: int) -> str:
    letters = ''
    while idx >= 0:
        letters = chr(idx % 26 + 65) + letters
        idx = idx // 26 - 1
    return letters


def is_yellow_cell(cell):
    if not cell or 'userEnteredFormat' not in cell:
        return False
    fmt = cell.get('userEnteredFormat', {})
    color = fmt.get('backgroundColor', {})
    return all(abs(color.get(c, 0) - YELLOW_RGB[c]) < TOLERANCE for c in ['red', 'green', 'blue'])


def get_merge_range(row_idx, col_idx, merges):
    for merge in merges:
        if (merge['startRowIndex'] <= row_idx < merge['endRowIndex'] and
            merge['startColumnIndex'] <= col_idx < merge['endColumnIndex']):
            return {
                'startRow': merge['startRowIndex'],
                'endRow': merge['endRowIndex'],
                'startCol': merge['startColumnIndex'],
                'endCol': merge['endColumnIndex'],
                'rowSpan': merge['endRowIndex'] - merge['startRowIndex'],
                'colSpan': merge['endColumnIndex'] - merge['startColumnIndex']
            }
    return None


def extract_yellow_headers(spreadsheet_id, sheet_index=0):
    service = get_sheets_service()
    if not service:
        return {}

    try:
        sheet = service.spreadsheets()
        result = sheet.get(
            spreadsheetId=spreadsheet_id,
            includeGridData=True,
            fields="sheets(properties,merges,data(rowData(values(userEnteredValue,formattedValue,userEnteredFormat))))"
        ).execute()

        sheet_data = result['sheets'][sheet_index]
        data = sheet_data['data'][0]['rowData']
        merges = sheet_data.get('merges', [])

        yellow_cells = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            for col_idx, cell in enumerate(row['values']):
                if is_yellow_cell(cell):
                    value = cell.get('formattedValue', '').strip()
                    if not value:
                        continue
                    merge_info = get_merge_range(row_idx, col_idx, merges)
                    is_merge_primary = merge_info and merge_info['startRow'] == row_idx and merge_info['startCol'] == col_idx
                    yellow_cells.append({
                        'row': row_idx,
                        'col': col_idx,
                        'value': value,
                        'merge_info': merge_info if is_merge_primary else None,
                        'is_merge_primary': is_merge_primary
                    })

        # Sort cells top-to-bottom, left-to-right
        yellow_cells.sort(key=lambda x: (x['row'], x['col']))

        # Build hierarchical headers
        column_headers = {}
        for cell in yellow_cells:
            col_letter = col_idx_to_letter(cell['col'])
            merge_info = cell['merge_info']
            if col_letter not in column_headers:
                column_headers[col_letter] = []
            column_headers[col_letter].append(cell['value'])

            if merge_info:
                for spanned_col in range(cell['col'] + 1, cell['col'] + merge_info['colSpan']):
                    spanned_letter = col_idx_to_letter(spanned_col)
                    if spanned_letter not in column_headers:
                        column_headers[spanned_letter] = []
                    column_headers[spanned_letter] = column_headers[col_letter].copy()

        # Clean headers and remove duplicates
        json_headers = {}
        for col_letter in sorted(column_headers.keys()):
            unique_headers = []
            for h in column_headers[col_letter]:
                if h not in unique_headers:
                    unique_headers.append(h)
            header_path = ' '.join(unique_headers).replace('\n', ' ').replace('\r', ' ').strip()
            json_headers[col_letter] = header_path

        return json_headers

    except Exception:
        traceback.print_exc()
        return {}

def get_rows_by_equipment(spreadsheet_id, target_equipment, sheet_index=0):
    service = get_sheets_service()
    if not service:
        return []

    try:
        # Get sheet data
        sheet = service.spreadsheets()
        result = sheet.get(
            spreadsheetId=spreadsheet_id,
            includeGridData=True,
            fields="sheets(properties,merges,data(rowData(values(userEnteredValue,formattedValue,userEnteredFormat))))"
        ).execute()

        sheet_data = result['sheets'][sheet_index]
        data = sheet_data['data'][0]['rowData']
        merges = sheet_data.get('merges', [])

        # Step 1: Extract headers
        yellow_cells = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            for col_idx, cell in enumerate(row['values']):
                if is_yellow_cell(cell):
                    value = cell.get('formattedValue', '').strip()
                    if not value:
                        continue
                    merge_info = get_merge_range(row_idx, col_idx, merges)
                    is_merge_primary = merge_info and merge_info['startRow'] == row_idx and merge_info['startCol'] == col_idx
                    yellow_cells.append({
                        'row': row_idx,
                        'col': col_idx,
                        'value': value,
                        'merge_info': merge_info if is_merge_primary else None,
                        'is_merge_primary': is_merge_primary
                    })

        yellow_cells.sort(key=lambda x: (x['row'], x['col']))

        column_headers = {}
        for cell in yellow_cells:
            col_letter = col_idx_to_letter(cell['col'])
            merge_info = cell['merge_info']
            if col_letter not in column_headers:
                column_headers[col_letter] = []
            column_headers[col_letter].append(cell['value'])
            if merge_info:
                for spanned_col in range(cell['col'] + 1, cell['col'] + merge_info['colSpan']):
                    spanned_letter = col_idx_to_letter(spanned_col)
                    column_headers[spanned_letter] = column_headers[col_letter].copy()

        headers_mapping = {}
        for col_letter in sorted(column_headers.keys()):
            unique_headers = []
            for h in column_headers[col_letter]:
                if h not in unique_headers:
                    unique_headers.append(h)
            headers_mapping[col_letter] = ' '.join(unique_headers).replace('\n', ' ').replace('\r', ' ').strip()

        # Step 2: Prepare merged EQUIPMENT NO. values mapping
        equip_col_letter = next((c for c, h in headers_mapping.items() if "EQUIPMENT NO." in h.upper()), None)
        equip_merged_values = {}  # row_idx -> equipment_no

        if equip_col_letter:
            for merge in merges:
                start_col = merge['startColumnIndex']
                end_col = merge['endColumnIndex']
                start_row = merge['startRowIndex']
                end_row = merge['endRowIndex']
                if col_idx_to_letter(start_col) == equip_col_letter:
                    # Get the value of the primary cell
                    cell = data[start_row]['values'][start_col]
                    value = cell.get('formattedValue', '').strip() if cell else ''
                    # Apply the value to all rows spanned by merge
                    for r in range(start_row, end_row):
                        equip_merged_values[r] = value

        # Step 3: Map rows by headers, use merged value if necessary
        rows_matched = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            row_data = {}
            for col_idx in range(len(row['values'])):
                col_letter = col_idx_to_letter(col_idx)
                header = headers_mapping.get(col_letter)
                if not header:
                    continue
                cell = row['values'][col_idx] if col_idx < len(row['values']) else None
                row_data[header] = cell.get('formattedValue', '').strip() if cell else ''

            # Use merged EQUIPMENT NO. if current row has empty
            if equip_col_letter and (not row_data.get(headers_mapping[equip_col_letter])):
                row_data[headers_mapping[equip_col_letter]] = equip_merged_values.get(row_idx, '')

            # Filter by target equipment
            if row_data.get(headers_mapping[equip_col_letter], '').upper() == target_equipment.upper():
                rows_matched.append(row_data)

        return rows_matched

    except Exception:
        traceback.print_exc()
        return []

# =========================================================
# DATA PROCESSING & FORMATTING
# =========================================================

def is_empty(val):
    return val is None or str(val).strip() == ""


def safe_assign(row, key, value):
    if not is_empty(value):
        row[key] = value


# -----------------------------
# MATERIAL SPLIT
# -----------------------------
# -----------------------------
# MATERIAL SPLIT
# -----------------------------
def format_spec_with_dash(spec):
    """
    Ensure spec has dash between letters and numbers.
    Handles specs with slashes and spaces.
    
    Examples:
        "SA516" -> "SA-516"
        "SA-516" -> "SA-516" (already has dash)
        "A240" -> "A-240"
        "A/SA 516" -> "A/SA-516"
        "ASME SA516" -> "ASME SA-516"
    """
    if not spec:
        return spec
    
    spec = spec.strip()
    
    # Pattern: Find where letters/slashes/spaces end and digits begin
    # Match: (letters with optional slashes and spaces) + (space?) + (digits)
    match = re.match(r'^([A-Z\s/]+?)\s*(\d.*)$', spec, re.IGNORECASE)
    
    if match:
        letter_part = match.group(1).strip()
        number_part = match.group(2).strip()
        
        # Check if dash already exists at the junction
        if letter_part.endswith('-') or number_part.startswith('-'):
            return spec
        
        return f"{letter_part}-{number_part}"
    
    return spec


import re

def format_spec_with_dash(spec):
    """
    Ensure spec has dash between letters and numbers.
    Handles specs with slashes and spaces.
    
    Examples:
        "SA516" -> "SA-516"
        "SA-516" -> "SA-516" (already has dash)
        "A240" -> "A-240"
        "A/SA 516" -> "A/SA-516"
        "ASME SA516" -> "ASME SA-516"
    """
    if not spec:
        return spec
    
    spec = spec.strip()
    
    # Pattern: Find where letters/slashes/spaces end and digits begin
    # Match: (letters with optional slashes and spaces) + (space?) + (digits)
    match = re.match(r'^([A-Z\s/]+?)\s*(\d.*)$', spec, re.IGNORECASE)
    
    if match:
        letter_part = match.group(1).strip()
        number_part = match.group(2).strip()
        
        # Check if dash already exists at the junction
        if letter_part.endswith('-') or number_part.startswith('-'):
            return spec
        
        return f"{letter_part}-{number_part}"
    
    return spec


def split_spec_grade(material):
    """
    Parse material string to extract Spec and Grade.
    Handles all formats including GR prefix, multi-spec, modifiers, etc.
    
    Examples:
        "SA-516 70" -> ("SA-516", "70")
        "SA-240-Gr.316/316L" -> ("SA-240", "316/316L")
        "ASTM A-240 304L" -> ("ASTM A-240", "304L")
        "SA-240 M 316L / SA 240 316L" -> ("SA-240 M / SA-240", "316L")
        "A516 Gr.70" -> ("A-516", "70")
        "SA-240-316" -> ("SA-240", "316")
        "SA-213-TP316" -> ("SA-213", "TP316")
        "SA403-WP316" -> ("SA-403", "WP316")
    """
    if not material:
        return "", ""

    material = material.strip()

    # ========================================
    # CASE 1: Explicit GR/GRADE/G prefix
    # ========================================
    # Matches: "SA-240-Gr.316/316L", "A516 Gr.70", "SA-240 Grade 316"
    m = re.search(r'[\s-]*(GR\.?|GRADE\.?|G\.?)[\s-]*(.+)$', material, re.IGNORECASE)
    if m:
        grade = m.group(2).strip()
        # Remove trailing dashes/spaces from spec part
        spec_part = material[:m.start()].strip().rstrip('-').rstrip()
        spec = format_spec_with_dash(spec_part)
        return spec, grade

    # ========================================
    # CASE 2: Multiple specs with slash (/)
    # ========================================
    # Matches: "SA-240 M 316L/SA 240 316L", "SA-516 316/316L"
    if '/' in material:
        parts = [p.strip() for p in material.split('/')]
        
        # Pattern: [PREFIX] [SEPARATOR] [NUMBER] [REMAINDER]
        # Examples: "SA-240 M 316L", "ASTM A-240 304L", "SA 240 316"
        # **FIX: Made separator optional to handle SA403-WP316 format**
        spec_pattern = r'^((?:ASME\s+|ASTM\s+)?[A-Z]+)[\s-]?(\d+)\s*(.*)$'
        
        specs = []
        grades = []
        
        for part in parts:
            match = re.match(spec_pattern, part, re.IGNORECASE)
            if not match:
                # No spec pattern, might be standalone grade
                # Updated pattern to handle grades with leading letters
                if part and re.match(r'^[A-Z]*[0-9]+[A-Z]*$', part):
                    grades.append(part)
                continue
            
            prefix = match.group(1).strip()    # "SA", "ASTM A"
            number = match.group(2)             # "240", "516"
            remainder = match.group(3).strip()  # "M 316L", "304L", "316"
            
            # **FIX: Strip leading dashes from remainder**
            remainder = remainder.lstrip('-').strip()
            
            # Build base spec: "SA-240" or "ASTM A-240"
            spec_base = f"{prefix}-{number}"
            
            # Check for modifier + grade pattern: "M 316L"
            mod_match = re.match(r'^([A-Z])\s+([0-9]+[A-Z]*)$', remainder, re.IGNORECASE)
            if mod_match:
                modifier = mod_match.group(1)
                grade_part = mod_match.group(2)
                specs.append(f"{spec_base} {modifier}")
                grades.append(grade_part)
                continue
            
            # Check for grade only: "304L", "316", "70", "TP316", "WP316"
            # Updated pattern to handle grades with leading letters
            grade_match = re.match(r'^([A-Z]*[0-9]+[A-Z]*)$', remainder, re.IGNORECASE)
            if grade_match:
                specs.append(spec_base)
                grades.append(grade_match.group(1))
                continue
            
            # No grade in this part
            specs.append(spec_base)
        
        # Build result
        if specs:
            # Remove duplicates while preserving order
            spec_combined = ' / '.join(dict.fromkeys(specs))
            grade_combined = '/'.join(dict.fromkeys(grades)) if grades else ""
            return spec_combined, grade_combined

    # ========================================
    # CASE 3: Single spec pattern
    # ========================================
    # Matches: "SA-516 70", "ASTM A-240 304L", "SA-240 M 316L", "SA-240-316", "SA403-WP316"
    # **FIX: Made separator optional ([\s-]?) to handle formats like SA403-WP316**
    simple_pattern = r'^((?:ASME\s+|ASTM\s+)?[A-Z]+)[\s-]?(\d+)\s*(.*)$'
    m = re.match(simple_pattern, material, re.IGNORECASE)
    
    if m:
        prefix = m.group(1).strip()     # "SA", "ASTM A", "A"
        number = m.group(2)              # "240", "516", "403"
        remainder = m.group(3).strip()   # "304L", "M 316L", "70", "-316", "-TP316", "-WP316"
        
        # **FIX: Strip leading dashes from remainder**
        remainder = remainder.lstrip('-').strip()
        
        # Build base spec
        spec_base = f"{prefix}-{number}"
        
        # Check for modifier + grade: "M 316L"
        mod_match = re.match(r'^([A-Z])\s+([0-9]+[A-Z]*)$', remainder, re.IGNORECASE)
        if mod_match:
            modifier = mod_match.group(1)
            grade = mod_match.group(2)
            return f"{spec_base} {modifier}", grade
        
        # Check for grade only: "304L", "70", "TP316", "WP316"
        # **FIX: Updated pattern to handle grades with leading letters**
        grade_match = re.match(r'^([A-Z]*[0-9]+[A-Z]*)$', remainder, re.IGNORECASE)
        if grade_match:
            return spec_base, grade_match.group(1)
        
        # No grade
        return spec_base, ""

    # ========================================
    # CASE 4: Fallback - format and extract
    # ========================================
    formatted_spec = format_spec_with_dash(material)
    
    # Last attempt: extract trailing grade from formatted spec
    # Updated to handle grades with leading letters
    tail_grade = re.search(r'\s+([A-Z]*[0-9]+[A-Z]*)$', formatted_spec)
    if tail_grade:
        spec = formatted_spec[:tail_grade.start()].strip()
        grade = tail_grade.group(1)
        return spec, grade
    
    # No grade found
    return formatted_spec, ""
 
# -----------------------------
# PRESSURE & TEMPERATURE
# -----------------------------
def extract_numeric_with_separators(text):
    if not text:
        return ""
    return "".join(re.findall(r"[0-9./~-]", text))


def convert_pressure_to_mpa(value, unit):
    try:
        num = float(value)
    except:
        return value

    unit = unit.lower()
    if "kpa" in unit:
        return f"{num / 1000:.2f}"
    if "bar" in unit:
        return f"{num / 10:.2f}"
    if "kg" in unit:
        return f"{num * 0.0980665:.2f}"
    return str(num)


def normalize_pressure(text, unit):
    raw = extract_numeric_with_separators(text)
    if not raw:
        return ""

    parts = re.split(r'([/~\-])', raw)
    out = []
    for p in parts:
        if re.match(r'[0-9.]+', p):
            out.append(convert_pressure_to_mpa(p, unit))
        else:
            out.append(p)
    return "".join(out)


def normalize_temperature(text):
    return extract_numeric_with_separators(text)


# -----------------------------
# MAIN FORMATTER
# -----------------------------
def format_rows_with_pdf(sheet_rows, pdf_data):
    """
    Format sheet rows with PDF data.
    Supports two structures:
    1. Single DesignData (vessels)
    2. ShellSide/TubeSide DesignData (heat exchangers)
    """
    bom = pdf_data.get("Part1", {}).get("BillOfMaterial", {})
    part2 = pdf_data.get("Part2", {}).get("DesignData", {})
    
    # Detect structure type
    has_shell_tube = "ShellSide" in part2 or "TubeSide" in part2
    
    if has_shell_tube:
        shell_side = part2.get("ShellSide", {})
        tube_side = part2.get("TubeSide", {})
    else:
        shell_side = part2
        tube_side = part2

    formatted_rows = []
    
    for idx, row in enumerate(sheet_rows):
        part = row.get("PARTS", "").strip()
        part_normalized = part.upper()
        
        # Determine which side to use based on part name
        if "TUBE" in part_normalized or "CHANNEL" in part_normalized:
            design = tube_side
        else:
            design = shell_side

        # ========================================
        # ENHANCED MATERIAL MAPPING
        # ========================================
        material = ""
        material_keys = []
        
        # Priority 1: Exact match without spaces
        material_keys.append(part.replace(" ", ""))  # "Top Channel" → "TopChannel"
        
        # Priority 2: Specific part-based mappings
        if "TOP" in part_normalized and "CHANNEL" in part_normalized:
            material_keys.extend(["TopChannel", "Top Channel", "Channel"])
        elif "BOTTOM" in part_normalized and "CHANNEL" in part_normalized:
            material_keys.extend(["BottomChannel", "Bottom Channel", "Channel"])
        elif "CHANNEL" in part_normalized:
            material_keys.extend(["Channel", "channel", "CHANNEL"])
        
        if "TUBE" in part_normalized:
            material_keys.extend(["Tube", "tube", "TUBE"])
        
        if "SHELL" in part_normalized:
            material_keys.extend(["Shell", "shell", "SHELL"])
        
        if "TOP" in part_normalized and "HEAD" in part_normalized:
            material_keys.extend(["TopHead", "Top Head", "top head", "TOP HEAD", "Head"])
        elif "BOTTOM" in part_normalized and "HEAD" in part_normalized:
            material_keys.extend(["BottomHead", "Bottom Head", "bottom head", "BOTTOM HEAD", "Head"])
        elif "HEAD" in part_normalized:
            material_keys.extend(["Head", "head", "HEAD"])
        
        # Priority 3: Generic fallbacks
        material_keys.extend([part, part.lower(), part.upper()])
        
        # Debug: Print what we're looking for
        print(f"🔍 Part: '{part}' | Looking for keys: {material_keys[:5]}...")  # Show first 5
        print(f"   Available BOM keys: {list(bom.keys())}")
        
        # Try each key until we find a material
        for key in material_keys:
            material = bom.get(key, "")
            if material and material.lower() != "no":
                print(f"   ✅ Found material using key '{key}': {material}")
                break
        else:
            print(f"   ❌ No material found for '{part}'")
        
        # ========================================
        # PROCESS MATERIAL IF FOUND
        # ========================================
        if material and material.lower() != "no":
            spec, grade = split_spec_grade(material)
            print(f"   📝 Parsed: spec='{spec}', grade='{grade}'")
            
            # Assign to row
            safe_assign(row, "MATERIAL INFORMATION SPEC.", spec)
            safe_assign(row, "MATERIAL INFORMATION GRADE", grade)
        else:
            print(f"   ⚠️  No valid material for part '{part}'")

        # ========================================
        # DESIGN DATA ASSIGNMENT
        # ========================================
        safe_assign(row, "FLUID", design.get("Fluid"))
        print(f"DEBUG - part_normalized: '{part_normalized}'")
        print(f"DEBUG - part_normalized repr: {repr(part_normalized)}")
        print(f"DEBUG - Length: {len(part_normalized)}")
        print(f"DEBUG - Comparison result: {part_normalized == 'TUBE BUNDLE'}")

        if part_normalized == 'TUBE BUNDLE':
            print("Tube bundle no insulation")
            safe_assign(row, "INSULATION (yes/No)", "N")
            print(f"DEBUG - Row after assign: {row.get('INSULATION (yes/No)')}")
        elif design.get("Insulation", "").lower() == "yes":
            
            safe_assign(row, "INSULATION (yes/No)", "Y")
        else:
            safe_assign(row, "INSULATION (yes/No)", "N")

        print(f"DEBUG - Row after assign: {row.get('INSULATION (yes/No)')}")

        safe_assign(
            row,
            "DESIGN PRESSURE (Mpa)",
            normalize_pressure(
                design.get("DesignPressure"),
                design.get("PressureUnit", "")
            )
        )

        safe_assign(
            row,
            "OPERATING PRESSURE (Mpa)",
            normalize_pressure(
                design.get("OperatingPressure"),
                design.get("PressureUnit", "")
            )
        )

        safe_assign(
            row,
            "DESIGN TEMP.  (°C)",
            normalize_temperature(design.get("DesignTemperature"))
        )

        safe_assign(
            row,
            "OPERATING TEMP.  (°C)",
            normalize_temperature(design.get("OperatingTemperature"))
        )
        
        formatted_rows.append(row)

    return formatted_rows
  
def prepare_sheet_update_data(spreadsheet_id, merged_data, sheet_index=0):
    """
    Prepare batch update data structure for Google Sheets.
    Only first row of each equipment group gets EQUIPMENT NO.
    
    Args:
        spreadsheet_id: Google Sheet ID
        merged_data: List of row objects with data to insert
        sheet_index: Sheet index (default 0)
    
    Returns:
        dict: {
            "success": bool,
            "batch_data": list of update ranges,
            "sheet_name": str,
            "rows_to_update": int,
            "message": str (if error)
        }
    """
    service = get_sheets_service()
    if not service:
        return {
            "success": False,
            "message": "Failed to connect to Google Sheets"
        }

    try:
        # 🔍 STEP 1: GET SHEET NAME
        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheet_name = sheet_metadata['sheets'][sheet_index]['properties']['title']
        
        # 🔍 STEP 2: GET HEADERS USING extract_yellow_headers
        headers_mapping = extract_yellow_headers(spreadsheet_id, sheet_index)
        
        if not headers_mapping:
            return {
                "success": False,
                "message": "Could not extract headers from sheet"
            }
        
        # Create reverse mapping: header name → column letter
        header_to_col = {v: k for k, v in headers_mapping.items()}
        
        # Find EQUIPMENT NO. column
        equip_header = None
        for header_name in header_to_col.keys():
            if "EQUIPMENT NO." in header_name.upper():
                equip_header = header_name
                break
        
        if not equip_header:
            return {
                "success": False,
                "message": "Could not find EQUIPMENT NO. column"
            }
        
        equip_col_letter = header_to_col[equip_header]
        
        # 📊 STEP 3: GET SHEET DATA TO FIND EQUIPMENT ROWS
        result = service.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            includeGridData=True,
            fields="sheets(properties,data(rowData(values(formattedValue))))"
        ).execute()
        
        sheet_data = result['sheets'][sheet_index]
        data = sheet_data['data'][0]['rowData']
        
        equip_col_idx = ord(equip_col_letter) - ord('A')
        
        # 🔄 STEP 4: GROUP MERGED DATA BY EQUIPMENT NO.
        equipment_groups = {}
        for row in merged_data:
            equip_no = row.get("EQUIPMENT NO.", "").strip()
            if equip_no:
                if equip_no not in equipment_groups:
                    equipment_groups[equip_no] = []
                equipment_groups[equip_no].append(row)
        
        # 📝 STEP 5: BUILD UPDATE DATA IN A1 NOTATION
        batch_data = []
        rows_to_update = 0
        
        for equip_no, rows_to_insert in equipment_groups.items():
            # Find the first row where this EQUIPMENT NO. appears
            start_row_idx = None
            
            for row_idx, row in enumerate(data):
                if 'values' not in row or row_idx < 2:  # Skip header rows
                    continue
                
                values = row['values']
                if equip_col_idx >= len(values):
                    continue
                
                cell_value = values[equip_col_idx].get('formattedValue', '').strip()
                
                if cell_value.upper() == equip_no.upper():
                    start_row_idx = row_idx + 1  # +1 because sheet rows are 1-indexed
                    break
            
            if start_row_idx is None:
                print(f"Equipment {equip_no} not found in sheet, skipping")
                continue
            
            # 💾 STEP 6: CREATE UPDATE ROWS IN A1 NOTATION
            for i, merged_row in enumerate(rows_to_insert):
                target_row_num = start_row_idx + i
                
                # Build row values in column order
                row_values = []
                for col_letter in sorted(headers_mapping.keys()):
                    header_name = headers_mapping[col_letter]
                    value = merged_row.get(header_name, "")
                    
                    # ✨ SPECIAL HANDLING: Only first row gets EQUIPMENT NO., NO., EQUIPMENT DESCRIPTION
                    if i > 0:  # Not the first row
                        if any(keyword in header_name.upper() for keyword in [
                            "EQUIPMENT NO.",
                            "NO.",
                            "EQUIPMENT DESCRIPTION"
                        ]):
                            value = ""  # Empty for rows after the first
                    
                    row_values.append(str(value))
                
                # Create A1 range
                start_col = min(headers_mapping.keys())
                end_col = max(headers_mapping.keys())
                range_notation = f"{sheet_name}!{start_col}{target_row_num}:{end_col}{target_row_num}"
                
                batch_data.append({
                    "range": range_notation,
                    "values": [row_values]
                })
                rows_to_update += 1
        
        if not batch_data:
            return {
                "success": False,
                "message": "No matching rows found to update"
            }
        
        return {
            "success": True,
            "batch_data": batch_data,
            "sheet_name": sheet_name,
            "rows_to_update": rows_to_update
        }
    
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Error preparing data: {str(e)}"
        }

def execute_sheet_batch_update(spreadsheet_id, batch_data):
    """
    Execute batch update to Google Sheets using prepared data.
    
    Args:
        spreadsheet_id: Google Sheet ID
        batch_data: List of update ranges prepared by prepare_sheet_update_data
    
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "updated_cells": int (if success)
        }
    """
    service = get_sheets_service()
    if not service:
        return {
            "success": False,
            "message": "Failed to connect to Google Sheets"
        }

    try:
        body = {
            "valueInputOption": "USER_ENTERED",  # Allows formulas and formatting
            "data": batch_data
        }
        
        response = service.spreadsheets().values().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=body
        ).execute()
        
        updated_cells = response.get('totalUpdatedCells', 0)
        
        return {
            "success": True,
            "message": f"Successfully updated {updated_cells} cells",
            "updated_cells": updated_cells,
            "updated_ranges": len(batch_data)
        }
    
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Error executing batch update: {str(e)}"
        }
    
def get_rows_by_no(spreadsheet_id, target_no, sheet_index=0):
    service = get_sheets_service()
    if not service:
        return []

    try:
        # Get sheet data
        sheet = service.spreadsheets()
        result = sheet.get(
            spreadsheetId=spreadsheet_id,
            includeGridData=True,
            fields="sheets(properties,merges,data(rowData(values(userEnteredValue,formattedValue,userEnteredFormat))))"
        ).execute()

        sheet_data = result['sheets'][sheet_index]
        data = sheet_data['data'][0]['rowData']
        merges = sheet_data.get('merges', [])

        # Step 1: Extract headers
        yellow_cells = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            for col_idx, cell in enumerate(row['values']):
                if is_yellow_cell(cell):
                    value = cell.get('formattedValue', '').strip()
                    if not value:
                        continue
                    merge_info = get_merge_range(row_idx, col_idx, merges)
                    is_merge_primary = merge_info and merge_info['startRow'] == row_idx and merge_info['startCol'] == col_idx
                    yellow_cells.append({
                        'row': row_idx,
                        'col': col_idx,
                        'value': value,
                        'merge_info': merge_info if is_merge_primary else None,
                        'is_merge_primary': is_merge_primary
                    })

        yellow_cells.sort(key=lambda x: (x['row'], x['col']))

        column_headers = {}
        for cell in yellow_cells:
            col_letter = col_idx_to_letter(cell['col'])
            merge_info = cell['merge_info']
            if col_letter not in column_headers:
                column_headers[col_letter] = []
            column_headers[col_letter].append(cell['value'])
            if merge_info:
                for spanned_col in range(cell['col'] + 1, cell['col'] + merge_info['colSpan']):
                    spanned_letter = col_idx_to_letter(spanned_col)
                    column_headers[spanned_letter] = column_headers[col_letter].copy()

        headers_mapping = {}
        for col_letter in sorted(column_headers.keys()):
            unique_headers = []
            for h in column_headers[col_letter]:
                if h not in unique_headers:
                    unique_headers.append(h)
            headers_mapping[col_letter] = ' '.join(unique_headers).replace('\n', ' ').replace('\r', ' ').strip()

        # Step 2: Prepare merged NO. values mapping
        # Changed: Search for "NO" or "NO." in header
        no_col_letter = next((c for c, h in headers_mapping.items() if h.upper() == "NO" or h.upper() == "NO."), None)
        no_merged_values = {}  # row_idx -> no

        if no_col_letter:
            for merge in merges:
                start_col = merge['startColumnIndex']
                end_col = merge['endColumnIndex']
                start_row = merge['startRowIndex']
                end_row = merge['endRowIndex']
                if col_idx_to_letter(start_col) == no_col_letter:
                    # Get the value of the primary cell
                    cell = data[start_row]['values'][start_col]
                    value = cell.get('formattedValue', '').strip() if cell else ''
                    # Apply the value to all rows spanned by merge
                    for r in range(start_row, end_row):
                        no_merged_values[r] = value

        # Step 3: Map rows by headers, use merged value if necessary
        rows_matched = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            row_data = {}
            for col_idx in range(len(row['values'])):
                col_letter = col_idx_to_letter(col_idx)
                header = headers_mapping.get(col_letter)
                if not header:
                    continue
                cell = row['values'][col_idx] if col_idx < len(row['values']) else None
                row_data[header] = cell.get('formattedValue', '').strip() if cell else ''

            # Use merged NO. if current row has empty
            if no_col_letter and (not row_data.get(headers_mapping[no_col_letter])):
                row_data[headers_mapping[no_col_letter]] = no_merged_values.get(row_idx, '')

            # Filter by target NO
            if row_data.get(headers_mapping[no_col_letter], '').upper() == target_no.upper():
                rows_matched.append(row_data)

        return rows_matched

    except Exception:
        traceback.print_exc()
        return []

def get_all_rows_with_no(spreadsheet_id, sheet_index=0):
    service = get_sheets_service()
    if not service:
        return []

    try:
        # Get sheet data
        sheet = service.spreadsheets()
        result = sheet.get(
            spreadsheetId=spreadsheet_id,
            includeGridData=True,
            fields="sheets(properties,merges,data(rowData(values(userEnteredValue,formattedValue,userEnteredFormat))))"
        ).execute()

        sheet_data = result['sheets'][sheet_index]
        data = sheet_data['data'][0]['rowData']
        merges = sheet_data.get('merges', [])

        # Step 1: Extract headers
        yellow_cells = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            for col_idx, cell in enumerate(row['values']):
                if is_yellow_cell(cell):
                    value = cell.get('formattedValue', '').strip()
                    if not value:
                        continue
                    merge_info = get_merge_range(row_idx, col_idx, merges)
                    is_merge_primary = merge_info and merge_info['startRow'] == row_idx and merge_info['startCol'] == col_idx
                    yellow_cells.append({
                        'row': row_idx,
                        'col': col_idx,
                        'value': value,
                        'merge_info': merge_info if is_merge_primary else None,
                        'is_merge_primary': is_merge_primary
                    })

        yellow_cells.sort(key=lambda x: (x['row'], x['col']))

        # Build header mapping
        column_headers = {}
        for cell in yellow_cells:
            col_letter = col_idx_to_letter(cell['col'])
            merge_info = cell['merge_info']
            if col_letter not in column_headers:
                column_headers[col_letter] = []
            column_headers[col_letter].append(cell['value'])
            if merge_info:
                for spanned_col in range(cell['col'] + 1, cell['col'] + merge_info['colSpan']):
                    spanned_letter = col_idx_to_letter(spanned_col)
                    column_headers[spanned_letter] = column_headers[col_letter].copy()

        headers_mapping = {}
        for col_letter in sorted(column_headers.keys()):
            unique_headers = []
            for h in column_headers[col_letter]:
                if h not in unique_headers:
                    unique_headers.append(h)
            headers_mapping[col_letter] = ' '.join(unique_headers).replace('\n', ' ').replace('\r', ' ').strip()

        # Step 2: Prepare merged NO values
        no_col_letter = next((c for c, h in headers_mapping.items() if h.upper() in ["NO", "NO."]), None)
        no_merged_values = {}
        if no_col_letter:
            for merge in merges:
                start_col = merge['startColumnIndex']
                start_row = merge['startRowIndex']
                end_row = merge['endRowIndex']
                if col_idx_to_letter(start_col) == no_col_letter:
                    cell = data[start_row]['values'][start_col]
                    value = cell.get('formattedValue', '').strip() if cell else ''
                    for r in range(start_row, end_row):
                        no_merged_values[r] = value

        # Step 3: Map rows and only keep those with a NO number
        rows_matched = []
        for row_idx, row in enumerate(data):
            if 'values' not in row:
                continue
            row_data = {}
            for col_idx in range(len(row['values'])):
                col_letter = col_idx_to_letter(col_idx)
                header = headers_mapping.get(col_letter)
                if not header:
                    continue
                cell = row['values'][col_idx] if col_idx < len(row['values']) else None
                row_data[header] = cell.get('formattedValue', '').strip() if cell else ''

            # Fill NO column if empty but only if merged value exists
            if no_col_letter and not row_data.get(headers_mapping[no_col_letter]):
                row_data[headers_mapping[no_col_letter]] = no_merged_values.get(row_idx, '')

            no_value = row_data.get(headers_mapping[no_col_letter], '').strip()
            if no_value and no_value.isdigit():  # only numeric NOs
                rows_matched.append(row_data)

        return rows_matched

    except Exception:
        traceback.print_exc()
        return []
