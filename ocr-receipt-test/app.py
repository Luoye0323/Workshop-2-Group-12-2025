from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
import pytesseract
import pandas as pd
from PIL import Image
from ocr.parser import BillParser
import os
from datetime import datetime
from pdf2image import convert_from_bytes

app = Flask(__name__)

# function to save extracted data to excel
def save_to_excel(extracted_data, filename="output.xlsx"):
    df_new = pd.DataFrame([extracted_data])

    # check if file exists - if yes, append
    if os.path.exists(filename):
        existing_df = pd.read_excel(filename)
        combined_df = pd.concat([existing_df, df_new], ignore_index=True)
    else: 
        combined_df = df_new

    combined_df.to_excel(filename, index=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        if not file:
            return jsonify({'error' : 'No file uploaded'}), 400

        # read image file (pdf or image)
        # file_bytes = np.frombuffer(file.read(), np.uint8)
        # img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if file.filename.lower().endswith(".pdf"):
            # convert first page of pdf to image
            pages = convert_from_bytes(file.read())
            img = np.array(pages[0])
        else :
            # for images
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # convert to grayscale and add some threshold for better OCR results
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

        # perform OCR using pytesseract
        text = pytesseract.image_to_string(gray)
        
        # parse the text
        parser = BillParser(text)
        data = parser.extract_all()

        # save to excel
        df = pd.DataFrame([data])
        # df.to_excel("output.xlsx", index=False)
        save_to_excel(data, filename="output.xlsx")

        return jsonify ({
            "status" : "success",
            "extracted_data" : data
        })

    except Exception as e:
        return jsonify ({'error' : str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
