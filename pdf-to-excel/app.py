import pandas as pd
import tabula
from flask import Flask, jsonify, request

app = Flask(__name__)

def extract_tables(pdf_path='sample-1.pdf'):
    dfs = tabula.read_pdf(
        pdf_path,
        pages='all',
        relative_area=True,
        relative_columns=True,
        area=[0, 0, 100, 100],
        columns=[0, 50, 100],
        multiple_tables=True
    )
    return dfs

@app.route('/tables', methods=['GET'])
def tables():
    dfs = extract_tables()
    json_tables = [df.fillna('').to_dict(orient='records') for df in dfs]
    return jsonify (count=len(json_tables), tables=json_tables)

if __name__ == '__main__':
    dfs = extract_tables()
    print(f"Extracted {len(dfs)} tables.")
    app.run(debug=True, host='0.0.0.0', port=5000)

    