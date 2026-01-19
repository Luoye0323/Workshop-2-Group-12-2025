'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ================= Role-based Access Control =================
  type Role = 'admin' | 'rbi lead' | 'rbi engineer' | 'tech assistant';
  const role = userProfile?.position as Role | undefined;
  const isAdmin = role === 'admin';

  // ================= Auth Guard =================
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // ================= Route Protection =================
  useEffect(() => {
    // Only admin can access /main/create-user
    if (pathname === '/main/create-user' && !isAdmin) {
      router.replace('/main/dashboard');
    }
  }, [pathname, isAdmin, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/main/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Add New User',
      href: '/main/create-user',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      name: 'Templates',
      href: '/main/templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Tasks',
      href: '/main/tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Navigation */}
      <nav className="bg-[var(--card)] shadow-sm fixed w-full z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)] lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <div className="flex flex-col items-center">
                <img src="/ipetro-logo.svg" alt="IPETRO Logo" className="h-12 w-auto" />
                <p className="text-[var(--foreground)] mt-1 text-sm">AI-Powered RBI Planner</p>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {userProfile?.name || 'User'}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:pt-24 lg:z-20">
        <div className="flex flex-col w-64 bg-[var(--card)] border-r border-[var(--border)]">
          <div className="flex-grow flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-2 space-y-1">
              {navigation
                .filter(item => item.href !== '/main/create-user' || isAdmin) // <-- ONLY ADMIN
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-[var(--border)] p-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Logged in as</p>
              <p className="text-sm font-semibold text-black-600 truncate uppercase">{userProfile?.position || 'User'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-[var(--muted)] bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-[var(--card)] z-50 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border)]">
              <h1 className="text-xl font-bold text-[var(--primary)]">IPETRO</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigation
                .filter(item => item.href !== '/main/create-user' || isAdmin) // <-- ONLY ADMIN
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                        }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
            </nav>

            <div className="border-t border-[var(--border)] p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 pt-24">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
