import sys
from logging import exception
from pathlib import Path

import openpyxl
import pandas as pd
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils.dataframe import dataframe_to_rows

import pdfplumber


class PDFTableExtractor:

    def __init__(self, pdf_path) :
        self.pdf_path = Path(pdf_path)
        self.tables_data = []

    def extract_tables(self):
        print(f"Processing : {self.pdf_path.name}")

        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    print(f"Scanning page {page_num}/{len(pdf.pages)}...")

                    # Extract tables with settings for better detection
                    tables = page.extract_tables({
                        "vertically_lines" : "lines",
                        "horizontally_lines" : "lines",
                        "snap_tolerance" : 3, 
                        "join_tolerance" : 3,
                        "edge_min_length" : 3,
                        "min_words_vertical" : 1,
                        "min_words_horizontal" : 1,
                    })

                    if tables:
                        for idx, table in enumerate(tables, 1):
                            if table and len(table) > 0:
                                self.tables_data.append({
                                    'page' : page_num,
                                    'table_index' : idx,
                                    'data' : table
                                })
                                print(f"    Found table {idx} with {len(table)} row(s)")
                    if not tables:
                        tables_alt = page.extract_tables({
                            "vertically_strategy" : "text",
                            "horizontally_stratregy" : "text",
                        })
                        
                        if tables_alt:
                            for idx, table in enumerate(tables_alt, 1):
                                if table and len(table) > 0:
                                    self.tables_data.append({
                                        'page' : page_num,
                                        'table_index' : idx,
                                        'data' : table
                                    })
                                    print(f"    Found table {idx} (text-based) with {len(table)} row(s)")
        except Exception as e:
            print(f"Error processing PDF: {e}")
            raise

        if not self.tables_data:
            print("Warning: No tables found in PDF")
        else: 
            print(f"\nTotal tables extracted: {len(self.tables_data)}")

        return self.tables_data


    def clean_cell_data(self, cell):
        '''clean and format cell data'''
        if cell is None:
            return ""
        # remove excessive withspaces and newlines 
        cleaned = " ".join(str(cell).split())
        return cleaned

    def export_to_excel(self, output_path=None, style_tables=True):
        if not self.tables_data:
            print("No tables to export. Run extract_tables() first.")
            return

        if output_path is None:
            output_path = self.pdf_path.with_suffix('.xlsx')
        else:
            output_path = Path(output_path)

        # create excel writer
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for table_info in self.tables_data:
                page = table_info['page']
                idx = table_info['table_index']
                table = table_info['data']

                # clean the table data
                cleaned_table = []
                for row in table:
                    cleaned_row = [self.clean_cell_data(cell) for cell in row]
                    cleaned_table.append(cleaned_row)

                # create dataframe
                # first row as header if it looks like a header
                if len(cleaned_table) > 1:
                    df = pd.DataFrame(cleaned_table[1:], columns=cleaned_table[0])
                else:
                    df = pd.DataFrame(cleaned_table)


                # create sheetname
                sheet_name = f"Page{page}_Table{idx}"
                if len(sheet_name) > 31: # excel sheet name limit
                    sheet_name = f"P{page}_T{idx}"

                df.to_excel(writer, sheet_name=sheet_name, index=False)

                if style_tables:
                    worksheet = writer.sheets[sheet_name]
                    self._apply_excel_styling(worksheet, df)
                

