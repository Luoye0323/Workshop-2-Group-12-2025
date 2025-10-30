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


# === 0. setup gemini ===
os.environ["GEMINI_API_KEY"] = "your-api-key-here"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# === 1. detect and crop table region ===
def detect_table_regions(image_path):
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
        return image_path

    # pick the largest table region
    cropped_tables.sort(key=lambda t: t[0].shape[0] * t[0].shape[1], reverse=True)
    largest_table, (x, y, w, h) = cropped_tables[0]

    cropped_path = "cropped_table.jpg"
    cv2.imwrite(cropped_path, largest_table)
    print(f"📊 detected {len(cropped_tables)} tables, using largest one at ({x},{y},{w},{h})")
    return cropped_path


# === 2. load & preprocess ===
image_path = "/Users/muhammadputraazam/Desktop/uni/S5/workshop2/Workshop-2-Group-12-2025/llm_ai_approach/gemini/MLK PMT 10103 - V-003.png"
cropped_path = detect_table_regions(image_path)

with Image.open(cropped_path) as image:
    image = image.convert("RGB")
    image = image.resize((1600, 858))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=80)
    image_bytes = buffer.getvalue()
print(f"✅ image ready for analysis ({len(image_bytes)/1024:.1f} KB)")

# === 3. construct prompt ===
prompt = "Extract the tabular data from this image and return JSON format {'headers': [...], 'rows': [...]} (no text outside table)."
contents = [
    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
    prompt,
]

# === 4. safe retry wrapper ===
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

# === 5. send to gemini ===
print("\nconnecting...\n")
print("\n🚀 streaming request to gemini...\n")
start_time = time.time()

try:
    responses = safe_generate(client, "gemini-2.5-flash", contents)
except RuntimeError:
    model_name = "gemini-1.5-pro"
    print("⚙️ switching to gemini-1.5-pro...")
    responses = safe_generate(client, model_name, contents)

full_output = ""
usage = None

for response in responses:
    if response.text:
        print(response.text, end="", flush=True)
        full_output += response.text
    if hasattr(response, "usage_metadata"):
        usage = response.usage_metadata

elapsed = time.time() - start_time
print(f"\n\n⏱ execution time: {elapsed:.2f} seconds")

if usage:
    try:
        print(f"🪙 tokens → total: {usage.total_token_count}, input: {usage.prompt_token_count}, output: {usage.candidates_token_count}")
    except Exception:
        print("ℹ️ token usage not available")

# === 6. clean json output ===
def clean_text(text):
    return re.sub(r"```json|```", "", text, flags=re.IGNORECASE).strip()

cleaned = clean_text(full_output)
print("\n\n--- extracted json data ---")
print(cleaned)

def extract_json_from_text(text):
    match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

# === 7. convert json → excel ===
def json_to_excel(json_string, output_file="output.xlsx"):
    json_str = extract_json_from_text(json_string)
    if not json_str:
        print("\n❌ no json object found.")
        return

    try:
        data = js.loads(json_str)
        tables = []

        def collect_tables(obj):
            if isinstance(obj, dict):
                if "headers" in obj and "rows" in obj:
                    headers = obj["headers"]
                    rows = obj["rows"]

                    fixed_rows = []
                    for row in rows:
                        row = (row + [""] * len(headers))[:len(headers)]
                        fixed_rows.append(row)

                    df = pd.DataFrame(fixed_rows, columns=headers)
                    tables.append(df)
                else:
                    for v in obj.values():
                        collect_tables(v)
            elif isinstance(obj, list):
                for item in obj:
                    collect_tables(item)

        collect_tables(data)

        if not tables:
            print("\n⚠️ no structured tables found, flattening data...")
            tables.append(pd.DataFrame([data]))

        combined = pd.DataFrame()
        for i, table in enumerate(tables):
            if i > 0:
                combined = pd.concat([combined, pd.DataFrame([[""] * len(table.columns)])], ignore_index=True)
            combined = pd.concat([combined, table], ignore_index=True)

        with pd.ExcelWriter(output_file, engine="xlsxwriter") as writer:
            combined.to_excel(writer, index=False, sheet_name="Extracted_Data")
            workbook = writer.book
            worksheet = writer.sheets["Extracted_Data"]
            header_format = workbook.add_format({
                "bold": True,
                "bg_color": "#DCE6F1",
                "border": 1
            })
            for col_num, value in enumerate(combined.columns.values):
                worksheet.write(0, col_num, value, header_format)

        print(f"\n✅ saved excel file: {output_file}")

    except js.JSONDecodeError as e:
        print(f"\n❌ failed to decode json: {e}")
    except Exception as e:
        print(f"\n❌ error writing excel: {e}")


# === 8. run converter ===
json_to_excel(cleaned, "output.xlsx")
