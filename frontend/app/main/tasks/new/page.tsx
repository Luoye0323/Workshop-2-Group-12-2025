'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Template, UsersByPosition } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import Select, { GroupBase } from 'react-select';

interface UserOption {
  value: string; // user email
  label: string; // user name + email
}

interface GroupedUsers extends GroupBase<UserOption> {
  label: string;
  options: UserOption[];
}

export default function NewTaskPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [members, setMembers] = useState<UserOption[]>([]);
  const [sheetTemplate, setSheetTemplate] = useState("");
  const [slideTemplate, setSlideTemplate] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ excel: Template[]; inspection: Template[] }>({
    excel: [],
    inspection: []
  });
  const [usersByPosition, setUsersByPosition] = useState<UsersByPosition>({
    rbi_lead: [],
    rbi_engineer: [],
    tech_assistant: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.templates.getAll();
        setTemplates({ excel: res.excelTemplates, inspection: res.inspectionTemplates });
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch users grouped by position
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true); 
        const res = await api.users.listAllByPosition();
        const normalized: UsersByPosition = {
          rbi_lead: Object.values(res.rbi_lead || {}).filter(u => u.email !== userProfile?.email),
          rbi_engineer: Object.values(res.rbi_engineer || {}).filter(u => u.email !== userProfile?.email),
          tech_assistant: Object.values(res.tech_assistant || {}).filter(u => u.email !== userProfile?.email),
        };
        setUsersByPosition(normalized);
      } catch (err) {
        console.error(err);
      }finally{
         setLoadingUsers(false); // done loading
      }
      
    };
    fetchUsers();
  }, [userProfile]);

  // Convert usersByPosition to grouped options for react-select
  const groupedOptions: GroupedUsers[] = Object.entries(usersByPosition).map(([position, users]) => ({
    label: position.replace('_', ' ').toUpperCase(),
    options: users.map(u => ({
      value: u.email,
      label: `${u.name} (${u.email})`
    }))
  }));

  // Helper to get the next day for due date
  const nextDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(null);

    try {
      if (!startDate || !dueDate || dueDate <= startDate) {
        setError("Due date must be after start date");
        setLoading(false);
        return;
      }

      await api.tasks.createTask({
        taskName,
        startDate,
        dueDate,
        members: members.map(m => m.value),
        sheetTemplateId: sheetTemplate,
        slideTemplateId: slideTemplate
      });

      setSuccess("Task created successfully!");

      setTimeout(() => router.push("/main/tasks"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        {success && <p className="text-green-600 font-medium">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={startDate ? nextDay(startDate) : nextDay(today)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Members selection with search and multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Assign Members</label>
          <Select
            options={groupedOptions}
            isMulti
            value={members}
            onChange={(selected) => setMembers(selected as UserOption[])}
            className="mt-1"
            placeholder={loadingUsers ? "Loading users..." : "Select members..."}
            closeMenuOnSelect={false}
            isDisabled={loadingUsers}
            noOptionsMessage={() => loadingUsers ? "Loading staff..." : "No staff available"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sheet Template</label>
            <select
              value={sheetTemplate}
              onChange={(e) => setSheetTemplate(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Sheet Template</option>
              {templates.excel.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slide Template</label>
            <select
              value={slideTemplate}
              onChange={(e) => setSlideTemplate(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Slide Template</option>
              {templates.inspection.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading && (
              <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                ></path>
                </svg>
              )}
              <span>{loading ? "Creating..." : "Create Task"}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/main/tasks")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
