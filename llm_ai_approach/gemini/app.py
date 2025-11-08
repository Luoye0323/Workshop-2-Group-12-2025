import os
import io
import re
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


# --- process single page/image ---
def process_single_page(image_or_bytes, page_num, total_pages, source_type="image"):
    """
    Process a single page/image and extract all tables
    """
    # Convert to bytes if needed
    if isinstance(image_or_bytes, Image.Image):
        buffer = io.BytesIO()
        image_or_bytes = image_or_bytes.convert("RGB")
        image_or_bytes.save(buffer, format="JPEG", quality=85)
        image_bytes = buffer.getvalue()
    else:
        image_bytes = image_or_bytes
    
    prompt = f"""Analyze this {source_type} (page {page_num}/{total_pages}) and extract ALL tables found.

INSTRUCTIONS:
1. Detect ALL tables in this page (there may be multiple tables)
2. For EACH table found, extract complete data
3. Extract EVERY single cell - do not skip or omit any data
4. Preserve the EXACT table structure (all rows and columns)
5. Include ALL headers exactly as they appear
6. Include ALL rows - even if cells are empty, represent them as empty strings ""
7. Maintain column alignment - each row must have the same number of columns as headers
8. Include numbers, text, symbols, and special characters exactly as shown
9. Do not merge, summarize, or truncate any data
10. Please check the top right and bottom - these are the location the tables are normally located.

If NO tables are found, return: {{"tables": []}}

If tables ARE found, return JSON in this EXACT format:
{{
  "tables": [
    {{
      "table_number": 1,
      "headers": ["col1", "col2", "col3", ...],
      "rows": [["val1", "val2", "val3", ...], ["val1", "val2", "val3", ...], ...]
    }},
    {{
      "table_number": 2,
      "headers": ["col1", "col2", ...],
      "rows": [["val1", "val2", ...], ...]
    }}
  ]
}}

Return ONLY valid JSON - no markdown, no explanations, no additional text."""
    
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        prompt,
    ]

    print(f"\n🚀 Analyzing page {page_num}/{total_pages} for tables...\n")
    start_time = time.time()

    try:
        responses = safe_generate(client, "gemini-2.5-flash", contents)
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
    print(f"\n\n⏰ Page {page_num} analysis time: {elapsed:.2f} seconds")

    if usage:
        try:
            print(f"🪙 Tokens → total: {usage.total_token_count}, input: {usage.prompt_token_count}, output: {usage.candidates_token_count}")
        except Exception as e:
            print(f"ℹ️ Token usage not available: {e}")

    return clean_text(full_output)


# --- process PDF with native Gemini (Option A: Using Gemini's PDF support) ---
def process_pdf_native(pdf_path):
    """
    Process PDF directly using Gemini's native PDF support (if available)
    This is more efficient as it doesn't require conversion
    """
    print(f"\n{'='*60}")
    print(f"📂 Processing PDF: {Path(pdf_path).name}")
    print(f"📄 Using native PDF processing (all pages)")
    print(f"{'='*60}\n")
    
    # Read PDF file
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    prompt = """Analyze this PDF document and extract ALL tables from ALL pages.

INSTRUCTIONS:
1. Scan through ALL pages in the PDF
2. Detect and extract ALL tables found across all pages
3. For EACH table found:
   - Extract EVERY single cell without omission
   - Preserve EXACT table structure (all rows and columns)
   - Include ALL headers exactly as they appear
   - Include ALL rows (empty cells as "")
   - Maintain column alignment
   - Include all special characters exactly as shown
4. Indicate which page each table was found on

Return JSON in this EXACT format:
{{
  "tables": [
    {{
      "page": 1,
      "table_number": 1,
      "headers": ["col1", "col2", ...],
      "rows": [["val1", "val2", ...], ...]
    }},
    {{
      "page": 2,
      "table_number": 2,
      "headers": ["col1", "col2", ...],
      "rows": [["val1", "val2", ...], ...]
    }}
  ]
}}

If NO tables found, return: {{"tables": []}}
Return ONLY valid JSON - no markdown, no explanations."""
    
    contents = [
        types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
        prompt,
    ]

    print("\n🚀 Sending PDF to Gemini for analysis...\n")
    start_time = time.time()

    try:
        responses = safe_generate(client, "gemini-2.5-flash", contents)
    except RuntimeError:
        print("⚙️ Switching to gemini-1.5-pro...")
        responses = safe_generate(client, "gemini-1.5-pro", contents)
    except Exception as e:
        print(f"⚠️ Native PDF processing failed: {e}")
        print("📌 Falling back to page-by-page image processing...")
        return None
    
    full_output = ""
    usage = None

    for response in responses:
        if response.text:
            print(response.text, end="", flush=True)
            full_output += response.text
        if hasattr(response, "usage_metadata"):
            usage = response.usage_metadata

    elapsed = time.time() - start_time
    print(f"\n\n⏰ Total processing time: {elapsed:.2f} seconds")

    if usage:
        try:
            print(f"🪙 Tokens → total: {usage.total_token_count}, input: {usage.prompt_token_count}, output: {usage.candidates_token_count}")
        except Exception as e:
            print(f"ℹ️ Token usage not available: {e}")

    return clean_text(full_output)


# --- process multi-page PDF (Option B: Convert to images) ---
def process_pdf_as_images(pdf_path):
    """
    Process PDF by converting each page to image
    Fallback option if native PDF processing fails
    """
    print(f"\n{'='*60}")
    print(f"📂 Processing PDF: {Path(pdf_path).name}")
    print(f"📄 Converting pages to images for processing")
    print(f"{'='*60}\n")
    
    # Convert all pages to images
    print("🔄 Converting PDF pages to images...")
    pages = convert_from_path(pdf_path, dpi=200)
    total_pages = len(pages)
    print(f"✅ Found {total_pages} page(s)\n")
    
    all_tables = []
    
    # Process each page
    for page_num, page_image in enumerate(pages, 1):
        print(f"\n{'─'*60}")
        print(f"Processing Page {page_num}/{total_pages}")
        print(f"{'─'*60}")
        
        json_output = process_single_page(page_image, page_num, total_pages, source_type="PDF page")
        
        # Parse JSON and add page info
        try:
            json_str = extract_json_from_text(json_output)
            if json_str:
                data = js.loads(json_str)
                
                if "tables" in data and data["tables"]:
                    for table in data["tables"]:
                        table["page"] = page_num  # Add page number
                        all_tables.append(table)
                    print(f"\n✅ Found {len(data['tables'])} table(s) on page {page_num}")
                else:
                    print(f"\n⚠️ No tables found on page {page_num}")
        except Exception as e:
            print(f"\n❌ Error parsing page {page_num}: {e}")
        
        # Delay between pages to avoid rate limiting
        if page_num < total_pages:
            time.sleep(2)
    
    # Combine all tables
    combined_output = {"tables": all_tables}
    return js.dumps(combined_output)


# --- process single file (PDF or Image) ---
def process_single_file(file_path, output_file="output.xlsx"):
    print(f"\n{'='*60}")
    print(f"📂 Processing: {Path(file_path).name}")
    print(f"{'='*60}\n")
    
    file_path_lower = file_path.lower()
    
    if file_path_lower.endswith('.pdf'):
        # Try native PDF processing first
        print("📋 Attempting native PDF processing...")
        json_output = process_pdf_native(file_path)
        
        # If native PDF fails, fall back to image conversion
        if json_output is None or not json_output.strip():
            print("\n📋 Using page-by-page image processing...")
            json_output = process_pdf_as_images(file_path)
    else:
        # Process as image
        print("🖼️ Processing as image file...")
        image = Image.open(file_path)
        json_output = process_single_page(image, 1, 1, source_type="image")
    
    # Save to Excel
    print("\n" + "="*60)
    save_tables_to_excel(json_output, output_file)
    
    return output_file


# === safe retry wrapper ===
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


# === save all tables to excel ===
def save_tables_to_excel(json_string, output_file="output.xlsx"):
    """
    Save all detected tables to Excel file
    """
    print(f"\n💾 Saving extracted tables to Excel...")
    print(f"{'='*60}\n")
    
    json_str = extract_json_from_text(json_string)
    if not json_str:
        print("❌ No JSON data found.")
        return
    
    try:
        data = js.loads(json_str)
        
        if "tables" not in data or not data["tables"]:
            print("⚠️ No tables found in the document.")
            return
        
        tables = data["tables"]
        print(f"📊 Found {len(tables)} table(s) to save\n")
        
        with pd.ExcelWriter(output_file, engine="xlsxwriter") as writer:
            workbook = writer.book
            header_format = workbook.add_format({
                "bold": True,
                "bg_color": "#DCE6F1",
                "border": 1
            })
            
            # Save each table to separate sheet
            for idx, table in enumerate(tables, 1):
                page = table.get("page", "?")
                table_num = table.get("table_number", idx)
                
                if "headers" not in table or "rows" not in table:
                    print(f"⚠️ Table {idx} has invalid structure, skipping...")
                    continue
                
                headers = table["headers"]
                rows = table["rows"]
                
                # Fix row lengths
                fixed_rows = []
                for row in rows:
                    row = (row + [""] * len(headers))[:len(headers)]
                    fixed_rows.append(row)
                
                df = pd.DataFrame(fixed_rows, columns=headers)
                
                # Create sheet name
                sheet_name = f"Page{page}_Table{table_num}"
                # Excel sheet names max 31 chars
                if len(sheet_name) > 31:
                    sheet_name = f"P{page}_T{table_num}"
                
                df.to_excel(writer, index=False, sheet_name=sheet_name)
                
                # Format headers
                worksheet = writer.sheets[sheet_name]
                for col_num, value in enumerate(df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                
                print(f"✅ Table {idx} (Page {page}) → Sheet '{sheet_name}' ({len(rows)} rows, {len(headers)} columns)")
            
            # Create combined sheet
            print("\n📑 Creating combined sheet...")
            combined = pd.DataFrame()
            
            for idx, table in enumerate(tables, 1):
                if "headers" not in table or "rows" not in table:
                    continue
                
                headers = table["headers"]
                rows = table["rows"]
                page = table.get("page", "?")
                
                # Fix rows
                fixed_rows = []
                for row in rows:
                    row = (row + [""] * len(headers))[:len(headers)]
                    fixed_rows.append(row)
                
                df = pd.DataFrame(fixed_rows, columns=headers)
                
                # Add page indicator row
                if not combined.empty:
                    separator = pd.DataFrame([[f"--- Page {page}, Table {idx} ---"] + [""]*(len(headers)-1)], columns=headers)
                    combined = pd.concat([combined, separator], ignore_index=True)
                
                combined = pd.concat([combined, df], ignore_index=True)
            
            if not combined.empty:
                combined.to_excel(writer, index=False, sheet_name="All_Tables")
                worksheet = writer.sheets["All_Tables"]
                for col_num, value in enumerate(combined.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                print("✅ Combined sheet created")
        
        print(f"\n✅ Saved Excel file: {output_file}")
        print(f"{'='*60}\n")
        
    except js.JSONDecodeError as e:
        print(f"❌ Failed to decode JSON: {e}")
    except Exception as e:
        print(f"❌ Error saving to Excel: {e}")


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
        print(f"❌ Invalid path: {input_path}")
        return
    
    if not files:
        print("❌ No valid files found!")
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
            print(f"❌ Error processing {file_path.name}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "file": file_path.name,
                "status": f"❌ Failed: {str(e)[:50]}",
                "output": None
            })

    # print summary
    print(f"\n\n{'='*60}")
    print("📊 PROCESSING SUMMARY")
    print(f"{'='*60}")
    for result in results:
        status_icon = "✅" if "Success" in result["status"] else "❌"
        print(f"{status_icon} {result['file']}")
        if result['output']:
            print(f"   → {result['output']}")
    print(f"{'='*60}\n")


# === MAIN EXECUTION ===
if __name__ == "__main__":
    # OPTION 1: Process single file
    single_file = "/Users/muhammadputraazam/Desktop/uni/S5/workshop2/Workshop-2-Group-12-2025/llm_ai_approach/gemini/MLK PMT 10110 - H-004.pdf"
    process_single_file(single_file, f"output_gemini_{Path(single_file).stem.name}.xlsx")
    
    # OPTION 2: Process entire folder (bulk)
    # folder_path = "/Users/muhammadputraazam/Desktop/uni/S5/workshop2/Workshop-2-Group-12-2025/llm_ai_approach/gemini"
    # process_bulk_files(folder_path, output_folder="extracted_tables")


