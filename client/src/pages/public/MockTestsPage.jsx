import React, { useState, useEffect, useMemo } from 'react';
import { examService } from '../../services';
import { ExamCard } from '../../components/exams/ExamCard';
import { PageBanner } from '../../components/common/PageBanner';
import {
  FileCheck2,
  Filter,
  Award,
  ShieldCheck,
  Sparkles,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';

export const MockTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [freeOnly, setFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await examService.getMockTests({ limit: 50 });
        if (isMounted && res?.success && res.data) {
          setTests(res.data.tests || []);
        }
      } catch (err) {
        console.error('Failed to load mock tests', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchExams();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // 1. Division filter
      if (divisionFilter !== 'ALL' && test.division !== divisionFilter) return false;

      // 2. Demo Free filter
      if (freeOnly && !test.isDemoFree) return false;

      // 3. Keyword Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const title = (test.title || '').toLowerCase();
        const division = (test.division || '').toLowerCase();
        const courseTitle = (test.courseId?.title || '').toLowerCase();

        const matchesKeyword =
          title.includes(query) ||
          division.includes(query) ||
          courseTitle.includes(query);

        if (!matchesKeyword) return false;
      }

      return true;
    });
  }, [tests, divisionFilter, freeOnly, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDivisionFilter('ALL');
    setFreeOnly(false);
  };

  return (
    <div className="space-y-12 pb-20">
      <PageBanner
        title="Online Mock Tests & 10–20 Model Papers"
        subtitle="Simulate the actual examination environment with full-length model test papers. Includes sectional time management, instant answer key analysis, and negative marking calculations."
        breadcrumbs={[{ label: 'Mock Tests' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search & Filters Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input Field */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search mock tests, paper numbers, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Free Demo Checkbox & Reset */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <label className="flex items-center gap-2 text-xs font-bold text-[#12356B] cursor-pointer bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Free Demo Only</span>
              </label>

              {(searchQuery || divisionFilter !== 'ALL' || freeOnly) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear search and filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-500 uppercase mr-1 text-[11px] shrink-0">Category:</span>
            {[
              { label: 'All Model Papers', val: 'ALL' },
              { label: "Banker's Path (JAIIB / CAIIB)", val: 'BANKERS_PATH' },
              { label: 'Competitive Exams (IBPS / SBI / SSC)', val: 'COMPETITIVE_EXAMS' },
              { label: 'Entrance Exams', val: 'ENTRANCE_EXAMS' },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                onClick={() => setDivisionFilter(f.val)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  divisionFilter === f.val
                    ? 'bg-[#12356B] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-500">
              Showing <strong className="text-[#0B1E3D]">{filteredTests.length}</strong> model paper(s)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => (
                <ExamCard key={test._id} test={test} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto space-y-3">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#12356B]">No Model Papers Found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No tests match "${searchQuery}". Try searching another keyword or reset the filters.`
                : 'No tests found in this category. Try switching filters to view other available model papers.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769D2] text-white text-xs font-bold shadow-xs hover:bg-[#12356B] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestsPage;
