import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { addHours, format } from "date-fns";

interface CreateInspectionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (inspection: any) => void;
  initialStart?: Date;
  initialEnd?: Date;
  isLoading?: boolean;
}

const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  open,
  onClose,
  onSave,
  initialStart = new Date(),
  initialEnd = addHours(new Date(), 2),
}) => {
  const [formData, setFormData] = useState({
    title: "",
    equipmentId: "",
    equipmentName: "",
    assignedEngineer: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "scheduled" as
      | "scheduled"
      | "in-progress"
      | "completed"
      | "cancelled",
    inspectionPlan: "",
    notes: "",
  });

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const equipmentOptions = [
    { id: "PV-001", name: "Pressure Vessel A" },
    { id: "HE-002", name: "Heat Exchanger B" },
    { id: "VALVE-003", name: "Safety Valve C" },
    { id: "PUMP-004", name: "Centrifugal Pump D" },
    { id: "TANK-005", name: "Storage Tank E" },
  ];

  const engineerOptions = [
    "John Smith",
    "Sarah Johnson",
    "Mike Wilson",
    "Alex Chen",
    "Maria Garcia",
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.equipmentId) newErrors.equipmentId = "Equipment is required";
    if (!formData.assignedEngineer)
      newErrors.assignedEngineer = "Engineer is required";
    if (startDate >= endDate)
      newErrors.dates = "End time must be after start time";
    if (startDate < new Date())
      newErrors.dates = "Start time cannot be in the past";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const newInspection = {
      id: `insp-${Date.now()}`,
      ...formData,
      start: startDate,
      end: endDate,
      createdAt: new Date().toISOString(),
      createdBy: "Current User", // Replace with actual user
    };

    onSave(newInspection);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: "",
      equipmentId: "",
      equipmentName: "",
      assignedEngineer: "",
      priority: "medium",
      status: "scheduled",
      inspectionPlan: "",
      notes: "",
    });
    setErrors({});
    onClose();
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selected = equipmentOptions.find((eq) => eq.id === equipmentId);
    setFormData((prev) => ({
      ...prev,
      equipmentId,
      equipmentName: selected?.name || "",
      title: selected ? `Inspection - ${selected.name}` : prev.title,
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Schedule New Inspection</Typography>
        <Typography variant="body2" color="textSecondary">
          Create a new Risk-Based Inspection schedule
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Inspection Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                error={!!errors.title}
                helperText={errors.title}
                placeholder="e.g., Quarterly Pressure Vessel Inspection"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Equipment"
                value={formData.equipmentId}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                error={!!errors.equipmentId}
                helperText={errors.equipmentId}
              >
                <MenuItem value="">
                  <em>Select Equipment</em>
                </MenuItem>
                {equipmentOptions.map((eq) => (
                  <MenuItem key={eq.id} value={eq.id}>
                    {eq.name} ({eq.id})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Assigned Engineer"
                value={formData.assignedEngineer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedEngineer: e.target.value,
                  }))
                }
                error={!!errors.assignedEngineer}
                helperText={errors.assignedEngineer}
              >
                <MenuItem value="">
                  <em>Select Engineer</em>
                </MenuItem>
                {engineerOptions.map((eng) => (
                  <MenuItem key={eng} value={eng}>
                    {eng}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dates,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Start Time"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dates,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                minDate={startDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dates,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label="End Time"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                minTime={startDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dates,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
              >
                <MenuItem value="low">Low (Green)</MenuItem>
                <MenuItem value="medium">Medium (Orange)</MenuItem>
                <MenuItem value="high">High (Red)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                  }))
                }
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Inspection Plan Reference"
                value={formData.inspectionPlan}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    inspectionPlan: e.target.value,
                  }))
                }
                placeholder="e.g., PV-001-Inspection-2024Q4.pptx"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Any special instructions or requirements..."
              />
            </Grid>

            {errors.dates && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.dates}</Alert>
              </Grid>
            )}
          </Grid>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Schedule Inspection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInspectionModal;
