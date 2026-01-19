import os
import io
import time 
import traceback
from google import genai
from google.genai import types
import fitz  # PyMuPDF
import json

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set in environment variables")

def get_gemini_client():
    """Get Gemini API client"""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    return genai.Client(api_key=GEMINI_API_KEY)


def split_pdf_for_ocr(pdf_bytes, dpi=300, overlap_percent=0.02):
    """
    Split PDF into 4 quadrants with percentage-based overlap for better OCR.
    
    Args:
        pdf_bytes: PDF file as bytes
        dpi: DPI for rendering (higher = better quality, slower)
        overlap_percent: Overlap percentage between quadrants (0.02 = 2%)
    
    Returns:
        bytes: Processed PDF as bytes
    """
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        new_pdf = fitz.open()

        for page in doc:
            w, h = page.rect.width, page.rect.height

            # 2x2 quadrants
            cols, rows = 2, 2
            piece_w, piece_h = w / cols, h / rows

            # Compute overlap
            overlap_x = piece_w * overlap_percent
            overlap_y = piece_h * overlap_percent

            for row in range(rows):
                for col in range(cols):
                    x1 = col * piece_w
                    y1 = row * piece_h
                    x2 = (col + 1) * piece_w
                    y2 = (row + 1) * piece_h

                    # Add overlap
                    rect = fitz.Rect(
                        max(0, x1 - overlap_x),
                        max(0, y1 - overlap_y),
                        min(w, x2 + overlap_x),
                        min(h, y2 + overlap_y)
                    )

                    # Render region (rotation is handled automatically by get_pixmap)
                    pix = page.get_pixmap(
                        clip=rect,
                        dpi=dpi,
                        colorspace=fitz.csGRAY
                    )

                    new_page = new_pdf.new_page(width=pix.width, height=pix.height)
                    new_page.insert_image(new_page.rect, pixmap=pix)

        # Save to bytes
        output_bytes = new_pdf.tobytes(deflate=True, garbage=4)
        new_pdf.close()
        doc.close()

        return output_bytes

    except Exception as e:
        print(f"Error splitting PDF:")
        traceback.print_exc()
        # Return original if splitting fails
        return pdf_bytes


def extract_data_from_pdf(pdf_bytes, use_preprocessing, parts_list, has_shell_tube):
    """
    Extract engineering data from GA drawing PDF using Gemini AI.
    
    Args:
        pdf_bytes: PDF file as bytes
        use_preprocessing: Whether to split PDF for better OCR
        parts_list: List of part names to extract (e.g., ["Top Head", "Shell", "Bottom Head"])
        has_shell_tube: Whether to extract Shell Side and Tube Side separately
    
    Returns:
        dict: Extracted data or error info
    """
    try:
        client = get_gemini_client()

        # Optionally preprocess PDF
        if use_preprocessing:
            print("Preprocessing PDF for better OCR...")
            pdf_bytes = split_pdf_for_ocr(pdf_bytes, dpi=300, overlap_percent=0.02)

        # ========================================
        # BUILD DYNAMIC BOM SECTION
        # ========================================
        if parts_list and len(parts_list) > 0:
            bom_instructions = "Extract these exact fields:\n"
            for part in parts_list:
                # Normalize part name for JSON key (remove spaces)
                part_key = part.replace(" ", "")
                bom_instructions += f'   - Material for "{part}" (use key "{part_key}" in JSON)\n'
        else:
            # Fallback to generic extraction
            bom_instructions = """Extract these exact fields:
   - Material for "Top Head" (or similar: Head, Channel, End, Cover, Top Head, Head Cover, Dish End)
   - Material for "Shell" (or similar: Shell, Body, Vessel)
   - Material for "Bottom Head" (or similar: Bottom Head, Bottom Cover, Bottom End, Dish End)
   - Material for "Tube Bundle" (or similar: Tube, Tube (Seamless))
   - Material for "Channel" (if present)
   - Material for "Top Channel" (refer channe or head)
   - Material for "Bottom Channel" (refer channe or head)"""


        # ========================================
        # BUILD DYNAMIC DESIGN DATA SECTION
        # ========================================
        if has_shell_tube:
            design_section = """PART 2: FROM DESIGN DATA / SPECIFICATION (SHELL SIDE AND TUBE SIDE)
Find the design specification table with Shell Side and Tube Side columns.

For BOTH Shell Side and Tube Side, extract:
1. Fluid Name - exact name as written, but fix obvious typos
2. Insulation - "yes" if present, "no" if not specified
3. Design Temperature - numerical value only
4. Design Pressure - numerical value only
5. Operating Temperature - extract exactly as written (could be single value or range)
6. Operating Pressure - extract exactly as written (could be single value or range)
7. Pressure Unit - unit from the pressure values (e.g., Bar, Bar(g), psi, MPa)
8. Temperature Unit - unit from temperature values (e.g., C, °C, F, °F)
9. For top channel and bottom channel, refer to channel.If no channel, refer to head
10. For tube bundle, also refer to tube or tube(seamless)"""


            # Build JSON structure for Shell/Tube
            parts_for_json = parts_list if parts_list else ["TopHead", "Shell", "BottomHead"]
            bom_json_fields = ""
            for part in parts_for_json:
                part_key = part.replace(" ", "")
                bom_json_fields += f'      "{part_key}": "extracted material or \'no\'",\n'
            
            json_structure = f"""{{
  "Part1": {{
    "BillOfMaterial": {{
{bom_json_fields.rstrip(',\n')}
    }}
  }},
  "Part2": {{
    "DesignData": {{
      "ShellSide": {{
        "Fluid": "extracted or 'no'",
        "Insulation": "yes/no",
        "DesignTemperature": "number or 'no'",
        "DesignPressure": "number or 'no'",
        "OperatingTemperature": "extracted exactly as written or 'no'",
        "OperatingPressure": "extracted exactly as written or 'no'",
        "PressureUnit": "extracted unit or 'no'",
        "TemperatureUnit": "extracted unit or 'no'"
      }},
      "TubeSide": {{
        "Fluid": "extracted or 'no'",
        "Insulation": "yes/no",
        "DesignTemperature": "number or 'no'",
        "DesignPressure": "number or 'no'",
        "OperatingTemperature": "extracted exactly as written or 'no'",
        "OperatingPressure": "extracted exactly as written or 'no'",
        "PressureUnit": "extracted unit or 'no'",
        "TemperatureUnit": "extracted unit or 'no'"
      }}
    }}
  }}
}}"""
        else:
            design_section = """PART 2: FROM DESIGN DATA / SPECIFICATION
Find the design specification table (usually has single column or Shell Side column only).

Extract:
1. Fluid Name - exact name as written, but fix obvious typos
2. Insulation - "yes" if present, "no" if not specified
3. Design Temperature - numerical value only
4. Design Pressure - numerical value only
5. Operating Temperature - extract exactly as written (could be single value or range)
6. Operating Pressure - extract exactly as written (could be single value or range)
7. Pressure Unit - unit from the pressure values (e.g., Bar, Bar(g), psi, MPa)
8. Temperature Unit - unit from temperature values (e.g., C, °C, F, °F)"""

            # Build JSON structure for single design data
            parts_for_json = parts_list if parts_list else ["TopHead", "Shell", "BottomHead"]
            bom_json_fields = ""
            for part in parts_for_json:
                part_key = part.replace(" ", "")
                bom_json_fields += f'      "{part_key}": "extracted material or \'no\'",\n'
            
            json_structure = f"""{{
  "Part1": {{
    "BillOfMaterial": {{
{bom_json_fields.rstrip(',\n')}
    }}
  }},
  "Part2": {{
    "DesignData": {{
      "Fluid": "extracted or 'no'",
      "Insulation": "yes/no",
      "DesignTemperature": "number or 'no'",
      "DesignPressure": "number or 'no'",
      "OperatingTemperature": "extracted exactly as written or 'no'",
      "OperatingPressure": "extracted exactly as written or 'no'",
      "PressureUnit": "extracted unit or 'no'",
      "TemperatureUnit": "extracted unit or 'no'"
    }}
  }}
}}"""

        # ========================================
        # BUILD COMPLETE PROMPT
        # ========================================
        prompt = f"""
ANALYZE THIS SCANNED GA DRAWING PDF AND EXTRACT SPECIFIC ENGINEERING DATA.

PART 1: FROM BILL OF MATERIAL (BOM)
1. Find the Bill of Materials section/table
2. {bom_instructions}

{design_section}

STRICT RULES:
1. If any data field is NOT FOUND in the document, use "no" (lowercase)
2. For Insulation: only "yes" if insulation is mentioned
3. Extract operating temperature/pressure AS WRITTEN even if it's a range or multiple values
4. Units: Extract the unit that appears with the values
5. Clean numerical values: remove units, keep only numbers and symbols like /, -, :

REQUIRED JSON FORMAT - MUST FOLLOW THIS EXACT STRUCTURE:
```json
{json_structure}
```

RESPOND ONLY WITH THE JSON. NO ADDITIONAL TEXT.
"""

        print("The prompt is",prompt)
        # ========================================
        # SEND REQUEST TO GEMINI
        # ========================================
        # Prepare contents
        contents = [
            types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
            prompt,
        ]

        # Generation config
        generation_config = types.GenerateContentConfig(
            temperature=0.0,  # Deterministic output
            response_mime_type="application/json"  # Force JSON response
        )

        # Send request to Gemini
        print("Sending request to Gemini AI...")
        print(f"Parts to extract: {parts_list}")
        print(f"Has shell/tube: {has_shell_tube}")
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=generation_config,
        )
        time.sleep(1)  # To avoid rate limits

        # ========================================
        # PARSE RESPONSE
        # ========================================
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()

        # Parse JSON
        extracted_data = json.loads(response_text)
        print(response_text)
        print("Extraction successful!")
        return {
            "success": True,
            "data": extracted_data
        }

    except json.JSONDecodeError as e:
        print(f"JSON parsing error:")
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Failed to parse extraction result: {str(e)}",
            "raw_response": response_text if 'response_text' in locals() else None
        }

    except Exception as e:
        print(f"Error extracting data from PDF:")
        traceback.print_exc()
        return {
            "success": False,
            "message": str(e)
        }


def extract_multiple_pdfs(pdf_files_data):
    """
    Extract data from multiple PDFs.
    
    Args:
        pdf_files_data: List of dicts with 'file_id', 'file_name', and 'pdf_bytes'
    
    Returns:
        dict: Results for each PDF
    """
    results = []
    
    for pdf_data in pdf_files_data:
        file_id = pdf_data.get('file_id')
        file_name = pdf_data.get('file_name')
        pdf_bytes = pdf_data.get('pdf_bytes')
        
        print(f"Extracting data from: {file_name}")
        
        result = extract_data_from_pdf(pdf_bytes, use_preprocessing=True)
        
        results.append({
            "file_id": file_id,
            "file_name": file_name,
            "extraction_result": result
        })
    
    return {
        "success": True,
        "results": results,
        "total": len(results),
        "successful": sum(1 for r in results if r['extraction_result'].get('success'))
    }