import os
import time
from google import genai
from google.genai import types
import re
import json

input_folder = "/content/output_images"
image_files = sorted([f for f in os.listdir(input_folder) if f.lower().endswith(".jpg")])

def detect_tables(input_image_path):

  # === 1. Read image as bytes ===
  with open(input_image_path, "rb") as f:
     image_bytes = f.read()

  # === 2. Define prompt ===
  prompt = """
  Analyze the uploaded image and detect all tables(complete/partial).
  Use JSON format as a list of objects using the structure:
  {"table": [ymin, xmin, ymax, xmax]}
  - Coordinates must be normalized to a 0–1000 scale.
  - Example output when tables are detected:
  [
    {"table": [100, 50, 400, 300]},
   {"table": [450, 100, 700, 500]}
  ]
  - If no table is detected, return:
  [
   {"table": "null"}
  ]
  """


  # === 3. Prepare contents (image + prompt) ===
  contents = [
     types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
      prompt,
  ]

  generation_config = types.GenerateContentConfig(
     temperature=0.0
  )

  # === 4. Generate response ===
  response = client.models.generate_content(
     model="gemini-2.0-flash-lite",
      contents=contents,
      # 2. Pass it to the 'config' parameter
     config=generation_config
  )

  return response.text


def convert_to_json(json_output):
  match = re.search(r"```json\s*(.*?)\s*```", json_output, re.DOTALL)

  if match:
      json_str = match.group(1)
      try:
          return json.loads(json_str)
      except json.JSONDecodeError:
          # If parsing fails, assume no table detected
          return [{"table": "null"}]
  else:
      # If no JSON found in response
      return [{"table": "null"}]



def crop_table(tables_data, image_path, counter):
    print(tables_data)
    img = Image.open(image_path)
    width, height = img.size

    tolerance = 25

    if tables_data[0]["table"] == "null":
        print("⚠️ No table detected in this image.")
        return counter

    for i, item in enumerate(tables_data):
        ymin, xmin, ymax, xmax = item["table"]

        y1 = max(0, int((ymin - tolerance) / 1000 * height))
        x1 = max(0, int((xmin - tolerance) / 1000 * width))
        y2 = min(height, int((ymax + tolerance) / 1000 * height))
        x2 = min(width, int((xmax + tolerance) / 1000 * width))

        crop = img.crop((x1, y1, x2, y2))
        if counter is None:
            counter = 0

        print("counter", counter)
        crop.save(f"/content/cropped_table_{counter+1}.jpg")
        counter += 1   # update counter for multiple tables

    return counter     # return AFTER loop



# === Process all images ===
results = {}
counter =0
for idx, filename in enumerate(image_files, start=1):
    full_path = os.path.join(input_folder, filename)
    print(f"\n🔍 Processing Image {idx}: {filename}")

    json_output = detect_tables(full_path)
    json_coordina = convert_to_json(json_output)
    counter = crop_table(json_coordina,full_path,counter)
    time.sleep(0.5)  # pause for 0.5 seconds
