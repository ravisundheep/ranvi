import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DeviceRevokedBanner } from '../common/DeviceRevokedBanner';
import { RanviLogo } from '../common/RanviLogo';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FileCheck2,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  Award,
} from 'lucide-react';

export const StudentLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Enrolled Courses', path: '/student/my-courses', icon: BookOpen },
    { name: 'Available Tuition Programs', path: '/student/available-programs', icon: GraduationCap },
    { name: 'My Enrollments & Receipts', path: '/student/enrollments', icon: Receipt },
    { name: 'Live Classes (Zoom)', path: '/student/live-classes', icon: Video },
    { name: 'Online Mock Tests', path: '/student/mock-tests', icon: FileCheck2 },
    { name: 'Payment History', path: '/student/payments', icon: Receipt },
    { name: 'Profile & Device', path: '/student/profile', icon: User },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] overflow-hidden">
      <DeviceRevokedBanner />

      {/* Top Header */}
      <header className="h-20 shrink-0 bg-white border-b border-slate-200 z-30 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between relative">
          {/* Mobile Menu Icon (Left on mobile) */}
          <div className="flex lg:hidden items-center z-10">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo (Centered on mobile, Left on desktop) */}
          <div className="lg:static absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto flex items-center z-10">
            <Link to="/" className="flex items-center">
              <RanviLogo size="small" />
            </Link>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 z-10">
            <div className="hidden sm:flex items-center gap-2 bg-[#EAF3FF] text-[#12356B] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#1769D2]/20">
              <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
              <span>Single-Device Active</span>
            </div>

            <Link
              to="/"
              className="text-xs font-bold text-slate-700 hover:text-[#12356B] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              Public Website <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1976D2] to-[#0D47A1] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-blue-100">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#0B1E3D] leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{user?.targetExam || 'Student'}</p>
              </div>
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

        {/* Left Sidebar */}
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Enrolled Student Badge Card */}
            <div className="px-4 py-3.5 rounded-2xl bg-gradient-to-br from-[#0B1E3D] to-[#1769D2] text-white shadow-md">
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Enrolled Student</p>
              <p className="text-sm font-bold truncate mt-0.5">{user?.name}</p>
              <p className="text-[11px] text-[#F4B942] font-semibold mt-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {user?.targetExam || 'General Banking Aspirant'}
              </p>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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

        {/* Scrollable Main Content on the Right */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
