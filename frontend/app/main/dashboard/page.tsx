'use client';

import { useEffect, useState } from 'react';
import { Calendar, Formats, momentLocalizer, ToolbarProps, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '@/lib/api';
import { TaskResponse } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const localizer = momentLocalizer(moment);

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const router = useRouter();

  // Custom formats
  const formats: Partial<Formats> = {
    eventTimeRangeFormat: () => '',
    timeGutterFormat: () => '',
    agendaHeaderFormat: () => 'Task',
  };

  // Fetch tasks once
  useEffect(() => {
    const fetchTasks = async () => {
      const res = await api.tasks.listUserTasks();
      setTasks(res.tasks);
    };
    fetchTasks();
  }, []);

  // Map tasks to calendar format and detect overdue
  const taskItems = tasks.map(task => {
    let status = task.status;
    if (new Date(task.dueDate) < new Date() && status !== 'Completed') {
      status = 'Overdue';
    }
    return {
      ...task,
      start: new Date(task.startDate),
      end: new Date(task.dueDate),
      status,
    };
  });

  // Status colors
  const statusColorMap: Record<string, string> = {
    'In Progress': '#3B82F6',
    'Completed': '#10B981',
    'Overdue': '#EF4444',
  };

  const taskStyleGetter = (task: any) => ({
    style: {
      backgroundColor: statusColorMap[task.status] || '#3B82F6',
      color: 'white',
      borderRadius: '4px',
      padding: '2px 4px',
      marginBottom: '2px',
      fontSize: '0.85rem',
    },
  });

  const TaskComponent = ({ event }: { event: any }) => {
    if (!event) return null;
    return (
      <div
        title={`Task: ${event.taskName || event.title}
Members: ${event.members?.join(', ') || '-'}
Created by: ${event.createdBy}
Due: ${event.end?.toLocaleDateString()}`}
      >
        {event.taskName || event.title}
      </div>
    );
  };

  const CustomToolbar = (toolbar: ToolbarProps) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');
    const switchToMonth = () => toolbar.onView('month');

    const buttonStyle: React.CSSProperties = {
      padding: '6px 12px',
      margin: '0 5px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      backgroundColor: 'white',
      color: 'black',
      cursor: 'pointer',
      fontWeight: 'bold',
    };

    const labelStyle: React.CSSProperties = {
      fontWeight: 'bold',
      fontSize: 16,
      textAlign: 'center' as const,
      flexGrow: 1,
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <button style={buttonStyle} onClick={goToBack}>Prev</button>
        <button style={buttonStyle} onClick={goToToday}>Today</button>
        <button style={buttonStyle} onClick={goToNext}>Next</button>
        <div style={labelStyle}>{toolbar.label}</div>
        <button style={buttonStyle} onClick={switchToMonth}>Month</button>
      </div>
    );
  };

  // Task summary
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

  return (
    <div style={{ padding: 20 }}>
      {/* Personal Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3"><span className='font-semibold'>Hello</span> {userProfile?.name} !</h2>
        <p className="text-sm text-black-600">Position: {userProfile?.position ? userProfile.position.charAt(0).toUpperCase() + userProfile.position.slice(1) : ''}</p>
        <p className="text-sm text-black-600">Email   : {userProfile?.email}</p>
        <p className="text-sm text-black-600">Phone   : {userProfile?.phone}</p>
        <p className="text-sm text-black-600">Gender: {userProfile?.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : ''}</p>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-xl font-bold text-gray-900">{totalTasks}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-xl font-bold text-blue-600">{inProgressTasks}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-xl font-bold text-green-600">{completedTasks}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-xl font-bold text-red-600">{overdueTasks}</p>
        </div>
      </div>

      {/* Status Legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ backgroundColor: '#3B82F6', color: 'white', padding: '4px 8px', borderRadius: 4 }}>In Progress</div>
        <div style={{ backgroundColor: '#10B981', color: 'white', padding: '4px 8px', borderRadius: 4 }}>Completed</div>
        <div style={{ backgroundColor: '#EF4444', color: 'white', padding: '4px 8px', borderRadius: 4 }}>Overdue</div>
      </div>

      {/* Task Calendar */}
      <div style={{ height: '80vh' }}>
        <Calendar
          localizer={localizer}
          events={taskItems}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month', 'agenda']} // allow switching to agenda if needed
          view={currentView}
          onView={(view) => setCurrentView(view)}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          eventPropGetter={taskStyleGetter}
          formats={formats}
          components={{ event: TaskComponent, toolbar: CustomToolbar }}
          showMultiDayTimes={true}
          popup={true} // <-- enables "+ n more" popup
          onSelectEvent={(task: any) => router.push(`/main/tasks/${task.id}`)}
        />
      </div>
    </div>
  );
}
