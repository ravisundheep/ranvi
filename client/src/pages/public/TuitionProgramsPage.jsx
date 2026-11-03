import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '../../components/common/PageBanner';
import { tuitionService } from '../../services';
import {
  Search,
  X,
  Filter,
  GraduationCap,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  MapPin,
  AlertCircle,
  Tag,
} from 'lucide-react';

const LEARNING_MODES = [
  { id: 'ALL', label: 'All Modes' },
  { id: 'ONLINE', label: 'Online Live Batches' },
  { id: 'OFFLINE', label: 'Classroom / In-Person' },
  { id: 'HYBRID', label: 'Hybrid (Online + Classroom)' },
];

export const TuitionProgramsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 12,
        division: 'TUITIONS',
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeMode !== 'ALL') params.mode = activeMode;

      const res = await tuitionService.getTuitionPrograms(params);
      if (res && res.success) {
        const list = Array.isArray(res.data?.courses)
          ? res.data.courses
          : Array.isArray(res.data)
          ? res.data
          : [];
        setPrograms(list);
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Failed to load tuition programs:', err);
      setError('Unable to load coaching programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [page, activeMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPrograms();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    setTimeout(fetchPrograms, 50);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageBanner
        title="Tuition & Academic Coaching Programs"
        subtitle="Expert coaching for School Tuitions (Class 6-10), Intermediate (MPC, BiPC, MEC, CEC), and STEM Foundation Batches."
        breadcrumbs={[{ label: 'Tuitions & Coaching' }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coaching programs by subject, board, class, or keyword..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#1769D2] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-20 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 bg-[#0B2545] hover:bg-[#12356B] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Learning Mode Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {LEARNING_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMode(m.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === m.id
                    ? 'bg-[#1769D2] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="w-full h-44 bg-slate-200 rounded-2xl" />
                <div className="w-2/3 h-5 bg-slate-200 rounded-md" />
                <div className="w-full h-4 bg-slate-200 rounded-md" />
                <div className="w-1/2 h-4 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchPrograms}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Coaching Programs Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We couldn't find any tuition or coaching programs matching your query. Clear filters or explore other available divisions.
            </p>
            <button
              onClick={() => {
                setActiveMode('ALL');
                setSearchQuery('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1769D2] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((program) => {
              const discountPercent =
                program.originalPrice && program.originalPrice > program.fee
                  ? Math.round(((program.originalPrice - program.fee) / program.originalPrice) * 100)
                  : null;

              const isSeatsLow =
                typeof program.availableSeats === 'number' && program.availableSeats > 0 && program.availableSeats <= 15;

              return (
                <div
                  key={program._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={program.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop'}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Mode & Subject Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className="bg-[#0B1E3D]/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                        {program.mode === 'BOTH' ? 'Online + Offline' : program.mode}
                      </span>
                      {program.subject && (
                        <span className="bg-[#1769D2]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[140px]">
                          {program.subject}
                        </span>
                      )}
                    </div>

                    {/* Seats Availability Alert */}
                    {program.isEnrollmentOpen === false ? (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Enrollment Closed
                      </span>
                    ) : isSeatsLow ? (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                        Only {program.availableSeats} Seats Left
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Admissions Open
                      </span>
                    )}

                    {/* Bottom Info on Thumbnail */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                      <div className="flex items-center gap-1 font-semibold text-slate-200 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#F4B942]" />
                        <span>{program.duration || 'Full Academic Year'}</span>
                      </div>
                      {typeof program.availableSeats === 'number' && (
                        <div className="flex items-center gap-1 font-semibold text-slate-200 text-[11px]">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{program.availableSeats} Seats Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-[#0B2545] font-serif leading-snug group-hover:text-[#1769D2] transition-colors line-clamp-2">
                        {program.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {program.shortDescription || program.fullDescription}
                      </p>

                      {program.batchSchedule && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{program.batchSchedule}</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg sm:text-xl font-black text-[#0B2545]">
                            ₹{program.fee.toLocaleString('en-IN')}
                          </span>
                          {program.originalPrice && program.originalPrice > program.fee && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{program.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discountPercent && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            Save {discountPercent}% Special Scholarship
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/tuition-programs/${program.slug}`}
                          className="text-xs font-bold text-slate-700 hover:text-[#0B2545] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          to={`/tuition-programs/${program.slug}/enroll`}
                          className="bg-[#009E60] hover:bg-[#007044] text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <span>Enroll</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TuitionProgramsPage;
