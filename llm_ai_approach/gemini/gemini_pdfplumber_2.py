import os
import io
import re
import cv2
import numpy as np
import time
import pandas as pd
import json as js
import xlsxwriter
from google import genai
from google.genai import types, errors as genai_errors
from PIL import Image
from pdf2image import convert_from_path
from pathlib import Path


# === setup gemini ===
os.environ["GEMINI_API_KEY"] = "AIzaSyCUN3KvVvx57LtX27awuK_jdCmVPtTtP4w"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# === detect and crop table region ===
def detect_table_regions(image_path):
    # PDF conversion -> image (readable)
    if image_path.lower().endswith('.pdf'):
        print("📄 Converting PDF to image for table detection...")
        pages = convert_from_path(image_path, first_page=1, last_page=1, dpi=200)
        pil_image = pages[0]
        img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2GRAY)
    else:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        raise FileNotFoundError(f"Cannot open {image_path}")

    _, threshold = cv2.threshold(img, 180, 255, cv2.THRESH_BINARY_INV)

    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    horizontal_lines = cv2.morphologyEx(threshold, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_lines = cv2.morphologyEx(threshold, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    table_mask = cv2.add(horizontal_lines, vertical_lines)
    contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    cropped_tables = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 200 and h > 80:  # filter out small boxes
            cropped = img[y:y+h, x:x+w]
            cropped_tables.append((cropped, (x, y, w, h)))

    if not cropped_tables:
        print("⚠️ no tables detected, using original image instead.")
        # Return flag to indicate no crop happened
        return [], False

    # sort by position (top to bottom, left to right) 
    cropped_tables.sort(key=lambda t: (t[1][1], t[1][0]))

    saved_tables = []

    for idx, (table_img, (x, y, w, h)) in enumerate(cropped_tables):
        cropped_path = f"cropped_table_{idx+1}.jpg"
        cv2.imwrite(cropped_path, table_img)
        saved_tables.append({
            'path' : cropped_path,
            'coords' : (x, y, w, h),
            'index' : idx + 1
        })
    print(f"📊 detected {len(saved_tables)} table(s)")
    for table in saved_tables:
        x, y, w, h = table['coords']
        print(f"    Table {table['index']}: position ({x},{y}), size ({w}*{h})")
    
    return saved_tables, True

# --- process single table ---
def process_single_table(image_bytes, table_num, total_tables):
    # prompt = f"Extract the tabular data form this image (Table {table_num}/{total_tables}) and return ONLY JSON format {{'headers': [...], 'rows': [...]}}"
    prompt = f"""Extract ALL data from the table in this image (Table {table_num}/{total_tables}).
    
    CRITICAL REQUIREMENTS:
    1. Extract EVERY single cell - do not skip or omit any data
    2. Preserve the EXACT table structure (all rows and columns)
    3. Include ALL headers exactly as they appear
    4. Include ALL rows - even if the cells are empty, represent them as empty strings ""
    5. Maintain column alignment - each row must have the same number of columns as headers
    6. Do not merge, summarize, or truncate any data
    7. Include numbers, text, symbols, and special characters exactly as shown
    8. Give attention to the top right and bottom area - this area is normally the table will located.

    Return ONLY valid JSON in this EXACT format:
    {{"headers": ["col1", "col2", "col3", ...], "rows": [["val1", "val2", "val3", ...], ["val1", "val2", "val3", ...], ...]}}

    No additional text, explanations, or markdown - ONLY the JSON object.
    
    """
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        prompt,
    ]

    print(f"\n🚀 Streaming request for Gemini for Table {table_num}/{total_tables} ...\n")
    start_time = time.time()

    try:
        responses = safe_generate(client, "gemini-2.5-flash", contents)
        print("⚙️ Running on gemini-2.5-flash ...")
    except RuntimeError:
        print("⚙️ Switching to gemini-1.5-pro...")
        responses = safe_generate(client, "gemini-1.5-pro", contents)
    
    full_output = ""
    usage = None

    for response in responses:
        if response.text:
            print(response.text, end="", flush=True)
            full_output += response.text
            if hasattr(response, "usage_metadata"):
                usage = response.usage_metadata

    elapsed = time.time() - start_time
    print(f"\n\n ⏰ Table {table_num} execution time: {elapsed:.2f} seconds")

    if usage:
        try:
            print(f"🪙 Tokens -> total: {usage.total_token_count}, input: {usage.prompt_token_count}, output: {usage.candidates_token_count}")
        except Exception as e:
            print(f"ℹ️ Token usage not available: {e}")

    return clean_text(full_output)


# --- process single file with all tables ---
def process_single_file(image_path, output_file="output.xlsx"):
    print(f"\n{'='*60}")
    print(f"📂 Processing: {Path(image_path).name}")
    print(f"{'='*60}\n")
    
    detected_tables, tables_found = detect_table_regions(image_path)

    all_table_data = []
    
    if not tables_found:
        print("Processing entire image...")

        if image_path.lower().endswith('.pdf'):
            pages = convert_from_path(image_path, first_page=1, last_page=1, dpi=200)
            image = pages[0]
        else:
            image = Image.open(image_path)
    
    # Convert to bytes 
        image = image.convert("RGB")
        image = image.resize((1600, 858))
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=80)
        image_bytes = buffer.getvalue()

        json_data = process_single_table(image_bytes, 1, 1)
        all_table_data.append({
            'table_num': 1,
            'json_data': json_data
        })
    else:
        # process each detected table
        for table_info in detected_tables:
            table_num = table_info['index']
            table_path = table_info['path']

            print(f"\n === Processing Table {table_num}/{len(detected_tables)} ===")

            # process the table
            image = Image.open(table_path)
            image = image.convert("RGB")
            image = image.resize((1600, 858))
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=80)
            image_bytes = buffer.getvalue()
            print(f"✅ Table {table_num} ready ({len(image_bytes)/1024:.1f} KB)")

            json_data = process_single_table(image_bytes, table_num, len(detected_tables))
            all_table_data.append({
                'table_num': table_num,
                'json_data': json_data
            })

            # add small delay between requests to avoid rate limiting
            if table_num < len(detected_tables):
                time.sleep(1)
    
    save_all_tables_to_excel(all_table_data, output_file)

    # --- cleanup temporary files
    for table_info in detected_tables:
        try:
            os.remove(table_info['path'])
        except:
            pass
    return output_file

# === 3. safe retry wrapper ===
def safe_generate(client, model, contents, max_retries=3, delay=5):
    for attempt in range(1, max_retries + 1):
        try:
            return client.models.generate_content_stream(model=model, contents=contents)
        except genai_errors.ServerError as e:
            if e.code == 503:
                print(f"⚠️ {model} overloaded (attempt {attempt}/{max_retries}), retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise
    raise RuntimeError(f"❌ {model} overloaded too many times, giving up.")


# === clean json output ===
def clean_text(text):
    return re.sub(r"```json|```", "", text, flags=re.IGNORECASE).strip()


def extract_json_from_text(text):
    match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

def save_all_tables_to_excel(all_table_data, output_file="output.xlsx"):
    """
    Save all tables to Excel file
    option 1: multiple sheets (one per table)
    option 2: single sheet with separators
    """

    print(f"\n\n{'='*60}")
    print(f"💾 Saving {len(all_table_data)} table(s) to Excel...")
    print(f"{'='*60}\n")

    with pd.ExcelWriter(output_file, engine="xlsxwriter") as writer:
        workbook = writer.book
        header_format = workbook.add_format({
            "bold": True,
            "bg_color": "#DCE6F1",
            "border": 1
        })

        # --- option 1 -> save each table to separate sheets ---
        for table_data in all_table_data:
            table_num = table_data['table_num']
            json_string = table_data['json_data']

            print(f"Processing Table {table_num} ...")

            json_str = extract_json_from_text(json_string)
            if not json_str:
                print(f"⚠️ No JSON found for the Table {table_num}")
                continue

            try:
                data = js.loads(json_str)

                # extract headers and rows
                if isinstance(data, dict) and "headers" in data and "rows" in data:
                    headers = data["headers"]
                    rows = data["rows"]

                    # fix the row length
                    fixed_rows = []
                    for row in rows:
                        row = (row + [""] * len(headers))[:len(headers)]
                        fixed_rows.append(row)
                    
                    df = pd.DataFrame(fixed_rows, columns=headers)

                    # write to separate sheet
                    sheet_name = f"Table_{table_num}"
                    df.to_excel(writer, index=False, sheet_name=sheet_name)

                    # format the headers
                    worksheet = writer.sheets[sheet_name]
                    for col_num, value in enumerate(df.columns.values):
                        worksheet.write(0, col_num, value, header_format)

                    print(f"✅ Table {table_num} saved to sheet '{sheet_name}")
                else:
                    print(f"⚠️ Table {table_num} has unexpected JSON structure")
            except js.JSONDecodeError as e:
                print(f"❌ Failed to decode JSON for Table {table_num}: {e}")
            except Exception as e:
                print(f"❌ Error processing Table {table_num}: {e}")

        # option 2: also create a combined sheet with all the tables
        print("\n Creating combined sheet...")
        combined = pd.DataFrame()

        for table_data in all_table_data:
            json_str = extract_json_from_text(table_data['json_data'])
            if not json_str:
                continue

            try:
                data = js.loads(json_str)
                if isinstance(data, dict) and "headers" in data and "rows" in data:
                    headers = data["headers"]
                    rows = data["rows"]
                    fixed_rows = []
                    for row in rows:
                        row = (row + [""] * len(headers))[:len(headers)]
                        fixed_rows.append(row)
                    
                    df = pd.DataFrame(fixed_rows, columns=headers)

                    # add separator between tables
                    if not combined.empty:
                        separator = pd.DataFrame([[""] * len(df.columns)], columns=df.columns)
                        combined = pd.concat([combined, separator], ignore_index=True)
                    combined = pd.concat([combined, df], ignore_index=True)
            except:
                pass

        if not combined.empty:
            combined.to_excel(writer, index=False, sheet_name="All_Tables_Combined")
            worksheet = writer.sheets["All_Tables_Combined"]
            for col_num, value in enumerate(combined.columns.values):
                worksheet.write(0, col_num, value, header_format)
            print(f"\n✅ Combined sheet created")
    print(f"✅ Saved Excel file: {output_file}")

# --- bulk processing ---
def process_bulk_files(input_path, output_folder="output"):
    """ 
    Process single file or all files in a folder
    """

    input_path = Path(input_path)

    if input_path.is_file():
        files = [input_path]
    elif input_path.is_dir():
        files = (
            list(input_path.glob("*.pdf")) +
            list(input_path.glob("*.jpg")) +
            list(input_path.glob("*.jpeg")) +
            list(input_path.glob("*.png")) 
        )
    else:
        print(f"Invalid path: {input_path}")
    
    if not files:
        print("No valid files found!")
        return
    
    os.makedirs(output_folder, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"📁 Found {len(files)} file(s) to process")
    print(f"{'='*60}")

    results = []
    for i, file_path in enumerate(files, 1):
        print(f"\n\n{'#'*60}")
        print(f"[{i}/{len(files)}] Processing: {file_path.name}")
        print(f"{'#'*60}")

        try:
            output_file = os.path.join(output_folder, f"{file_path.stem}_extracted.xlsx")
            result_file = process_single_file(str(file_path), output_file)
            results.append({
                "file": file_path.name,
                "status": "✅ Success",
                "output": result_file
            })
        except Exception as e:
            print(f"Error processing {file_path.name}: {e}")
            results.append({
                "file": file_path.name,
                "status": f"❌ Failed: {str(e)[:50]}",
                "output": None
            })

    # ---print summary
    print(f"\n\n{'='*60}")
    print("📊 PROCESSING SUMMARY")
    print(f"{'='*60}")
    for result in results:
        status_icon = "✅" if "Success" in result["status"] else "❌"
        print(f"{status_icon} {result['file']}")
        if result['output']:
            print(f"   → {result['output']}")
    print(f"{'='*60}\n")


# --- main execution ---
if __name__ == "__main__":
    # OPTION 1: Process single file
    single_file = "/Users/muhammadputraazam/Desktop/uni/S5/workshop2/Workshop-2-Group-12-2025/llm_ai_approach/gemini/MLK PMT 10110 - H-004.pdf"
    process_single_file(single_file, f"output_{Path(single_file).name}.xlsx")
    
    # OPTION 2: Process entire folder (bulk)
    # folder_path = "/Users/muhammadputraazam/Desktop/uni/S5/workshop2/Workshop-2-Group-12-2025/llm_ai_approach/gemini"
    # process_bulk_files(folder_path, output_folder="extracted_tables")