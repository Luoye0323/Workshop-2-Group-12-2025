from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
import pytesseract
import pandas as pd
from ocr.parser import BillParser

app = Flask(__name__)

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
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # convert to grayscale for better OCR results
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # perform OCR using pytesseract
        text = pytesseract.image_to_string(gray)
        
        # parse the text
        parser = BillParser(text)
        data = parser.extract_all()

        # save to excel
        df = pd.DataFrame([data])
        df.to_excel("output.xlsx", index=False)

        return jsonify ({
            "status" : "success",
            "extracted_data" : data
        })

    except Exception as e:
        return jsonify ({'error' : str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)