import React, { useState } from "react";
import moment from "moment";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
} from "@mui/material";
import { Add, Edit, Visibility } from "@mui/icons-material";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import CreateInspectionModal from "./CreateInspectionModal";
import { schedulingAPI } from "../../services/api";

// Import Calendar and types from react-big-calendar
import {
  Calendar,
  momentLocalizer,
  View,
  Event as RBCEvent,
} from "react-big-calendar";

const localizer = momentLocalizer(moment);

// Create DragAndDropCalendar component
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Define types
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
  inspectionPlan: string;
}

// Define the exact event type that react-big-calendar expects
interface CalendarEvent extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: InspectionEvent;
}

interface Props {
  events: InspectionEvent[];
  onEventSelect?: (event: InspectionEvent) => void;
  onSlotSelect?: (slot: { start: Date; end: Date }) => void;
  onEventCreated?: (event: InspectionEvent) => void; // New callback prop
  onInspectionCreated?: () => void; // Add this
}

const InspectionCalendar: React.FC<Props> = ({
  events = [],
  onEventSelect,
  onSlotSelect,
  onEventCreated,
  onInspectionCreated, // Add this to props
}) => {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<InspectionEvent | null>(
    null
  );

  // State for create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convert events to react-big-calendar format
  const calendarEvents: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: `${event.equipmentName} - ${event.assignedEngineer}`,
    start: new Date(event.start),
    end: new Date(event.end),
    resource: event,
  }));

  const handleSelectEvent = (event: CalendarEvent) => {
    const inspectionEvent = event.resource;
    setSelectedEvent(inspectionEvent);
    setShowEventModal(true);
    if (onEventSelect) {
      onEventSelect(inspectionEvent);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const now = new Date();

    // If selected start time is in the past, adjust to current time + 1 hour
    let adjustedStart = start;
    if (start < now) {
      adjustedStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    }

    // Ensure end date is after start date
    let adjustedEnd = end;
    if (end <= adjustedStart) {
      adjustedEnd = new Date(adjustedStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
    }

    setSelectedSlot({ start: adjustedStart, end: adjustedEnd });
    setShowCreateModal(true);

    if (onSlotSelect) {
      onSlotSelect({ start: adjustedStart, end: adjustedEnd });
    }
  };

  const handleEventMove = async ({ event, start, end }: any) => {
    try {
      const updatedEvent = {
        ...event.resource,
        start: start,
        end: end,
        updatedAt: new Date().toISOString(),
      };

      await schedulingAPI.updateInspection(event.resource.id, updatedEvent);

      // Update local state or refresh
      console.log("Event moved:", updatedEvent);
      alert("Event moved successfully!");
    } catch (error) {
      console.error("Failed to move event:", error);
      alert("Failed to move event. Please try again.");
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const inspectionEvent = event.resource;
    const backgroundColor = {
      scheduled: "#1976d2", // Blue
      "in-progress": "#ed6c02", // Orange
      completed: "#2e7d32", // Green
      cancelled: "#d32f2f", // Red
    }[inspectionEvent.status];

    const priorityBorder = {
      low: "2px solid #4caf50",
      medium: "2px solid #ff9800",
      high: "2px solid #f44336",
    }[inspectionEvent.priority];

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: priorityBorder,
        borderLeft: "4px solid white",
        padding: "2px 5px",
        fontSize: "12px",
        fontWeight: "bold",
      },
    };
  };

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

  // Fixed handleCreateNew function
  const handleCreateNew = () => {
    setSelectedSlot(null);
    setShowCreateModal(true);
  };

  // UPDATED handleSaveInspection function
  const handleSaveInspection = async (inspectionData: any) => {
    setIsLoading(true);
    try {
      console.log("Saving inspection to backend:", inspectionData);

      // Ensure end date is after start date
      if (inspectionData.end <= inspectionData.start) {
        alert("❌ End date must be after start date");
        setIsLoading(false);
        return;
      }

      // Prepare data for backend
      const dataToSend = {
        ...inspectionData,
        start: inspectionData.start, // Already ISO string from modal
        end: inspectionData.end, // Already ISO string from modal
        createdBy: "Current User", // TODO: Replace with actual user from auth context
      };

      // Remove id if it exists (backend will generate new one)
      delete dataToSend.id;

      // Call backend API
      const response = await schedulingAPI.createInspection(dataToSend);

      if (response.data && response.data.success) {
        alert("✅ Inspection scheduled successfully!");
        console.log("Created inspection:", response.data.data);

        // Close the modal
        setShowCreateModal(false);

        // Call the callback to refresh parent - FIXED: Use onInspectionCreated instead of props.onInspectionCreated
        if (onInspectionCreated) {
          onInspectionCreated();
        }

        // If parent component provided onEventCreated callback, call it with data
        if (onEventCreated && response.data.data) {
          onEventCreated(response.data.data);
        }

        // Also add to local events for immediate UI update
        if (response.data.data) {
          const newEvent = {
            ...response.data.data,
            start: new Date(response.data.data.start),
            end: new Date(response.data.data.end),
          };
          // Note: You could update local state here if needed
          console.log("New event created:", newEvent);
        }
      } else {
        // Handle cases where response structure is different
        if (response.data && response.data.error) {
          alert(`❌ Failed: ${response.data.error}`);
        } else {
          alert("✅ Inspection scheduled successfully!");
          setShowCreateModal(false);

          // Call the callback to refresh parent - FIXED
          if (onInspectionCreated) {
            onInspectionCreated();
          }

          // If we don't get data back but request succeeded
          if (onEventCreated) {
            // Create a temporary event object
            const tempEvent: InspectionEvent = {
              id: Date.now().toString(),
              ...inspectionData,
              start: new Date(inspectionData.start),
              end: new Date(inspectionData.end),
            };
            onEventCreated(tempEvent);
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to save inspection:", error);

      let errorMessage = "Failed to schedule inspection. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInspection = async (inspection: InspectionEvent) => {
    try {
      const updatedData = {
        ...inspection,
        title: prompt("Edit title:", inspection.title) || inspection.title,
      };

      await schedulingAPI.updateInspection(inspection.id, updatedData);
      alert("✅ Inspection updated successfully!");
    } catch (error) {
      console.error("Failed to update inspection:", error);
      alert("❌ Failed to update inspection");
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Inspection Schedule Calendar</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreateNew}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Schedule Inspection"}
          </Button>
        </Box>

        {/* Legend */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <Box
              width={12}
              height={12}
              bgcolor="#1976d2"
              mr={1}
              borderRadius={1}
            />
            <Typography variant="caption">Scheduled</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              width={12}
              height={12}
              bgcolor="#ed6c02"
              mr={1}
              borderRadius={1}
            />
            <Typography variant="caption">In Progress</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              width={12}
              height={12}
              bgcolor="#2e7d32"
              mr={1}
              borderRadius={1}
            />
            <Typography variant="caption">Completed</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              width={12}
              height={12}
              bgcolor="#d32f2f"
              mr={1}
              borderRadius={1}
            />
            <Typography variant="caption">Cancelled</Typography>
          </Box>
        </Box>

        {/* Calendar with Drag and Drop */}
        <DndProvider backend={HTML5Backend}>
          <Box sx={{ height: 500 }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor={(event: any) => (event as CalendarEvent).start}
              endAccessor={(event: any) => (event as CalendarEvent).end}
              views={["month", "week", "day", "agenda"]}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={(event: any) =>
                handleSelectEvent(event as CalendarEvent)
              }
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventMove}
              onEventResize={handleEventMove}
              selectable
              resizable
              eventPropGetter={(event: any) =>
                eventStyleGetter(event as CalendarEvent)
              }
              messages={{
                today: "Today",
                previous: "Back",
                next: "Next",
                month: "Month",
                week: "Week",
                day: "Day",
                agenda: "Agenda",
                date: "Date",
                time: "Time",
                event: "Event",
                noEventsInRange: "No inspections scheduled for this period",
              }}
              components={{
                toolbar: (props: any) => (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    p={1}
                  >
                    <Button onClick={() => props.onNavigate("PREV")}>
                      ‹ Prev
                    </Button>
                    <Typography variant="h6">
                      {moment(props.date).format("MMMM YYYY")}
                    </Typography>
                    <Button onClick={() => props.onNavigate("NEXT")}>
                      Next ›
                    </Button>
                  </Box>
                ),
              }}
            />
          </Box>
        </DndProvider>

        {/* Event Details Modal */}
        <Dialog
          open={showEventModal}
          onClose={() => setShowEventModal(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedEvent && (
            <>
              <DialogTitle>Inspection Details</DialogTitle>
              <DialogContent>
                <Box mb={2}>
                  <Typography variant="h6" gutterBottom>
                    {selectedEvent.equipmentName}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {selectedEvent.title}
                  </Typography>
                </Box>

                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={2}
                >
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Equipment ID
                    </Typography>
                    <Typography>{selectedEvent.equipmentId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Assigned Engineer
                    </Typography>
                    <Typography>{selectedEvent.assignedEngineer}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Start Time
                    </Typography>
                    <Typography>
                      {moment(selectedEvent.start).format(
                        "MMM DD, YYYY hh:mm A"
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      End Time
                    </Typography>
                    <Typography>
                      {moment(selectedEvent.end).format("MMM DD, YYYY hh:mm A")}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Priority
                    </Typography>
                    <Chip
                      label={selectedEvent.priority}
                      color={getPriorityColor(selectedEvent.priority)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedEvent.status}
                      color={getStatusColor(selectedEvent.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                {selectedEvent.inspectionPlan && (
                  <Box mt={2}>
                    <Typography variant="caption" color="textSecondary">
                      Inspection Plan
                    </Typography>
                    <Typography>{selectedEvent.inspectionPlan}</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowEventModal(false)}>Close</Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => {
                    console.log("View plan:", selectedEvent.inspectionPlan);
                    alert(`Would open: ${selectedEvent.inspectionPlan}`);
                  }}
                >
                  View Plan
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => handleEditInspection(selectedEvent)}
                >
                  Edit
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Inspection Modal */}
        <CreateInspectionModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveInspection}
          initialStart={selectedSlot?.start}
          initialEnd={selectedSlot?.end}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default InspectionCalendar;
