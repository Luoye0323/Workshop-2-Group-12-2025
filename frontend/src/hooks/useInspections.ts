import { useState, useEffect } from "react";
import { schedulingAPI } from "../services/api";

interface Inspection {
  id: string;
  title: string;
  start: string;
  end: string;
  equipmentId: string;
  equipmentName: string;
  assignedEngineer: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  inspectionPlan: string;
}

export const useInspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await schedulingAPI.getInspections();

      if (response.data.success) {
        // Convert string dates to Date objects for calendar
        const formattedInspections = response.data.data.map((insp: any) => ({
          ...insp,
          start: new Date(insp.start),
          end: new Date(insp.end),
        }));

        setInspections(formattedInspections);
      } else {
        setError(response.data.error || "Failed to fetch inspections");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch inspections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const refreshInspections = () => {
    fetchInspections();
  };

  return { inspections, loading, error, refreshInspections };
};
