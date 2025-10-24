import re

class BillParser:
    
    def __init__(self, text: str):
        self.text = text
    def extract_total(self):
        match = re.search(r"(?<!SUB|Sub|sub)\b(Total|Amount due|Grand Total|TOTAL|TOTAL AMOUNT|JUMLAH|GRAND TOTAL|AMOUNT DUE)[:\s\-]*\$?\s*([\d.,]+)", self.text, re.IGNORECASE)
        return match.group(2) if match else None
    
    # def extract_date(self):
    #     match = re.search(r"(\d{1,2}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{2,4})", self.text)
    #     return match.group(1) if match else None

    def extract_date(self):
        # allow various separators, optional spaces, and AM/PM after
        match = re.search(
            r"(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4})(?:\s*(?:AM|PM))?",
            self.text,
            re.IGNORECASE
        )
        if match:
            date = match.group(1)
            # remove all spaces to normalize
            return re.sub(r"\s+", "", date)
        return None

    def extract_vendor(self):
        # assume vendor name is in the first line
        lines = [l.strip() for l in self.text.split("\n") if l.strip()]
        return lines[0] if lines else None

    def extract_bill_number(self):
        match = re.search(r"(Bill No\.?|Invoice No\.?|Invoice #|Check|CHECK|BILL NO\.|INVOICE NO\.?)[:\s\-]*([A-Za-z0-9\-]+)", self.text, re.IGNORECASE)
        return match.group(2) if match else None
    
    # def extract_location(self):
    #     lines = [l.strip() for l in self.text.splitlines() if l.strip()]
    #     # 1. use simple heuristics: find something that looks like an address containing "address" or "jalan"
    #     for line in lines:
    #         if re.search(r"(Address|Jalan|Street|Lot|No\.)", line, re.IGNORECASE):
    #             return line.strip()
    #         return None
    #     #2 . fallback - use the line right after vendor name (first line)
    #     if len(lines) > 1:
    #         return lines[1]
    #     return None

    def extract_location(self):
        lines = [l.strip() for l in self.text.splitlines() if l.strip()]
        # 1. Look for explicit address keywords first
        for i, line in enumerate(lines):
         if re.search(r"(Address|Alamat|Street|Lot|No\.|Taman|Bandar|Persiaran)", line, re.IGNORECASE):
            # also include the next 1-2 lines if they look like the continuation of the address
            address_lines = [line]
            for next_line in lines[i+1:i+3]:
                if re.search(r"[A-Za-z0-9]", next_line):
                    address_lines.append(next_line)
            return ", ".join(address_lines) 

        # 2. Fallback - assuming the next few lines after the vendor name are address.
         if len(lines) > 2:
            # take next 1-2 lines after the vendor name
            possible_address = []
            for line in lines[1:4]:
                if re.search(r"[A-Za-z0-9]", line):
                    possible_address.append(line)
                if possible_address:
                    return ", ".join(possible_address)
        return None


    def extract_all(self):
        return {
            "Vendor": self.extract_vendor(),
            "Bill Number": self.extract_bill_number(),
            "Date": self.extract_date(),
            "Total Amount": self.extract_total(),
            "Location": self.extract_location()
        }
