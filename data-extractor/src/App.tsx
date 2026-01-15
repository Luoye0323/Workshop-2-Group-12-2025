import { useState } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { Login } from './components/ui/Login';
import { Dashboard } from './components/ui/Dashboard';
import { NewExtraction } from './components/ui/NewExtraction';
import { DataReview } from './components/ui/DataReview';
import { History } from './components/ui/History';
import { Downloads } from './components/ui/Downloads';
import { Templates } from './components/ui/Templates';
import { AIModels } from './components/ui/AIModels';
import { Users } from './components/ui/Users';
import { Settings } from './components/ui/Settings';
import './App.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if(!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === "data-review") {
    return (
      <div className='flex'>
        <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        />
        <div 
          className={`flex-1 ${sidebarCollapsed ? "ml-16" : "ml-[260px]"} transition-all duration-300`}
        >
          <DataReview/>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar
      currentPage={currentPage}
      onNavigate={handleNavigate}
      collapsed={sidebarCollapsed}
      onToggleCollapse={toggleSidebar}
      />

      <main 
        className={`flex-1 ${sidebarCollapsed ? "ml-16" : "ml-[260px]"} transition-all duration-300`}
        >
          {currentPage === "dashboard" && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {currentPage === "new-extraction" && <NewExtraction />}
          {currentPage === "history" && <History/>}
          {currentPage === "downloads" && <Downloads/>}
          {currentPage === "templates" && <Templates/>}
          {currentPage === "ai-models" && <AIModels/>}
          {currentPage === "users" && <Users/>}
          {currentPage === "settings" && <Settings/>}
      </main>
      console.log("hello")
    </div>
  );
}