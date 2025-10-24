import tabula
import pandas as pd
import os

def pdf_to_excel(pdf_file_path, excel_file_path=None):
    print(f"🔍 reading tables from {pdf_file_path} ...")

    # if no output path is given, auto generate one
    if excel_file_path is None:
        base, _ = os.path.splitext(pdf_file_path)
        excel_file_path = base + ".xlsx"

    # read all tables from pdf
    tables = tabula.read_pdf(pdf_file_path, pages='all', multiple_tables=True)

    if not tables or len(tables) == 0:
        print("⚠️ no tables found in the pdf. creating an empty excel file instead.")
        # create an empty sheet so Excel file is valid
        empty_df = pd.DataFrame({"message": ["no tables found in the pdf"]})
        with pd.ExcelWriter(excel_file_path) as writer:
            empty_df.to_excel(writer, sheet_name="Empty", index=False)
        print(f"✅ saved empty file to {excel_file_path}")
        return

    # write tables to excel
    with pd.ExcelWriter(excel_file_path) as writer:
        for i, table in enumerate(tables):
            table.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)

    print(f"✅ extracted {len(tables)} table(s) and saved to {excel_file_path}")

# example usage
pdf_to_excel('/Users/muhammadputraazam/Desktop/uni/S5/workshop_2/Workshop-2-Group-12-2025/pytesseract-test/ocr-receipt-test/receipt-ticket-examples/pdf/ItemizedReceipt.pdf')
