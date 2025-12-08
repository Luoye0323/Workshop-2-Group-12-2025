import React, { useState, useEffect } from "react";
import {
  Grid,
  Container,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import DashboardStats from "../components/dashboard/DashboardStats";
import ProcessingProgress from "../components/dashboard/ProcessingProgress";
import InspectionCalendar from "../components/scheduling/InspectionCalendar";
import InspectionList from "../components/scheduling/InspectionList";
import PDFUpload from "../components/dashboard/PDFUpload";
import { useDashboardData } from "../hooks/useDashboardData";
import { schedulingAPI } from "../services/api";

const DashboardPage: React.FC = () => {
  const { stats, kpis, recentProcesses, loading } = useDashboardData();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(true);

  // Fetch inspections from backend
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoadingInspections(true);
        const response = await schedulingAPI.getInspections();

        // Handle different API response structures
        if (response.data) {
          if (response.data.success && response.data.data) {
            // Structure: { success: true, data: [...] }
            const formattedInspections = response.data.data.map(
              (insp: any) => ({
                ...insp,
                start: new Date(insp.start),
                end: new Date(insp.end),
              })
            );
            setInspections(formattedInspections);
          } else if (Array.isArray(response.data)) {
            // Structure: [...]
            const formattedInspections = response.data.map((insp: any) => ({
              ...insp,
              start: new Date(insp.start),
              end: new Date(insp.end),
            }));
            setInspections(formattedInspections);
          }
        }
      } catch (error) {
        console.error("Failed to fetch inspections:", error);
      } finally {
        setLoadingInspections(false);
      }
    };

    fetchInspections();
  }, []);

  // Function to refresh inspections after creating new one
  const refreshInspections = async () => {
    try {
      const response = await schedulingAPI.getInspections();

      if (response.data) {
        if (response.data.success && response.data.data) {
          const formattedInspections = response.data.data.map((insp: any) => ({
            ...insp,
            start: new Date(insp.start),
            end: new Date(insp.end),
          }));
          setInspections(formattedInspections);
        } else if (Array.isArray(response.data)) {
          const formattedInspections = response.data.map((insp: any) => ({
            ...insp,
            start: new Date(insp.start),
            end: new Date(insp.end),
          }));
          setInspections(formattedInspections);
        }
      }
    } catch (error) {
      console.error("Failed to refresh inspections:", error);
    }
  };

  // Combined loading state
  const isLoading = loading || loadingInspections;

  // Handle loading state
  if (isLoading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Ensure stats exists
  if (!stats) {
    return (
      <Container>
        <Typography color="error">Failed to load dashboard data</Typography>
      </Container>
    );
  }

  // Ensure recentProcesses is an array
  const safeRecentProcesses = Array.isArray(recentProcesses)
    ? recentProcesses
    : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        RBI Automation Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12}>
          <DashboardStats stats={stats} />
        </Grid>

        {/* PDF Upload Section */}
        <Grid item xs={12} md={6}>
          <PDFUpload />
        </Grid>

        {/* Processing Progress - Use safeRecentProcesses */}
        <Grid item xs={12} md={6}>
          <ProcessingProgress recentProcesses={safeRecentProcesses} />
        </Grid>

        {/* Upcoming Inspections List */}
        <Grid item xs={12} md={6}>
          <InspectionList
            inspections={inspections.slice(0, 5)} // Show only 5 most recent
            onView={(inspection) => console.log("View:", inspection)}
            onEdit={(inspection) => console.log("Edit:", inspection)}
          />
        </Grid>

        {/* Calendar View */}
        <Grid item xs={12} md={6}>
          <InspectionCalendar
            events={inspections}
            onEventSelect={(event) => console.log("Event selected:", event)}
            onSlotSelect={(slot) => console.log("Slot selected:", slot)}
            onEventCreated={refreshInspections} // Add this prop
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
