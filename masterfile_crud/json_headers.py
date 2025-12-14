# pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
import json

# Your existing setup
SERVICE_ACCOUNT_FILE = "/content/gen-lang-client-0609270912-2ea623f8aeba.json"
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SPREADSHEET_ID = "1cftK61YjCxjY9S4gP6BylwTXXk9NtyqGs0Tt1gd-ZmE"

# Authenticate
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
service = build('sheets', 'v4', credentials=creds)

# Get sheet data with formatting AND merges
sheet = service.spreadsheets()
result = sheet.get(
    spreadsheetId=SPREADSHEET_ID,
    includeGridData=True,
    fields="sheets(properties,merges,data(rowData(values(userEnteredValue,formattedValue,userEnteredFormat))))"
).execute()

sheet_data = result['sheets'][0]
data = sheet_data['data'][0]['rowData']
merges = sheet_data.get('merges', [])

# Yellow RGB definition (Google Sheets normalized values)
YELLOW_RGB = {'red': 1.0, 'green': 1.0, 'blue': 0.0}
TOLERANCE = 0.1  # Increased tolerance for color matching

def is_yellow_cell(cell):
    """Check if a cell has yellow background color"""
    if not cell or 'userEnteredFormat' not in cell:
        return False

    fmt = cell.get('userEnteredFormat', {})
    if 'backgroundColor' not in fmt:
        return False

    color = fmt['backgroundColor']
    # Check if color matches yellow within tolerance
    try:
        return all(abs(color.get(c, 0) - YELLOW_RGB[c]) < TOLERANCE
                  for c in ['red', 'green', 'blue'])
    except KeyError:
        return False

def get_merge_range(row_idx, col_idx, merges):
    """Check if cell is part of a merge and return merge dimensions"""
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

def build_json_headers(data, merges, max_rows=10):
    """Build JSON header mapping from yellow cells"""

    # Step 1: Collect all yellow cells with their hierarchy
    yellow_cells = []

    for row_idx, row in enumerate(data[:max_rows]):
        if 'values' not in row:
            continue

        for col_idx, cell in enumerate(row['values']):
            if is_yellow_cell(cell):
                cell_value = cell.get('formattedValue', '').strip()
                if not cell_value:
                    continue

                merge_info = get_merge_range(row_idx, col_idx, merges)

                # Check if this is the top-left cell of a merge
                is_merge_primary = (merge_info and
                                  merge_info['startRow'] == row_idx and
                                  merge_info['startCol'] == col_idx)

                yellow_cells.append({
                    'row': row_idx,
                    'col': col_idx,
                    'value': cell_value,
                    'merge_info': merge_info if is_merge_primary else None,
                    'is_merge_primary': is_merge_primary
                })

    # Step 2: Sort by row (top to bottom) then column (left to right)
    yellow_cells.sort(key=lambda x: (x['row'], x['col']))

    # Step 3: Build hierarchical header structure
    # Track headers by column position
    column_headers = {}

    # First pass: Collect all headers for each column
    for cell in yellow_cells:
        col_idx = cell['col']
        col_letter = chr(65 + col_idx)
        merge_info = cell['merge_info']

        # Initialize column if not exists
        if col_letter not in column_headers:
            column_headers[col_letter] = []

        # Add this header value
        column_headers[col_letter].append(cell['value'])

        # Handle merged cells - apply header to all spanned columns
        if merge_info:
            for spanned_col in range(col_idx + 1, col_idx + merge_info['colSpan']):
                spanned_letter = chr(65 + spanned_col)
                if spanned_letter not in column_headers:
                    column_headers[spanned_letter] = []
                # Copy the headers from the primary column
                column_headers[spanned_letter] = column_headers[col_letter].copy()

    # Step 4: Create JSON structure with proper formatting
    json_headers = {}

    for col_letter in sorted(column_headers.keys()):
        headers_list = column_headers[col_letter]

        # Remove duplicates while preserving order
        unique_headers = []
        for h in headers_list:
            if h not in unique_headers:
                unique_headers.append(h)

        # Create the header path
        if len(unique_headers) == 1:
            header_path = unique_headers[0]
        else:
            header_path = ' '.join(unique_headers)

        # Clean up any newlines in the header text
        header_path = header_path.replace('\n', ' ').replace('\r', ' ')

        json_headers[col_letter] = header_path

    return json_headers

# Build the JSON headers
json_headers = build_json_headers(data, merges, max_rows=10)

# Output as JSON with proper formatting
print("JSON Headers Output:")
print("=" * 60)

# Option 1: Print as valid Python dictionary (for copy-paste)
print("\n1. As Python dictionary:")
print("headers = {")
for col_letter, header in sorted(json_headers.items()):
    # Escape quotes in header text
    escaped_header = header.replace("'", "\\'")
    print(f"    '{col_letter}': '{escaped_header}',")
print("}")

# Option 2: Print as JSON string
print("\n2. As JSON string:")
json_output = json.dumps(json_headers, indent=2, ensure_ascii=False)
print(json_output)

# Option 3: Save to file
print("\n3. Saving to file 'headers.json'...")
with open('headers.json', 'w', encoding='utf-8') as f:
    json.dump(json_headers, f, indent=2, ensure_ascii=False)
print("Saved successfully!")

print("\n" + "=" * 60)
print(f"\nTotal columns with yellow headers: {len(json_headers)}")
print(f"Column range: {min(json_headers.keys())} to {max(json_headers.keys())}")

# Show a preview
print("\nPreview of JSON structure:")
preview_cols = list(sorted(json_headers.keys()))[:5]
for col in preview_cols:
    print(f"  {col}: {json_headers[col][:50]}...")
if len(json_headers) > 5:
    print(f"  ... and {len(json_headers) - 5} more columns")