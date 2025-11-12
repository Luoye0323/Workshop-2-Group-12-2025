#This python script used to test the performance of Gemini-2.5-pro on the 10 samples pdf files. It extract required fields from a GA drawing.
import time
import json
from google import genai
from google.genai import types

# === 1. Initialize the client ===
client = genai.Client(api_key="YOUR_API_KEY)

# === 2. Load PDF file ===
pdf_path = "/content/MLK PMT 10106 - V -006.pdf"
with open(pdf_path, "rb") as f:
    pdf_bytes = f.read()
print(f"✅ PDF loaded: {len(pdf_bytes)/1024:.1f} KB")

# === 3. Prepare prompt and contents ===
prompt = """
Rules:
Return the result strictly in JSON format only.
When one part has insulation, then other part also has insulation except for tube.
Design and operating data for "shell" refer to the "shell side";Design and operating data for "channel" and "tube" refer to the "tube side".
If pressure or temperature for a side has more than 1 value or "-" or "/", then copy all.
If you cannot find insulation,operating/design temperature or pressure, marks its value as "missed"
Do not interpret, correct, or infer missing values.
You must double check your answer to ensure the accuracy.

Fields to extract for head, shell:
From material:
-Specification
-Grade (remove Gr)
From design data:
-Fluid
-Insulation (yes/no)
-Design temperature (no unit)
-Design pressure (MPa)
-Operating temperature (no unit)
-Operating pressure (MPa)
"""

contents = [
    types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
    prompt,
]

# === 4. Stream response ===
print("\n⏳ Streaming request to Gemini model...\n")
full_output = ""
last_response = None
start_time = time.time()

for response in client.models.generate_content_stream(
    model="gemini-2.5-pro",
    contents=contents
):
    if response.text:
        print(response.text, end="", flush=True)
        full_output += response.text
    last_response = response  # ✅ capture the last response

end_time = time.time()
duration = end_time - start_time

# === 5. Extract token usage ===
input_tokens = output_tokens = total_tokens = None
if last_response and getattr(last_response, "usage_metadata", None):
    usage = last_response.usage_metadata
    input_tokens = getattr(usage, "prompt_token_count", None)
    output_tokens = getattr(usage, "candidates_token_count", None)
    total_tokens = getattr(usage, "total_token_count", None)
else:
    print("\n⚠️ No usage metadata found (stream may have ended early or SDK version issue).")

# === 6. Final summary ===
print("\n\n--- Performance Summary ---")
print(f"🕒 Start Time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time))}")
print(f"🕒 End Time:   {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(end_time))}")
print(f"⚡ Total Duration: {duration:.2f} seconds")
print(f"🔢 Input Tokens:  {input_tokens}")
print(f"🔢 Output Tokens: {output_tokens}")
