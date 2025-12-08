export interface InspectionEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  equipmentId: string;
  equipmentName: string;
  assignedEngineer: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  inspectionPlan: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
}