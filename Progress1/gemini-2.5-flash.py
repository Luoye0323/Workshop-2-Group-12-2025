#This script currently accept jpg file as input.
import os
from google import genai
from google.genai import types
from PIL import Image

#Set Gemini API key
os.environ["GEMINI_API_KEY"] = "YOUR_API_KEY"
#Initialize Gemini client
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


# === 1. Load, resize & compress image (in-memory) ===
image_path = "/content/MLK PMT 10101 - V-001_page-0001.jpg" //Change to your image path
with Image.open(image_path) as image:
    image = image.convert("RGB")
    image = image.resize((1600, 858))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=70)
    image_bytes = buffer.getvalue()
print(f"✅ Image resized & compressed: {len(image_path):,} bytes → {len(image_bytes)/1024:.1f} KB")

# === 2. Construct the multimodal content list ===
prompt = "Extract the all the data and return in JSON format."
contents = [
    types.Part.from_bytes(
        data=image_bytes,
        mime_type="image/jpeg",
    ),
    prompt,
]

# === 3. Stream model output ===
print("\nStreaming request to Gemini model...\n")

full_output = ""
for response in client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents=contents
):
    if response.text:
        print(response.text, end="", flush=True)
        full_output += response.text

print("\n\n--- Extracted JSON Data ---")
print(full_output)
