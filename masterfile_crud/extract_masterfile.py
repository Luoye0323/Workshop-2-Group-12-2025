#pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
#EXTRACT EQUIPMENT DATA FOR POWERPOINT

import string
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
import json
import sys

# ==============================================================================
# 1. CONFIGURATION & AUTHENTICATION
# ==============================================================================

# --- Your Credentials ---
SERVICE_ACCOUNT_FILE = " " #insert runtime file
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SPREADSHEET_ID = " " #insert spreadsheet ID

# --- Target for Extraction ---
# Use an 'H' equipment number to test the new quota logic
TARGET_EQUIPMENT_EXTRACT = "H-004"

# Authenticate and build the service
try:
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    sheet = service.spreadsheets()
    print("✅ Service authenticated successfully.")
except Exception as e:
    print(f"FATAL ERROR: Failed to authenticate or build service. Details: {e}")
    sys.exit(1)

# ==============================================================================
# 2. HELPER FUNCTIONS
# ==============================================================================

def find_data_start(data):
    """Finds the 0-based index where the actual data block begins."""
    for row_idx, row in enumerate(data):
        if 'values' in row and len(row['values']) > 0:
            # Check the first column (index 0) for a likely numerical row number
            cell = row['values'][0]
            cell_value = cell.get('formattedValue', '').strip()
            if cell_value and cell_value.isdigit():
                return row_idx
    return 0

# ==============================================================================
# 3. DATA EXTRACTION LOGIC
# ==============================================================================

# Column indices (0-based) for EXTRACTING data:
# Group A: Equipment Header Data (B, C, D)
EQUIP_NO_COL = 1
PMT_NO_COL = 2      # Column C
EQUIP_DESC_COL = 3      # Column D

# Group B: Part-Specific Data (E, G, I, J, K, N, O)
PART_NAME_COL = 4       # Column E
FLUID_COL = 6           # Column G
MATERIAL_SPEC_COL = 8   # Column I
MATERIAL_GRADE_COL = 9  # Column J
INSULATION_COL = 10     # Column K
OPERATING_TEMP_COL = 13 # Column N
OPERATING_PRES_COL = 14 # Column O

def extract_equipment_data(data, target_equipment, start_row=0):
    """
    Finds and extracts header and part data. If the equipment number starts
    with 'H', it ensures a maximum of two parts are returned.
    """

    equipment_found = None
    is_collecting = False

    for row_idx in range(start_row, len(data)):
        row = data[row_idx]
        if 'values' not in row:
            continue

        values = row['values']

        # Helper to safely get the formatted value from a cell based on column index
        def get_value(col_idx):
            if len(values) > col_idx and values[col_idx]:
                return values[col_idx].get('formattedValue', '').strip()
            return ""

        equip_no = get_value(EQUIP_NO_COL)
        part_name = get_value(PART_NAME_COL)

        # --- A. Found Target Equipment START ROW ---
        if equip_no and equip_no.upper() == target_equipment.upper():
            print(f"🔍 Found target equipment '{target_equipment}' at sheet row {row_idx + 1}")
            is_collecting = True

            # 1. Extract Header Data (B, C, D)
            equipment_found = {
                'header': {
                    'equipment_no': equip_no,
                    'pmt_no': get_value(PMT_NO_COL),
                    'description': get_value(EQUIP_DESC_COL),
                },
                'parts': []
            }

            # 2. Collect Part Data (E, G, I, J, K, N, O) for the first row
            if part_name:
                part_data = {
                    'name': part_name,
                    'fluid': get_value(FLUID_COL),
                    'material_spec': get_value(MATERIAL_SPEC_COL),
                    'material_grade': get_value(MATERIAL_GRADE_COL),
                    'insulation': get_value(INSULATION_COL),
                    'operating_temp': get_value(OPERATING_TEMP_COL),
                    'operating_pres': get_value(OPERATING_PRES_COL)
                }
                equipment_found['parts'].append(part_data)

        # --- B. If collecting, check for subsequent parts ---
        elif is_collecting:
            # If we hit a new equipment number in column B, stop collecting
            if equip_no and equip_no != "":
                print(f"   Stopping collection at row {row_idx + 1} (new equipment detected).")
                is_collecting = False
                break

            # If we hit a part name, collect its data
            if part_name:
                part_data = {
                    'name': part_name,
                    'fluid': get_value(FLUID_COL),
                    'material_spec': get_value(MATERIAL_SPEC_COL),
                    'material_grade': get_value(MATERIAL_GRADE_COL),
                    'insulation': get_value(INSULATION_COL),
                    'operating_temp': get_value(OPERATING_TEMP_COL),
                    'operating_pres': get_value(OPERATING_PRES_COL)
                }
                equipment_found['parts'].append(part_data)

    # ===================================================================
    # ENFORCE PART QUOTA BASED ON EQUIPMENT PREFIX
    # ===================================================================
    if equipment_found and equipment_found['header']['equipment_no'].startswith("H"):
        # The equipment number starts with 'H' (e.g., H-004)
        num_parts_found = len(equipment_found['parts'])

        if num_parts_found > 2:
            print(f"💡 Quota applied: Heat Exchanger ('H' type) has {num_parts_found} parts, limiting to the first 2.")
            equipment_found['parts'] = equipment_found['parts'][:2]
        elif num_parts_found < 2:
             print(f"⚠️ Quota check: Heat Exchanger ('H' type) only found {num_parts_found} part(s). Using all available.")


    return equipment_found

# ==============================================================================
# 4. MAIN EXECUTION FLOW
# ==============================================================================

print("\n--- Starting Data Extraction Process ---")

# 1. Fetch ALL data from the sheet
print("1. Fetching full sheet data (required for row-by-row traversal)...")
try:
    result = sheet.get(
        spreadsheetId=SPREADSHEET_ID,
        includeGridData=True,
        # Requesting only the rowData simplifies the response structure
        fields="sheets(data(rowData(values(userEnteredValue,formattedValue))))"
    ).execute()
    full_data = result['sheets'][0]['data'][0]['rowData']
    data_start_row_0based = find_data_start(full_data)
    print(f"   Successfully fetched {len(full_data)} rows. Data likely starts at row {data_start_row_0based + 1}.")
except Exception as e:
    print(f"FATAL ERROR: Could not fetch sheet data. Details: {e}")
    sys.exit(1)

# 2. EXTRACT data from the source equipment
print(f"\n2. Extracting data for: {TARGET_EQUIPMENT_EXTRACT}")
extracted_data = extract_equipment_data(full_data, TARGET_EQUIPMENT_EXTRACT, data_start_row_0based)

# 3. Output as JSON
print("\n3. Generating JSON Output")
print("--------------------------")

if extracted_data:
    # Use a list for the final JSON output, wrapping the single equipment dictionary
    output_json_data = [extracted_data]

    # Print to console
    print(json.dumps(output_json_data, indent=4))

    # Save to file
    filename = f"equipment_{TARGET_EQUIPMENT_EXTRACT.replace('-', '_')}_data.json"
    try:
        with open(filename, 'w') as f:
            json.dump(output_json_data, f, indent=4)
        print(f"\n✅ Data successfully saved to '{filename}'")
    except Exception as e:
        print(f"❌ Error saving JSON file: {e}")
else:
    print(f"❌ Equipment '{TARGET_EQUIPMENT_EXTRACT}' not found in the sheet.")
    print("[]")