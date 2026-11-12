import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '../../services';
import { TrendingUp, IndianRupee, Users, FileCheck2, BookOpen } from 'lucide-react';

const COLORS = ['#1769D2', '#12356B', '#059669', '#D97706'];

const DIVISION_LABELS = {
  BANKERS_PATH: "Bankers' Path",
  COMPETITIVE_EXAMS: 'Competitive Exams',
  ENTRANCE_EXAMS: 'Entrance Exams',
  TUITIONS: 'Tuitions',
};

export const AdminReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getReportsData()
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-20 text-center">
      <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-xs font-semibold text-slate-500">Loading reports...</p>
    </div>
  );

  const summary = data?.summary || {};

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">Analytics & Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Revenue, enrollment trends and division breakdown</p>
      </div>

      {/* Summary Cards */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'emerald' },
          { label: 'Total Enrollments', value: summary.totalEnrollments || 0, icon: BookOpen, color: 'blue' },
          { label: 'Active Students', value: summary.activeStudents || 0, icon: Users, color: 'purple' },
          { label: 'Exams Taken', value: summary.totalExamAttempts || 0, icon: FileCheck2, color: 'amber' },
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center shrink-0`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase">{card.label}</span>
              <p className="text-2xl font-black text-[#12356B]">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Scrollable Section */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1 space-y-6">
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-[#12356B] font-heading mb-4">Monthly Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#1769D2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-[#12356B] font-heading mb-4">Enrollment Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.monthlyEnrollments || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="enrollments" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Division Pie */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-[#12356B] font-heading mb-4">Enrollment by Division</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-[260px] h-[260px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.divisionBreakdown || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {(data?.divisionBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, DIVISION_LABELS[name] || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3">
            {(data?.divisionBreakdown || []).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }}></span>
                <span className="font-semibold text-slate-700">{DIVISION_LABELS[d.name] || d.name}</span>
                <span className="ml-auto font-bold text-[#12356B] pl-6">{d.value}</span>
              </div>
            ))}
            {(!data?.divisionBreakdown || data.divisionBreakdown.length === 0) && (
              <p className="text-xs text-slate-400 font-medium">No enrollment data yet.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
