import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Box,
} from "@mui/material";
import { RecentActivity } from "../../types/dashboard";

interface Props {
  recentProcesses?: RecentActivity[]; // Make it optional
}

const ProcessingProgress: React.FC<Props> = ({ recentProcesses = [] }) => {
  // Ensure recentProcesses is always an array
  const processes = Array.isArray(recentProcesses) ? recentProcesses : [];

  const getStatusColor = (status: string) => {
    const colors: Record<
      string,
      "primary" | "info" | "warning" | "success" | "error"
    > = {
      uploading: "primary",
      extracting: "info",
      mapping: "warning",
      validating: "warning",
      completed: "success",
      failed: "error",
    };
    return colors[status] || "default";
  };

  // Convert RecentActivity to display format
  const getDisplayStatus = (activity: RecentActivity) => {
    const statusMap: Record<string, string> = {
      upload: "uploading",
      processing: "extracting",
      inspection: "validating",
      approval: "completed",
    };
    return statusMap[activity.type] || activity.type;
  };

  const getProgressValue = (activity: RecentActivity) => {
    const progressMap: Record<string, number> = {
      upload: 25,
      processing: 50,
      inspection: 75,
      approval: 100,
    };
    return progressMap[activity.type] || 0;
  };

  const getFileName = (activity: RecentActivity) => {
    // Extract filename from description
    const match = activity.description.match(/([^\/\\]+\.(pdf|PDF))$/);
    return match ? match[1] : activity.description;
  };

  // Format timestamp safely
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return timestamp || "Unknown time";
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Processing Activities
        </Typography>

        {processes.length > 0 ? (
          <List>
            {processes.map((activity, index) => (
              <ListItem key={activity.id || `activity-${index}`} divider>
                <ListItemText
                  primary={getFileName(activity)}
                  secondary={`${activity.user || "System"} • ${formatTimestamp(
                    activity.timestamp
                  )}`}
                />
                <Chip
                  label={getDisplayStatus(activity)}
                  color={getStatusColor(getDisplayStatus(activity))}
                  size="small"
                  sx={{ ml: 2 }}
                />
                <Box sx={{ width: 100, ml: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressValue(activity)}
                    color={activity.status === "failed" ? "error" : "primary"}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <Typography color="textSecondary" align="center">
              No recent processing activities
            </Typography>
            <Typography variant="caption" color="textSecondary" align="center">
              Upload PDFs to see processing status
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingProgress;
