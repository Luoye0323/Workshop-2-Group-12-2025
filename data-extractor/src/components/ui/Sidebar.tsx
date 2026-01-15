import { Home, Upload, History, Download, FileText, Brain, Users, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'new-extraction', icon: Upload, label: 'New Extraction' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'downloads', icon: Download, label: 'Downloads' },
    { id: 'templates', icon: FileText, label: 'Templates' },
    { id: 'ai-models', icon: Brain, label: 'AI Models' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-[260px]'
      } bg-[#1E293B] h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-50`}
    >
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#0F172A]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded flex items-center justify-center">
              <span className="text-white">GA</span>
            </div>
            <span className="text-white">Data Extractor</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white p-1 hover:bg-[#0F172A] rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-gray-300 hover:bg-[#0F172A] hover:text-white'
              }`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[#0F172A] p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <span className="text-white">JD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white truncate">John Doe</div>
              <div className="text-gray-400 text-sm">Engineer</div>
            </div>
          )}
          {!collapsed && (
            <button
              className="text-gray-400 hover:text-white p-1 hover:bg-[#0F172A] rounded transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
