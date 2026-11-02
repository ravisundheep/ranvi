import React, { useState, useMemo } from 'react';
import { PageBanner } from '../../components/common/PageBanner';
import { Video, Calendar, Clock, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OnlineClassesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const sampleBatches = [
    { program: 'JAIIB Master Batch 2026', type: 'Evening Regular', time: '7:30 PM - 9:00 PM (Daily)', faculty: 'Prof. Rajesh Sharma (Ex-AGM SBI)', platform: 'Zoom Live' },
    { program: 'CAIIB Executive Batch', type: 'Late Evening', time: '8:30 PM - 10:00 PM (Mon-Sat)', faculty: 'Shri Arvind Narayanan (Ex-Chief Mgr PNB)', platform: 'Zoom Live' },
    { program: 'IBPS & SBI PO Foundation', type: 'Morning Intensive', time: '9:00 AM - 12:00 PM (Mon-Fri)', faculty: 'Kavita Iyer & Anurag Mishra', platform: 'Zoom Live' },
    { program: 'SSC CGL / CHSL Selection Batch', type: 'Daytime Batch', time: '10:00 AM - 1:00 PM (Daily)', faculty: 'Deepak Saxena', platform: 'Zoom Live' },
    { program: 'JEE Main Engineering Batch', type: 'Weekend Crash Course', time: '9:00 AM - 1:00 PM (Sat-Sun)', faculty: 'Dr. Suresh Varma (IIT-M Alum)', platform: 'Zoom Live' },
    { program: 'NEET-UG Medical Masterclass', type: 'Daily Morning', time: '6:30 AM - 8:30 AM (Daily)', faculty: 'Dr. A. Meenakshi (AIIMS Specialist)', platform: 'Zoom Live' },
  ];

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return sampleBatches;
    const q = searchQuery.trim().toLowerCase();
    return sampleBatches.filter(
      (b) =>
        b.program.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.faculty.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-12 pb-20">
      <PageBanner
        title="Live Interactive Online Classes via Zoom"
        subtitle="Experience high-definition live streaming lectures led by senior ex-bank executives. Ask doubts in real-time, review digital whiteboard notes, and access instant recordings."
        breadcrumbs={[{ label: 'Online Classes' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#1769D2] flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Live Zoom Integration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enrolled students can join secure live Zoom batches with a single click from their personalized student portal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Flexible Daily Timings</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Early morning (6:30 AM) and evening (7:30 PM & 8:30 PM) batches designed specially to suit working banking professionals.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12356B] font-heading">Recorded Backup Available</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Missed a live session due to bank branch work? High-definition recorded backups are automatically added within 2 hours.
            </p>
          </div>
        </div>

        {/* Live Batch Timetable Overview */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-[#1769D2] tracking-wider">Weekly Schedule</span>
              <h2 className="text-2xl font-extrabold text-[#12356B] font-heading mt-1">
                Upcoming Live Class Batches
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batch or faculty..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <Link
                to="/student/live-classes"
                className="inline-flex items-center gap-2 bg-[#12356B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#0e2a56] transition-colors shadow-xs"
              >
                Access Live Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                  <th className="p-3.5 font-bold">Program</th>
                  <th className="p-3.5 font-bold">Batch Type</th>
                  <th className="p-3.5 font-bold">Timings (IST)</th>
                  <th className="p-3.5 font-bold">Faculty Lead</th>
                  <th className="p-3.5 font-bold">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      No live batches found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-[#12356B]">{b.program}</td>
                      <td className="p-3.5">{b.type}</td>
                      <td className="p-3.5 font-semibold">{b.time}</td>
                      <td className="p-3.5">{b.faculty}</td>
                      <td className="p-3.5">
                        <span className="bg-blue-50 text-[#1769D2] font-bold px-2 py-1 rounded">
                          {b.platform}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineClassesPage;
