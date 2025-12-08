import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Box,
} from "@mui/material";
import { Visibility, Edit } from "@mui/icons-material";

interface InspectionEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  equipmentId: string;
  equipmentName: string;
  assignedEngineer: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
}

interface Props {
  inspections: InspectionEvent[];
  onView: (inspection: InspectionEvent) => void;
  onEdit: (inspection: InspectionEvent) => void;
}

const InspectionList: React.FC<Props> = ({ inspections, onView, onEdit }) => {
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, "success" | "warning" | "error"> = {
      low: "success",
      medium: "warning",
      high: "error",
    };
    return colors[priority] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "primary" | "warning" | "success" | "error"> =
      {
        scheduled: "primary",
        "in-progress": "warning",
        completed: "success",
        cancelled: "error",
      };
    return colors[status] || "default";
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Inspections
        </Typography>
        <List>
          {inspections.map((inspection) => (
            <ListItem
              key={inspection.id}
              divider
              secondaryAction={
                <Box>
                  <IconButton
                    onClick={() => onView(inspection)}
                    size="small"
                    aria-label="view"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    onClick={() => onEdit(inspection)}
                    size="small"
                    aria-label="edit"
                  >
                    <Edit />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={inspection.equipmentName}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ display: "block" }}
                    >
                      {inspection.assignedEngineer} •{" "}
                      {inspection.start.toLocaleDateString()}
                    </Typography>
                    <Box mt={1}>
                      <Chip
                        label={inspection.priority}
                        color={getPriorityColor(inspection.priority)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={inspection.status}
                        color={getStatusColor(inspection.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default InspectionList;
