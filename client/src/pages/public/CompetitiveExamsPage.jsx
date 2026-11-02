import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { courseService } from '../../services';
import { CourseCard } from '../../components/course/CourseCard';
import { PageBanner } from '../../components/common/PageBanner';
import {
  Building2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Search,
  X,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CompetitiveExamsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params
  const catParam = searchParams.get('cat') || searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(catParam);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams.get('cat') || searchParams.get('category');
    if (cat) setSelectedCat(cat);

    const s = searchParams.get('search') || searchParams.get('q');
    if (s !== null && s !== undefined) setSearchQuery(s);
  }, [searchParams]);

  // Fetch competitive exam courses dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, catRes] = await Promise.all([
          courseService.getCourses({ division: 'COMPETITIVE_EXAMS', limit: 100 }),
          courseService.getCategories({ division: 'COMPETITIVE_EXAMS' }),
        ]);

        if (isMounted) {
          if (courseRes?.success) setCourses(courseRes.data.courses || []);
          if (catRes?.success) setCategories(catRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load competitive exam courses', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const examCategories = [
    { slug: 'IBPS', label: 'IBPS PO/Clerk' },
    { slug: 'SBI', label: 'SBI PO/Clerk' },
    { slug: 'RBI', label: 'RBI Assistant/Grade B' },
    { slug: 'SSC', label: 'SSC CGL/CHSL' },
    { slug: 'RAILWAYS', label: 'Railways RRB' },
    { slug: 'LIC', label: 'LIC & Insurance' },
    { slug: 'POLICE', label: 'Police & SI' },
    { slug: 'DEFENCE', label: 'Defence & Armed Forces' },
    { slug: 'TEACHING', label: 'Teaching & TET' },
    { slug: 'STATE GOVT', label: 'State Govt PSC' },
  ];

  // Combined Multi-Filter & Search Logic
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // 1. Mode Filter
      if (selectedMode !== 'ALL') {
        if (c.mode !== selectedMode && c.mode !== 'BOTH') {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCat !== 'ALL') {
        const sel = selectedCat.toUpperCase();
        const catSlug = c.categoryId?.slug?.toUpperCase() || '';
        const catName = c.categoryId?.name?.toUpperCase() || '';
        const title = c.title?.toUpperCase() || '';
        const shortDesc = c.shortDescription?.toUpperCase() || '';
        const tags = Array.isArray(c.tags) ? c.tags.map((t) => t.toUpperCase()) : [];

        let matchesCat =
          catSlug === sel ||
          c.categoryId?._id === selectedCat ||
          title.includes(sel) ||
          catName.includes(sel) ||
          shortDesc.includes(sel) ||
          tags.some((t) => t.includes(sel));

        // Alias matching
        if (!matchesCat) {
          if (['IBPS', 'SBI', 'RBI', 'BANKING'].includes(sel)) {
            matchesCat =
              catSlug.includes('BANKING') ||
              title.includes('BANK') ||
              title.includes('IBPS') ||
              title.includes('SBI');
          } else if (['SSC', 'GOVERNMENT', 'CGL', 'CHSL'].includes(sel)) {
            matchesCat =
              catSlug.includes('SSC') ||
              catSlug.includes('GOV') ||
              title.includes('SSC');
          } else if (['RAILWAYS', 'RRB'].includes(sel)) {
            matchesCat =
              catSlug.includes('RAIL') ||
              title.includes('RAILWAY') ||
              title.includes('RRB');
          } else if (['LIC', 'INSURANCE'].includes(sel)) {
            matchesCat =
              catSlug.includes('INSUR') ||
              title.includes('LIC') ||
              title.includes('INSURANCE');
          } else if (['POLICE', 'DEFENCE'].includes(sel)) {
            matchesCat =
              catSlug.includes('POLICE') ||
              catSlug.includes('DEFEN') ||
              title.includes('POLICE') ||
              title.includes('DEFENCE');
          } else if (['TEACHING', 'STATE GOVT', 'STATE'].includes(sel)) {
            matchesCat =
              catSlug.includes('TEACH') ||
              catSlug.includes('STATE') ||
              title.includes('TEACHING');
          }
        }

        if (!matchesCat) return false;
      }

      // 3. Keyword Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const title = (c.title || '').toLowerCase();
        const shortDesc = (c.shortDescription || '').toLowerCase();
        const catName = (c.categoryId?.name || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.join(' ').toLowerCase() : '';

        const matchesKeyword =
          title.includes(query) ||
          shortDesc.includes(query) ||
          catName.includes(query) ||
          tags.includes(query);

        if (!matchesKeyword) return false;
      }

      return true;
    });
  }, [courses, selectedCat, selectedMode, searchQuery]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCat, selectedMode]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCourses.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, currentPage, pageSize]);

  // Handlers
  const handleFilterClick = (slug) => {
    setSelectedCat(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'ALL') {
      newParams.delete('cat');
      newParams.delete('category');
    } else {
      newParams.set('cat', slug);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val.trim());
    } else {
      newParams.delete('search');
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    newParams.delete('q');
    setSearchParams(newParams);
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCat('ALL');
    setSelectedMode('ALL');
    setSearchParams({});
  };

  return (
    <div className="bg-[#F7F9FC] pb-20">
      <PageBanner
        title="All Competitive Examinations Coaching"
        subtitle="Build your career with confidence. Intensive preparation for Banking (IBPS, SBI, RBI), SSC (CGL, CHSL, MTS), Railways (RRB), Insurance (LIC), Police, Defence, and State Government recruitment examinations."
        breadcrumbs={[{ label: 'Competitive Exams' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          {/* Top Row: Search Input + Mode Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input Field */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search competitive exams, recruitment batches, or syllabus..."
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2] focus:border-[#1769D2] text-slate-800 placeholder-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mode & Reset Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 text-xs shadow-2xs outline-none focus:border-[#1769D2]"
                aria-label="Filter by Learning Mode"
              >
                <option value="ALL">All Modes</option>
                <option value="ONLINE">Live Online</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="SELF_PACED">Recorded / Self-Paced</option>
              </select>

              {(searchQuery || selectedCat !== 'ALL' || selectedMode !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear all filters and search"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1769D2]" />
              <span className="text-xs font-black text-[#12356B] uppercase tracking-wider">
                Filter by Exam Category:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleFilterClick('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedCat === 'ALL'
                    ? 'bg-[#12356B] text-white shadow-md scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Recruitment Exams ({courses.length})
              </button>

              {examCategories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleFilterClick(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedCat.toUpperCase() === cat.slug.toUpperCase()
                      ? 'bg-[#1769D2] text-white shadow-md scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#0B1E3D] font-heading">
              Available Competitive Exam Batches
            </h2>
            <p className="text-xs text-slate-500">
              Showing <strong className="text-[#12356B]">{filteredCourses.length}</strong> course(s)
              {searchQuery ? ` matching "${searchQuery}"` : ''}
              {selectedCat !== 'ALL' ? ` in ${selectedCat}` : ''}
            </p>
          </div>

          {totalPages > 1 && (
            <div className="text-xs font-bold text-slate-500">
              Page <span className="text-[#12356B]">{currentPage}</span> of {totalPages}
            </div>
          )}
        </div>

        {/* Courses Grid or Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                      currentPage === p
                        ? 'bg-[#12356B] text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State when no results found */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                No Results Found
              </span>
              <h3 className="text-xl font-black text-[#0B1E3D] font-heading mt-2">
                No Batches Match Your Criteria
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
                {searchQuery
                  ? `No competitive exam courses found matching "${searchQuery}". Please check your spelling or clear active filters.`
                  : `Admissions for our dedicated ${selectedCat} interactive live Zoom batch and full test series are now open. Reserve your seat or speak with our academic counselors.`}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 bg-[#1769D2] hover:bg-[#12356B] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters & View All
              </button>
              <Link
                to={`/enquiry?course=${encodeURIComponent(searchQuery || selectedCat)}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
              >
                Request Custom Batch Consultation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitiveExamsPage;
