import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tuitionService } from '../../services';
import {
  GraduationCap,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

const DEFAULT_FALLBACK_PROGRAMS = [
  {
    _id: 'default-prog-1',
    title: 'Class 10 Board Exam Target Batch (CBSE / State)',
    slug: 'class-10-board-exam-target-batch',
    division: 'TUITIONS',
    mode: 'BOTH',
    price: 3499,
    originalPrice: 4999,
    availableSeats: 18,
    totalSeats: 30,
    duration: 'Full Academic Year',
    shortDescription: 'Comprehensive mathematics, science & English board coaching with daily practice problem sheets.',
  },
  {
    _id: 'default-prog-2',
    title: 'Intermediate 1st & 2nd Year (MPC / BiPC)',
    slug: 'intermediate-1st-2nd-year-mpc-bipc',
    division: 'TUITIONS',
    mode: 'BOTH',
    price: 4999,
    originalPrice: 6999,
    availableSeats: 12,
    totalSeats: 35,
    duration: 'Academic Term (10 Months)',
    shortDescription: 'In-depth conceptual lectures, IPE formula sheets, and integrated weekend entrance orientation.',
  },
  {
    _id: 'default-prog-3',
    title: 'Degree Tuitions (B.Sc / B.Com / BBA Coaching)',
    slug: 'degree-tuitions-bsc-bcom-bba-coaching',
    division: 'TUITIONS',
    mode: 'ONLINE',
    price: 3999,
    originalPrice: 5999,
    availableSeats: 25,
    totalSeats: 40,
    duration: 'Semester Intensive',
    shortDescription: 'Expert faculty coaching for financial accounting, corporate math, business statistics & computers.',
  },
];

export const AvailableProgramsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const fetchFn = tuitionService.getPublishedPrograms || tuitionService.getTuitionPrograms;
        const res = await fetchFn({
          search: search || undefined,
          mode: selectedMode !== 'ALL' ? selectedMode : undefined,
          limit: 30,
        });
        if (isMounted && res?.success && res.data) {
          const list = res.data.courses || res.data;
          setPrograms(Array.isArray(list) && list.length > 0 ? list : DEFAULT_FALLBACK_PROGRAMS);
        } else if (isMounted) {
          setPrograms(DEFAULT_FALLBACK_PROGRAMS);
        }
      } catch (err) {
        if (isMounted) setPrograms(DEFAULT_FALLBACK_PROGRAMS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPrograms();
    return () => {
      isMounted = false;
    };
  }, [search, selectedMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif">
            Available Tuition & Coaching Programs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore dedicated tuition batches, intermediate subjects, degree coaching, and enroll online.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search programs, subjects, standards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ONLINE', 'OFFLINE', 'BOTH', 'HYBRID'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedMode === m
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'ALL' ? 'All Modes' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Program Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0B2545] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading tuition programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No tuition programs found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or mode filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((prog) => {
            const seatsRemaining = prog.availableSeats ?? prog.totalSeats;
            return (
              <div
                key={prog._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#1769D2]">
                      {prog.division || 'TUITIONS'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {prog.mode || 'ONLINE & OFFLINE'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                    {prog.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prog.shortDescription || prog.description || 'Comprehensive interactive tutoring and regular tests with expert faculty.'}
                  </p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prog.duration || 'Full Academic Term'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {seatsRemaining !== undefined ? `${seatsRemaining} Seats Left` : 'Seats Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Price and Apply CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Program Fee</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-[#0B2545]">
                        ₹{(prog.price ?? prog.fee) ? (prog.price ?? prog.fee).toLocaleString('en-IN') : 'Free'}
                      </span>
                      {prog.originalPrice && prog.originalPrice > (prog.price ?? prog.fee ?? 0) && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prog.originalPrice?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/tuition-programs/${prog.slug}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/tuition-programs/${prog.slug}/enroll`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#1E293B] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                    >
                      Enroll <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableProgramsPage;
