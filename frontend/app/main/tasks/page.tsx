'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import type { CreateTaskResponse, UserProfile } from '@/lib/types';
import Link from 'next/link';
import Select from 'react-select';

interface UserOption {
  value: string;
  label: string;
}

interface GroupedUsers {
  label: string;
  options: UserOption[];
}

export default function TaskPage() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<CreateTaskResponse['task'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailToNameMap, setEmailToNameMap] = useState<Record<string, string>>({});
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<CreateTaskResponse['task'] | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMembers, setEditMembers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  const canEditTasks = userProfile?.position === 'admin' || userProfile?.position === 'rbi lead';
  const today = new Date().toISOString().split("T")[0];

  // Fetch all users
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setUsersLoading(true);
        const usersResponse = await api.users.list();
        const users = usersResponse.users || [];
        setAllUsers(users);

        const mapping: Record<string, string> = {};
        users.forEach((user: any) => {
          if (user.email && user.name) {
            mapping[user.email] = user.name;
          }
        });
        setEmailToNameMap(mapping);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await api.tasks.listUserTasks();
        setTasks(response.tasks || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getNameFromEmail = (email: string): string => emailToNameMap[email] || email;

  const groupedOptions: GroupedUsers[] = (() => {
    if (allUsers.length === 0) return [];
    const grouped: { [key: string]: UserProfile[] } = { 'rbi_lead': [], 'rbi_engineer': [], 'tech_assistant': [], 'admin': [], 'other': [] };
    allUsers.forEach(user => {
      const position = user.position?.toLowerCase().replace(' ', '_') || 'other';
      (grouped[position] || grouped['other']).push(user);
    });
    return Object.entries(grouped)
      .filter(([_, users]) => users.length > 0)
      .map(([position, users]) => ({
        label: position.replace('_', ' ').toUpperCase(),
        options: users.map(u => ({ value: u.email, label: `${u.name} (${u.email})` })),
      }));
  })();

  const handleEditClick = (task: CreateTaskResponse['task']) => {
    setEditingTask(task);
    setEditTaskName(task.taskName);
    setEditStartDate(task.startDate);
    setEditDueDate(task.dueDate);

    const memberOptions = task.members?.map(email => ({
      value: email,
      label: `${emailToNameMap[email] || 'Unknown'} (${email})`
    })) || [];
    setEditMembers(memberOptions);
    setEditError(null);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setEditTaskName("");
    setEditStartDate("");
    setEditDueDate("");
    setEditMembers([]);
    setEditError(null);
  };

  const nextDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    setEditError(null);
    setSaving(true);

    try {
      if (!editTaskName.trim()) throw new Error("Task name is required");
      if (!editStartDate || !editDueDate || editDueDate <= editStartDate) throw new Error("Due date must be after start date");
      if (editMembers.length === 0) throw new Error("Please select at least one member");

      await api.tasks.updateTask(editingTask.taskId, {
        taskName: editTaskName,
        startDate: editStartDate,
        dueDate: editDueDate,
        members: editMembers.map(m => m.value),
      });

      const response = await api.tasks.listUserTasks();
      setTasks(response.tasks || []);
      handleCloseModal();
    } catch (err: any) {
      setEditError(err.message || "Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  // --- FULL-PAGE LOADING AND ERROR HANDLING ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 text-lg font-medium">Loading tasks...</p>
        </div>
        <p className="mt-4 text-gray-400 text-sm">Please wait while we fetch your tasks.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
        <p className="mt-2 text-gray-400 text-sm">
          Try refreshing the page or check your internet connection.
        </p>
      </div>
    );
  }

  // --- MAIN PAGE ---
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="mt-1 text-sm text-gray-600">View and manage your tasks</p>
        </div>
        {canEditTasks && (
          <Link
            href="/main/tasks/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Task
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
        {tasks.length === 0 && (
          <p className="text-gray-500">No tasks found.</p>
        )}

        {tasks.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Task Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Start Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Due Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Member</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created By</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map(task => {
                const members = task.members || [];
                const memberCount = members.length || 1;
                
                return members.length > 0 ? (
                  members.map((member, index) => (
                    <tr key={`${task.taskId}-${index}`}>
                      {index === 0 && (
                        <>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            {task.taskName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            {task.startDate}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            {task.dueDate}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            {task.status}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {getNameFromEmail(member)}
                      </td>
                      {index === 0 && (
                        <>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            {getNameFromEmail(task.createdBy)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900" rowSpan={memberCount}>
                            <div className="flex gap-2">
                              <Link
                                href={`/main/tasks/${task.taskId}`}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                              >
                                Open
                              </Link>
                              {canEditTasks && userProfile.email === task.createdBy && (
                                <button
                                  onClick={() => handleEditClick(task)}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr key={task.taskId}>
                    <td className="px-4 py-2 text-sm text-gray-900">{task.taskName}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{task.startDate}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{task.dueDate}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{task.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 italic">No members</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{getNameFromEmail(task.createdBy)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="flex gap-2">
                        <Link
                          href={`/main/tasks/${task.taskId}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Open
                        </Link>
                        {canEditTasks && userProfile.email === task.createdBy && (
                          <button
                            onClick={() => handleEditClick(task)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      min={today}
                      required
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      min={editStartDate ? nextDay(editStartDate) : nextDay(today)}
                      required
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Members <span className="text-red-500">*</span>
                  </label>
                  {usersLoading ? (
                    <div className="text-sm text-gray-500 italic py-2">Loading users...</div>
                  ) : groupedOptions.length === 0 ? (
                    <div className="text-sm text-red-500 py-2">
                      No users available. Please check your connection.
                    </div>
                  ) : (
                    <Select
                      options={groupedOptions}
                      isMulti
                      value={editMembers}
                      onChange={(selected) => setEditMembers(selected as UserOption[])}
                      className="mt-1"
                      placeholder="Select members..."
                      closeMenuOnSelect={false}
                      noOptionsMessage={() => "No users available"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '38px',
                          borderColor: '#d1d5db',
                        }),
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || groupedOptions.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}