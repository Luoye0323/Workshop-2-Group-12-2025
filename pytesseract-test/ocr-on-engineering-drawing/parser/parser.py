import re

class ImageParser:
    def __init__(self, text: str):
        self.text = text

    def extract_all(self):
        lines = self.text.splitlines()
        data = []

        # strict regex pattern for structured rows
        pattern = re.compile(
            r"(\d+)\s+(\d+)\s+([A-Za-z0-9_\-]+)\s+([A-Za-z]+)\s*(.*)"
        )

        for line in lines:
            line = line.strip()
            if not line:
                continue

            match = pattern.match(line)
            if match:
                item, qty, part_number, material, description = match.groups()
                data.append({
                    "ITEM": item,
                    "QTY": qty,
                    "PART_NUMBER": part_number,
                    "MATERIAL": material,
                    "DESCRIPTION": description.strip()
                })

        # if no strict matches found → try a looser pattern
        if not data:
            loose_pattern = re.compile(r"(\d+)\s+(\d+)\s+([A-Za-z0-9_\-]+)")
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                match = loose_pattern.match(line)
                if match:
                    item, qty, part_number = match.groups()
                    data.append({
                        "ITEM": item,
                        "QTY": qty,
                        "PART_NUMBER": part_number,
                        "MATERIAL": "",
                        "DESCRIPTION": ""
                    })

        return data


