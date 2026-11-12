import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services';
import { useSocket, useRealtimeEvent } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  BookOpen,
  Video,
  FileCheck2,
  CreditCard,
  TrendingUp,
  Award,
  ShieldAlert,
  ArrowRight,
  Plus,
  RotateCw,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { isConnected } = useSocket();
  const { user, isAdmin, hasRole } = useAuth();
  const { info: toastInfo, success: toastSuccess } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);

      const res = await adminService.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showFullLoader) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);

    // Silent periodic refresh interval (30s)
    const interval = setInterval(() => {
      fetchStats(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Real-Time Event Handlers
  useRealtimeEvent('admin:stats_updated', useCallback(() => {
    fetchStats(false);
  }, [fetchStats]));

  useRealtimeEvent('student:registered', useCallback((payload) => {
    fetchStats(false);
    if (payload?.student?.name) {
      toastSuccess(`New student registered: ${payload.student.name}`);
    }
  }, [fetchStats, toastSuccess]));

  useRealtimeEvent('order:placed', useCallback((payload) => {
    fetchStats(false);
    if (payload?.order) {
      toastSuccess(`New order verified: ₹${payload.order.amount}`);
    }
  }, [fetchStats, toastSuccess]));

  useRealtimeEvent('enquiry:received', useCallback((payload) => {
    fetchStats(false);
    if (payload?.enquiry?.fullName) {
      toastInfo(`New enquiry from ${payload.enquiry.fullName}`);
    }
  }, [fetchStats, toastInfo]));

  useRealtimeEvent('courses:updated', useCallback(() => {
    fetchStats(false);
  }, [fetchStats]));

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading admin operations metrics...</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const recentStudents = stats?.recentStudents || [];
  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Top Welcome & Quick Actions */}
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
              Ranvi Institutions Admin Portal
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-600">{isConnected ? 'Live Sync Active' : 'Connecting...'}</span>
            </div>
            <button
              onClick={() => fetchStats(false)}
              disabled={refreshing}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              title="Refresh Stats"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational dashboard for course catalog, Zoom live classes, student access, payments, and mock exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Course
            </Link>
          )}
          {hasRole('ADMIN', 'FACULTY', 'SUPPORT_STAFF') && (
            <Link
              to="/admin/live-classes"
              className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              <Video className="w-4 h-4" /> Live Classes
            </Link>
          )}
          {hasRole('ADMIN', 'FINANCE_STAFF') && (
            <Link
              to="/admin/approvals"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              Approvals Queue
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row (Role-Scoped) */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.totalStudents !== null && metrics.totalStudents !== undefined && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">Total Students</span>
              <p className="text-2xl font-black text-[#12356B]">{metrics.totalStudents}</p>
            </div>
          </div>
        )}

        {metrics.totalRevenue !== null && metrics.totalRevenue !== undefined && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">Verified Revenue</span>
              <p className="text-2xl font-black text-emerald-700">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Published Courses</span>
            <p className="text-2xl font-black text-[#12356B]">{metrics.totalCourses || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Model Papers</span>
            <p className="text-2xl font-black text-[#12356B]">{metrics.totalMockTests || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid (Role-Scoped) - Independently Scrollable */}
      {(hasRole('ADMIN', 'SUPPORT_STAFF') || hasRole('ADMIN', 'FINANCE_STAFF')) && (
        <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Registrations */}
          {hasRole('ADMIN', 'SUPPORT_STAFF') && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#12356B] font-heading flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1769D2]" /> Recent Student Registrations
                </h3>
                <Link to="/admin/students" className="text-xs font-bold text-[#1769D2] hover:underline">
                  View all
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentStudents.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#12356B]">{s.name}</p>
                      <p className="text-slate-400">{s.email} • {s.phone}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {hasRole('ADMIN', 'FINANCE_STAFF') && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#12356B] font-heading flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Recent Verified Orders
                </h3>
                <Link to="/admin/payments" className="text-xs font-bold text-[#1769D2] hover:underline">
                  View all
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentOrders.map((o) => (
                  <div key={o._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#12356B]">{o.studentId?.name || 'Student'}</p>
                      <p className="text-slate-400 font-mono text-[10px]">{o.receiptNumber || o.razorpayOrderId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-700">₹{o.amount}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
