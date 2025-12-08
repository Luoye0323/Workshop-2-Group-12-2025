export interface DashboardStats {
  totalEquipment: number;
  processedDrawings: number;
  pendingInspections: number;
  completedInspections: number;
  dataAccuracy: number;
}

export interface KPI {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'processing' | 'inspection' | 'approval';
  description: string;
  timestamp: string;
  user: string;
  status: 'completed' | 'pending' | 'failed';
}