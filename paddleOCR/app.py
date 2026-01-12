# this source code need good GPU for faster excecution.

import fitz
import os
import pandas as pd
import cv2
from paddleocr import PPStructureV3
import numpy as np


def extract_tables_from_pdf(pdf_path, output_dir = "temp_images"):
    """Extract table from a PDF using paddleOCR's ppstructure module and save them to a list of DataFrames."""
    # Convert PDF to images
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    doc = fitz.open(pdf_path)
    image_paths = []
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap()
        image_path = os.path.join(output_dir, f"page_{i}.png")
        pix.save(image_path)
        image_paths.append(image_path)

    # Table detection and recognition with PPStructure
    os.environ["CUDA_VISIBLE_DEVICES"] = "" # force CPU mode - if your PC have GPU, then please comment out this line.
    table_engine = PPStructureV3()

    all_tables = []
    for img_path in image_paths:
        img = cv2.imread(img_path)
        result = table_engine.predict(img_path)

        # Extract and restructure data
        for line in result:
            if line['type'] == 'table':
                html_content = line['res']['html']

                try:
                    df_list = pd.read_html(html_content)
                    if df_list:
                        all_tables.append(df_list[0])
                except Exception as e:
                    print(f"Could not read HTML table: {e}")
    
        os.remove(img_path) # Clean up temporary images

    return all_tables


def save_tables_to_excel(tables, excel_path = "output_tables.xlsx"):
    if not tables:
        print("No tables to save.")
        return
    
    with pd.ExcelWriter(excel_path) as writer:
        for i, df in enumerate(tables):
            df.to_excel(writer, sheet_name=f'Table_{i+1}', index=False)
            print(f"Successfully saved {len(tables)} tables to {excel_path}")

if __name__ == "__main__":
    pdf_file = "drawing-1.pdf" #TODO -> edit PDF file path here

    extracted_tables = extract_tables_from_pdf(pdf_file)
    
    if extracted_tables:
        save_tables_to_excel(extracted_tables)


    
