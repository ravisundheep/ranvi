import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RanviLogo } from '../common/RanviLogo';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FileCheck2,
  Users,
  CreditCard,
  MessageSquareQuote,
  Settings,
  ShieldAlert,
  GraduationCap,
  Receipt,
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Course Management', path: '/admin/courses', icon: BookOpen },
    { name: 'Tuition Programs', path: '/admin/tuitions', icon: GraduationCap },
    { name: 'Enrollments & Admissions', path: '/admin/enrollments', icon: Receipt },
    { name: 'Entrance Exam Programs', path: '/admin/entrance-exams', icon: GraduationCap },
    { name: 'Latest Updates', path: '/admin/updates', icon: Bell },
    { name: 'Announcements & Alerts', path: '/admin/notifications', icon: Bell },
    { name: 'Faculty Mentors', path: '/admin/faculty', icon: Users },
    { name: 'Recorded Lessons', path: '/admin/lessons', icon: Video },
    { name: 'Live Classes (Zoom)', path: '/admin/live-classes', icon: Video },
    { name: 'Mock Tests & Papers', path: '/admin/mock-tests', icon: FileCheck2 },
    { name: 'Students & Devices', path: '/admin/students', icon: Users },
    { name: 'Payments & Revenue', path: '/admin/payments', icon: CreditCard },
    { name: 'Enquiries & Leads', path: '/admin/enquiries', icon: MessageSquareQuote },
    { name: 'Website Settings', path: '/admin/settings', icon: Settings },
    { name: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Header */}
      <header className="h-20 shrink-0 bg-[#0B1E3D] text-white border-b border-blue-900 z-30 shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between relative">
          {/* Mobile Menu Icon (Left on mobile) */}
          <div className="flex lg:hidden items-center z-10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo (Centered on mobile, Left on desktop) */}
          <div className="lg:static absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto flex items-center z-10">
            <Link to="/" className="flex items-center">
              <RanviLogo size="small" variant="light" />
              <span className="hidden sm:inline-block ml-3 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#1769D2] text-white uppercase tracking-wider">
                ADMIN CONTROL
              </span>
            </Link>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 z-10">
            <Link
              to="/"
              className="text-xs font-bold text-white/90 hover:text-white px-3.5 py-2 rounded-xl bg-white/10 hidden md:inline-flex items-center gap-1.5 hover:bg-white/20 transition-colors"
            >
              View Public Website <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-white/20">
              <span className="text-xs font-bold text-white hidden sm:inline">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-300 hover:bg-rose-900/50 hover:text-rose-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Fixed Left Sidebar + Scrollable Right Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header in Drawer */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden shrink-0">
            <RanviLogo size="small" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Nav Area inside Sidebar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#0B1E3D] text-white shadow-md shadow-[#0B1E3D]/20'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-[#0B1E3D]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer with Sign Out */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Admin Content Outlet */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
