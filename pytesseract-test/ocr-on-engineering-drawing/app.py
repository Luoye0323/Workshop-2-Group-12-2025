import pandas as pd
import numpy as np
import os 
import pytesseract
import cv2
import fitz 
import re

from flask import Flask, request, jsonify, render_template
from datetime import datetime
from pdf2image import convert_from_bytes
from PIL import Image
from parser.parser import ImageParser

app = Flask(__name__)

# save extracted data to excel
def save_to_excel(extracted_data, filename="output.xlsx"):
    df_new = pd.DataFrame([extracted_data])

    # check if the file is already existed - if yes, append to the current file.
    if os.path.exists(filename):
        existing_df = pd.read_excel(filename) 
        combined_df = pd.concat([existing_df, df_new], ignore_index=True)
    else:
        combined_df = df_new
    combined_df.to_excel(filename, index=False)

def extract_text_from_pdf(pdf_bytes):
    doc = fitz.open("pdf", pdf_bytes)
    page = doc.load_page(0)
    blocks = page.get_text("blocks")

    table_block = None
    for b in blocks:
        x0, y0, x1, y1, text, block_no, block_type = b
        if re.search(r'\bITEM\b|\bQTY\b|\PART\b', text, re.IGNORECASE):
            table_block = fitz.Rect(x0, y0, x1 + 100, y1 + 200)
            break
        elif len(re.findall(r'\d+', text)) > 5:
            table_block = fitz.Rect(x0, y0, x1 + 100, y1 + 200)
            break
            
    if table_block:
        text = page.get_text("text", clip=table_block)
    else:
        text = page.get_text("text")
    
    return text

def extract_text_from_image(file_bytes):
    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
    

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods = ['POST'])
def upload_file():
    try:
        file = request.files['file']
        if not file:
            return jsonify({'error' : 'No file uploaded'}, 400)

        # # convert pdf into readable image
        # if file.filename.lower().endswith('.pdf'):
        #     pages = convert_from_bytes(file.read())
        #     img = np.array(pages[0])

        # PyMuPDF method
        if file.filename.lower().endswith('.pdf'):
            pdf_bytes = file.read()
            doc = fitz.open("pdf", pdf_bytes)
            page = doc.load_page(0)
            text = page.get_text("text")


        else: # if the file is image format (.jpg and .png)
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            # convert to grayscale and add thresholf for better OCR results
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

            # perform OCR using tesseract
            text = pytesseract.image_to_string(gray)

        # text parsing
        parser = ImageParser(text) 
        data = parser.extract_all()

        return jsonify({
            "status" : "success",
            "extracted_data" : data
        })

    except Exception as e:
        return jsonify({
            "status" : "error",
            "message" : str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)