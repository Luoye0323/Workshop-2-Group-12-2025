import time
from google import genai
from google.genai import types

# === 1. Input PDF path ===
input_pdf_path = "/content/combined_tables.pdf"

# === 2. Define prompt ===
prompt = """
Analyze the pdf, then:

Part 1: From Bil of Material
Extract material for head and shell

Part2: From design data/specification:
- Fluid Name
- Insulation
- Design temperature value
- Design temperature unit
- Design pressure value
- Design pressure unit
- Operating temperature value
- Operating temperature unit
- Operating pressure value
- Operating pressure unit

Rules:
1.Marked as missed if no any information about a label
2.Marked insulation as 'no' if the value is "NIL" OR "-".
3.Marked insulation as 'yes' if has insulation.
4.DEGREE OF N.D.T not equivalent to insulation. IF no explicit mention of "insulation", mark as "MISSING"
5.Return in JSON format
6.Explain how u extract
"""
# === 4. Read PDF as bytes ===
with open(input_pdf_path, "rb") as f:
    pdf_bytes = f.read()

# === 5. Prepare contents ===
contents = [
    types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
    prompt,
]

generation_config = types.GenerateContentConfig(
     temperature=0.0
  )

# === 6. Send request to Gemini ===
response = client.models.generate_content(
    model="gemini-2.5-flash-lite",
    contents=contents,
    config = generation_config,
)

# === 7. Print the response ===
print(response.text)
