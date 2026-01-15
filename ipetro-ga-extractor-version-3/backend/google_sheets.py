import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
import json
from datetime import datetime


class GoogleSheetsClient:
    def __init__(self, credentials_path: str, spreadsheet_id: str):
        self.scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive",
        ]
        self.credentials_path = credentials_path
        self.spreadsheet_id = spreadsheet_id
        self.client = None
        self.sheet = None

        self._authenticate()

    def _authenticate(self):
        if not os.path.exists(self.credentials_path):
            raise FileNotFoundError(
                f"Credentials file not found at {self.credentials_path}"
            )

        try:
            self.creds = ServiceAccountCredentials.from_json_keyfile_name(
                self.credentials_path, self.scope
            )
            self.client = gspread.authorize(self.creds)
            self.sheet = self.client.open_by_key(self.spreadsheet_id)

            # Initialize Drive API
            from googleapiclient.discovery import build

            self.drive_service = build("drive", "v3", credentials=self.creds)
            print("✅ Drive Service Initialized")

        except Exception as e:
            raise Exception(
                f"Failed to authenticate with Google Sheets/Drive: {str(e)}"
            )

    def upload_pptx(self, file_path: str, filename: str):
        """
        Uploads the PPTX file to Google Drive and returns the webViewLink.
        """
        try:
            from googleapiclient.http import MediaFileUpload

            file_metadata = {
                "name": filename,
                "mimeType": "application/vnd.google-apps.presentation",  # Convert to Google Slides
            }
            media = MediaFileUpload(
                file_path,
                mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                resumable=True,
            )

            file = (
                self.drive_service.files()
                .create(body=file_metadata, media_body=media, fields="id, webViewLink")
                .execute()
            )

            # Make it readable by anyone with link (optional, or rely on service account access?)
            # If we want the USER to open it, they need permission.
            # Service account owns the file. We need to share it with the user or make it public/domain visible.
            # For simplicity, let's make it anyone with link reader.

            permission = {
                "type": "anyone",
                "role": "reader",
            }
            self.drive_service.permissions().create(
                fileId=file.get("id"),
                body=permission,
            ).execute()

            return file.get("webViewLink")

        except Exception as e:
            print(f"❌ Failed to upload PPTX to Drive: {e}")
            return None

    def _get_worksheet(self):
        # Try to get the first worksheet
        try:
            return self.sheet.sheet1
        except Exception:
            return self.sheet.get_worksheet(0)

    def update_or_append_equipment_data(self, equipment_data: dict):
        """
        Updates variable data if Tag exists, otherwise appends new rows.
        Variable Data to Update: Fluid, Material Spec, Material Grade, Conditions.
        Static Data to Preserve: Tag, PMT, Description, Parts, Phase, Material Type.
        """
        worksheet = self._get_worksheet()
        all_values = worksheet.get_all_values()

        target_tag = equipment_data.get("equipment_tag", "").strip()
        if not target_tag:
            return False  # Cant update without tag

        # Find existing rows
        found_rows_indices = []
        started_finding = False

        for i, row in enumerate(all_values):
            # Safe access to tag cell
            cell_tag = row[1].strip() if len(row) > 1 else ""

            if cell_tag == target_tag:
                started_finding = True
                found_rows_indices.append(i + 1)  # 1-based index
            elif started_finding:
                # We are inside or immediately after the block.
                if not cell_tag:
                    # Potential continuation row (same block, empty tag)
                    # Check if it has a part name (Col 5 / Index 4)
                    if len(row) > 4 and row[4].strip():
                        found_rows_indices.append(i + 1)
                    else:
                        # Empty row likely ends the block?
                        # Or maybe just a gap. Safer to continue but not add.
                        # Wait, if we don't break, we might find junk.
                        pass
                else:
                    # Found a DIFFERENT tag (non-empty, != target_tag)
                    # End of block. MUST BREAK.
                    break

        # Filter indices to be contiguous block starting from the first match
        # Actually the loop above might catch non-contiguous if duplicate tags exist?
        # Let's assume tags are unique blocks.

        if found_rows_indices:
            # === UPDATE MODE ===
            print(f"Tag {target_tag} found at rows {found_rows_indices}. Updating...")

            # Prepare extraction data
            conditions = equipment_data.get("conditions", {})
            insul = "Yes" if conditions.get("insulation") else "No"
            des_temp = conditions.get("design_temp", "")
            des_press = conditions.get("design_pressure", "")
            op_temp = conditions.get("operating_temp", "")
            op_press = conditions.get("operating_pressure", "")

            # Process components mapping
            raw_comps = equipment_data.get("components", [])
            # Normalize to list
            component_list = []
            if isinstance(raw_comps, dict):
                for key in ["top_head", "shell", "bottom_head"]:
                    if key in raw_comps:
                        c = raw_comps[key]
                        if "name" not in c:
                            c["name"] = key.replace("_", " ").title()
                        component_list.append(c)
                for k, v in raw_comps.items():
                    if k not in ["top_head", "shell", "bottom_head"]:
                        if "name" not in v:
                            v["name"] = k
                        component_list.append(v)
            elif isinstance(raw_comps, list):
                component_list = raw_comps

            # Create a simple name-to-comp map for easier matching
            # normalize names to lowercase for matching
            comp_map = {c.get("name", "").lower(): c for c in component_list}

            updates = []

            for row_idx in found_rows_indices:
                # Read current row to identify part
                # row_idx is 1-based.
                # Col 5 is Part Name.
                part_name_cell = worksheet.cell(row_idx, 5).value or ""
                part_key = part_name_cell.lower().strip()

                matched_comp = comp_map.get(part_key)
                # If direct match not found, maybe try fuzzy or order?
                # For now, if not matched, we skip updating component-specific fields
                # but STILL update global conditions?
                # User said: "new extracted data just fill in the blank space such as fluid... since data is needed".
                # If we can't match component, we can't safely update fluid/material.

                # Global Updates (Cols 11-15)
                # Col 11: INS, 12: DES T, 13: DES P, 14: OP T, 15: OP P
                updates.append({"range": f"K{row_idx}", "values": [[insul]]})
                updates.append({"range": f"L{row_idx}", "values": [[des_temp]]})
                updates.append({"range": f"M{row_idx}", "values": [[des_press]]})
                updates.append({"range": f"N{row_idx}", "values": [[op_temp]]})
                updates.append({"range": f"O{row_idx}", "values": [[op_press]]})

                if matched_comp:
                    # Component Updates
                    # Col 7: FLUID (G)
                    # Col 9: SPEC (I)
                    # Col 10: GRADE (J)

                    fluid = matched_comp.get("fluid", "")
                    mat = matched_comp.get("material", {})
                    if isinstance(mat, dict):
                        mat_spec = mat.get("spec", "")
                        mat_grade = mat.get("grade", "")
                    else:
                        mat_spec = ""
                        mat_grade = ""

                    updates.append({"range": f"G{row_idx}", "values": [[fluid]]})
                    updates.append({"range": f"I{row_idx}", "values": [[mat_spec]]})
                    updates.append({"range": f"J{row_idx}", "values": [[mat_grade]]})

            # Execute batch update
            if updates:
                worksheet.batch_update(updates)
            return True

        else:
            # === APPEND MODE ===
            # (Same logic as before)
            print(f"Tag {target_tag} not found. Appending...")

            # Prepare rows
            rows_to_append = []

            # Common Data
            eq_tag = equipment_data.get("equipment_tag", "")
            pmt = equipment_data.get("pmt_no", "")
            desc = equipment_data.get("description", "")

            conditions = equipment_data.get("conditions", {})
            insul = "Yes" if conditions.get("insulation") else "No"
            des_temp = conditions.get("design_temp", "")
            des_press = conditions.get("design_pressure", "")
            op_temp = conditions.get("operating_temp", "")
            op_press = conditions.get("operating_pressure", "")

            # Components
            raw_comps = equipment_data.get("components", [])

            # Normalize dict/list
            component_list = []
            if isinstance(raw_comps, dict):
                # Legacy dict support
                for key in ["top_head", "shell", "bottom_head"]:
                    if key in raw_comps:
                        c = raw_comps[key]
                        if "name" not in c:
                            c["name"] = key.replace("_", " ").title()
                        component_list.append(c)
                for k, v in raw_comps.items():
                    if k not in ["top_head", "shell", "bottom_head"]:
                        if "name" not in v:
                            v["name"] = k
                        component_list.append(v)
            elif isinstance(raw_comps, list):
                component_list = raw_comps

            # If no components, add at least one row
            if not component_list:
                component_list = [{}]

            # Determine next ID (NO.)
            try:
                col_a = worksheet.col_values(1)
                last_id = 0
                for val in reversed(col_a):
                    if val.isdigit():
                        last_id = int(val)
                        break
                next_id = last_id + 1
            except:
                next_id = 1

            for idx, comp in enumerate(component_list):
                # NO | EQ NO | PMT | DESC | PART | PHASE | FLUID | MAT TYPE | SPEC | GRADE | INS | DES T | DES P | OP T | OP P
                mat = comp.get("material", {})
                mat_type = ""
                mat_spec = ""
                mat_grade = ""
                if isinstance(mat, dict):
                    mat_type = mat.get("type", "")
                    mat_spec = mat.get("spec", "")
                    mat_grade = mat.get("grade", "")
                else:
                    mat_type = str(mat)

                row = [
                    next_id if idx == 0 else "",  # ID only on first row of block
                    eq_tag if idx == 0 else "",  # Tag only on first row
                    pmt if idx == 0 else "",  # PMT only on first row
                    desc if idx == 0 else "",  # Desc only on first row
                    comp.get("name", ""),
                    comp.get("phase", ""),
                    comp.get("fluid", ""),
                    mat_type,
                    mat_spec,
                    mat_grade,
                    insul,
                    des_temp,
                    des_press,
                    op_temp,
                    op_press,
                ]
                rows_to_append.append(row)

            worksheet.append_rows(rows_to_append)
            return True

    def get_equipment_data(self, tag: str):
        """
        Reads equipment data by Tag.
        """
        worksheet = self._get_worksheet()
        all_values = worksheet.get_all_values()

        # Row 0 is header usually. Data starts row 6 in template, but get_all_values includes everything.
        # Let's search for Tag in Column 2 (Index 1)

        found_rows = []
        start_row_index = -1

        # Iterate to find the block
        # We assume headers take up some rows. We'll just look for the tag.
        for i, row in enumerate(all_values):
            if len(row) < 2:
                continue

            # Check col 1 (Equipment No)
            cell_tag = row[1].strip()

            if cell_tag == tag:
                found_rows.append(row)
                start_row_index = i
            elif start_row_index != -1:
                # We were finding rows, but now the tag is empty or different
                # If empty, it MIGHT be part of the same block (merged).
                # If different and not empty, it's a new block.
                if not cell_tag:
                    # Check if it's a valid component row (has part name in Col 4 (Index 4)?)
                    if len(row) > 4 and row[4].strip():
                        found_rows.append(row)
                    else:
                        # Empty tag and empty part? End of block.
                        break
                else:
                    # New tag found -> End of block
                    break

        if not found_rows:
            return None

        # Parse data
        first_row = found_rows[0]

        data = {
            "equipment_tag": tag,
            "pmt_no": first_row[2] if len(first_row) > 2 else "",
            "description": first_row[3] if len(first_row) > 3 else "",
            "conditions": {
                "insulation": (
                    (first_row[10] == "Yes") if len(first_row) > 10 else False
                ),
                "design_temp": first_row[11] if len(first_row) > 11 else "",
                "design_pressure": first_row[12] if len(first_row) > 12 else "",
                "operating_temp": first_row[13] if len(first_row) > 13 else "",
                "operating_pressure": first_row[14] if len(first_row) > 14 else "",
            },
            "components": [],
        }

        for row in found_rows:
            # Component
            if len(row) > 4 and row[4]:
                comp = {
                    "name": row[4],
                    "phase": row[5] if len(row) > 5 else "",
                    "fluid": row[6] if len(row) > 6 else "",
                    "material": {
                        "type": row[7] if len(row) > 7 else "",
                        "spec": row[8] if len(row) > 8 else "",
                        "grade": row[9] if len(row) > 9 else "",
                    },
                }
                data["components"].append(comp)

        return data
