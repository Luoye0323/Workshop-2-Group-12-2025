import fitz #PyMuPDF

doc = fitz.open("sample-1.pdf")
print("🫆 Metadata: ", doc.metadata)

page = doc[0]

tables = page.find_tables()

if tables.tables:
    table1 = tables.tables[0]
    print("🖨️ Table extracted: ")
    print(table1.extract())
else:
    print("❌ No tables found.")

doc.close()