#INSERT DATA INTO MASTERFILE

import string

def col_to_letter(col_index):
    """Converts a 0-based column index to a column letter (e.g., 1 -> 'B')."""
    if col_index < 0:
        return 'A'
    # Uses 1-based indexing for calculations: A=1, B=2, etc.
    col_str = ''
    while col_index >= 0:
        remainder = col_index % 26
        col_str = string.ascii_uppercase[remainder] + col_str
        col_index = col_index // 26 - 1
    return col_str

SERVICE_COUNT_FILE = " "
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = " "

creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
service = build('sheets', 'v4', credentials=creds)

# Example data: 3 rows × 3 columns
data = [
    ["H-004", "MLK PMT 10110", "Reflux Condenser of Drying Tower", "Channel", "Liquid", "Chilled Water", "Stainless Steel", "SA-240", "316", "/", "200", "12", " ", " "], # Row 1
    [" ", " ", " ", "Shell", "Liquid", "Vapour DMSO", "Stainless Steel", "SA-240", "316", "/", "210", "10", " ", " "],   # Row 2
    [" ", " ", " ", "Tube Bundle", "Liquid", "Chilled Water", "Stainless Steel", "SA-240", "316", "/", "200", "12", " ", " "], # Row 3
]

EQUIPMENT_NO = data[0][0]  # Extracts "H-004" from the first data row
SEARCH_COL_INDEX = 1       # Column B (where Equipment No. is located)

SHEET_DATA_RANGE = "Masterfile!B8:B"

# --- STEP 0: Find the Starting Row based on Equipment No. ---
def find_equipment_row(service, spreadsheet_id, search_range, equipment_no, search_col_index):
    """Searches a column for the Equipment No. and returns the 0-based row index."""
    try:
        # Fetch only the column values
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=search_range
        ).execute()

        values = result.get('values', [])

        # Iterate through fetched values
        for i, row in enumerate(values):
            # The value is the first (and only) item in the row array
            cell_value = row[0] if row else ""

            # Use strip() to handle leading/trailing spaces
            if cell_value.strip() == equipment_no.strip():
                return i + 8 # Return 0-based index

        return -1  # Equipment No. not found

    except Exception as e:
        print(f"Error finding equipment row: {e}")
        return -1

# Execute the search
sheet_start_row = find_equipment_row(service, SPREADSHEET_ID, SHEET_DATA_RANGE, EQUIPMENT_NO, SEARCH_COL_INDEX)

if sheet_start_row == -1:
    print(f"Equipment No. {EQUIPMENT_NO} not found in sheet. Aborting update.")
    # Exit or handle the case where the entry doesn't exist (e.g., append new data)
    exit()

# The start_row_index is determined dynamically
# Note: sheet_start_row is 1-based, we convert it to 0-based for the rest of the script
start_row_index = sheet_start_row - 1
start_col_index = 1  # Starting at column B to insert the data

# --- STEP 1: Calculate the Full Bounding Box Range ---
num_rows = len(data)
# Assumes all rows have the same number of columns as the first row
num_cols = len(data[0])

# Calculate the end row and end column letters
end_row_index = start_row_index + num_rows
end_col_index = start_col_index + num_cols - 1 # -1 because it's 0-based

start_cell = f"{col_to_letter(start_col_index)}{start_row_index + 1}"
end_cell = f"{col_to_letter(end_col_index)}{end_row_index}"
full_range = f"Masterfile!{start_cell}:{end_cell}"

# --- STEP 2: Fetch Existing Data ---
try:
    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=full_range
    ).execute()
    existing_values = result.get('values', [])
except Exception as e:
    print(f"Error fetching existing data: {e}")
    # If fetch fails, fall back to using only the new data (full overwrite)
    existing_values = []

# --- STEP 3: Merge New Data with Existing Data ---
merged_values = []

for r in range(num_rows):
    new_row = data[r]
    # Get the existing row, padding with empty strings if it doesn't exist
    existing_row = existing_values[r] if r < len(existing_values) else []

    merged_row = []
    for c in range(num_cols):
        new_value = new_row[c]

        # Check if the new value is empty (whitespace/blank)
        is_new_value_blank = (
            new_value is None or
            (isinstance(new_value, str) and new_value.strip() == "")
        )

        if is_new_value_blank:
            # If the new value is blank, use the existing value
            existing_value = existing_row[c] if c < len(existing_row) else ""
            merged_row.append(existing_value)
        else:
            # If the new value is NOT blank, use the new value
            merged_row.append(new_value)

    merged_values.append(merged_row)

# --- STEP 4: Update the Sheet with Merged Data ---

body = {"values": merged_values}

# The range must be the full bounding box range calculated in Step 1
update_result = service.spreadsheets().values().update(
    spreadsheetId=SPREADSHEET_ID,
    range=full_range,
    valueInputOption="RAW",
    body=body
).execute()