import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { courseService } from '../../services';
import { CourseCard } from '../../components/course/CourseCard';
import { PageBanner } from '../../components/common/PageBanner';
import {
  Landmark,
  Award,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
  X,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const BankersPathPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Params parsing
  const initialCategory = searchParams.get('category') || searchParams.get('cat') || 'ALL';
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialDivision = searchParams.get('division') || (initialSearch ? 'ALL' : 'BANKERS_PATH');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedDivision, setSelectedDivision] = useState(initialDivision);
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('cat');
    if (cat) setSelectedCat(cat);

    const s = searchParams.get('search') || searchParams.get('q');
    if (s !== null && s !== undefined) setSearchQuery(s);

    const div = searchParams.get('division');
    if (div) setSelectedDivision(div);
  }, [searchParams]);

  // Fetch courses dynamically from database
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = { limit: 100 };
        // If division is set and not ALL, pass to backend
        if (selectedDivision !== 'ALL') {
          params.division = selectedDivision;
        }
        const res = await courseService.getCourses(params);
        if (isMounted && res?.success) {
          const list = Array.isArray(res.data?.courses)
            ? res.data.courses
            : Array.isArray(res.data)
            ? res.data
            : [];
          setCourses(list);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedDivision]);

  // Certifications List (Banker's Path primary programs)
  const certificationsList = [
    { name: 'JAIIB', color: 'bg-blue-600', desc: 'Junior Associate of Indian Institute of Bankers — 4 subjects: IE&IFS, PPB, AFM, RBWM' },
    { name: 'CAIIB', color: 'bg-red-600', desc: 'Certified Associate of Indian Institute of Bankers — 4 core + 1 elective subject for scale promotions' },
    { name: 'DBF', color: 'bg-emerald-600', desc: 'Diploma in Banking & Finance — flagship entry credential for aspirants seeking bank clerk/PO jobs' },
    { name: 'DTM', color: 'bg-amber-600', desc: 'Diploma in Treasury, Investment & Risk Management — dealing room, money market & forex specialization' },
    { name: 'AMFI', color: 'bg-purple-600', desc: 'Association of Mutual Funds in India — mandatory ARN registration for wealth management' },
    { name: 'NISM (SEBI)', color: 'bg-blue-700', desc: 'National Institute of Securities Markets — equity derivatives, currency, and investment advisory' },
    { name: 'IRDAI', color: 'bg-pink-600', desc: 'Insurance Regulatory and Development Authority — life and general insurance agency & POSP' },
    { name: 'DRA', color: 'bg-teal-600', desc: 'Debt Recovery Agent IIBF certification for authorized debt collection & recovery officers' },
  ];

  // Division Filter Options
  const divisions = [
    { id: 'BANKERS_PATH', label: "Banker's Path" },
    { id: 'ALL', label: 'All Programs' },
    { id: 'COMPETITIVE_EXAMS', label: 'Competitive Exams' },
    { id: 'ENTRANCE_EXAMS', label: 'Entrance Exams' },
    { id: 'TUITIONS', label: 'Tuitions' },
  ];

  // Combined Multi-Filter and Search Logic
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // 1. Division Filter
      if (selectedDivision !== 'ALL' && c.division !== selectedDivision) {
        return false;
      }

      // 2. Mode Filter (ONLINE, CLASSROOM, BOTH)
      if (selectedMode !== 'ALL') {
        if (c.mode !== selectedMode && c.mode !== 'BOTH') {
          return false;
        }
      }

      // 3. Category / Certification Filter
      if (selectedCat !== 'ALL') {
        const sel = selectedCat.toUpperCase();
        const catSlug = c.categoryId?.slug?.toUpperCase() || '';
        const catName = c.categoryId?.name?.toUpperCase() || '';
        const title = c.title?.toUpperCase() || '';
        const tags = Array.isArray(c.tags) ? c.tags.map((t) => t.toUpperCase()) : [];

        const matchesCat =
          catSlug === sel ||
          c.categoryId?._id === selectedCat ||
          title.includes(sel) ||
          catName.includes(sel) ||
          tags.some((t) => t.includes(sel)) ||
          (sel.includes('NISM') && (catSlug.includes('NISM') || title.includes('NISM'))) ||
          (sel.includes('SEBI') && (catSlug.includes('NISM') || title.includes('SEBI')));

        if (!matchesCat) return false;
      }

      // 4. Keyword Search Filter (Case-insensitive & Partial Match)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const title = (c.title || '').toLowerCase();
        const shortDesc = (c.shortDescription || '').toLowerCase();
        const division = (c.division || '').toLowerCase();
        const catName = (c.categoryId?.name || '').toLowerCase();
        const shortName = (c.tileShortName || '').toLowerCase();
        const subtitle = (c.tileSubtitle || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.join(' ').toLowerCase() : '';

        const matchesKeyword =
          title.includes(query) ||
          shortDesc.includes(query) ||
          division.includes(query) ||
          catName.includes(query) ||
          shortName.includes(query) ||
          subtitle.includes(query) ||
          tags.includes(query);

        if (!matchesKeyword) return false;
      }

      return true;
    });
  }, [courses, selectedDivision, selectedMode, selectedCat, searchQuery]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCat, selectedDivision, selectedMode]);

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
      newParams.delete('category');
      newParams.delete('cat');
    } else {
      newParams.set('category', slug);
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
    setSelectedDivision('BANKERS_PATH');
    setSelectedMode('ALL');
    setSearchParams({});
  };

  const activeCertInfo = certificationsList.find(
    (c) =>
      c.name.toUpperCase() === selectedCat.toUpperCase() ||
      (selectedCat.toUpperCase().includes('NISM') && c.name.includes('NISM'))
  );

  return (
    <div className="bg-[#F7F9FC] pb-20">
      <PageBanner
        title="Courses & Professional Certifications"
        subtitle="Specialized preparation for in-service bankers, financial aspirants, and career seekers. Explore IIBF certifications, government exams, entrance coaching, and academic tutoring."
        breadcrumbs={[{ label: "Banker's Path & Courses" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* ========================================================
            1. SEARCH & PRIMARY FILTER TOOLBAR
        ======================================================== */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          {/* Top Row: Search Input + Division Filter Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input Field */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by course title, exam, syllabus, or keywords..."
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

            {/* Division Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {divisions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDivision(d.id);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('division', d.id);
                    setSearchParams(newParams);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDivision === d.id
                      ? 'bg-[#0B1E3D] text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Filter Controls: Certification Chips & Mode Dropdown */}
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Certification Program Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-black text-slate-500 uppercase tracking-wider text-[11px] mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" /> Program:
              </span>
              <button
                type="button"
                onClick={() => handleFilterClick('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCat === 'ALL'
                    ? 'bg-[#12356B] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {certificationsList.map((cert) => (
                <button
                  key={cert.name}
                  type="button"
                  onClick={() => handleFilterClick(cert.name)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCat.toUpperCase() === cert.name.toUpperCase() ||
                    (selectedCat.toUpperCase().includes('NISM') && cert.name.includes('NISM'))
                      ? 'bg-[#1769D2] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cert.name}
                </button>
              ))}
            </div>

            {/* Mode & Reset Filter Controls */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 text-xs shadow-2xs outline-none focus:border-[#1769D2]"
                aria-label="Filter by Learning Mode"
              >
                <option value="ALL">All Modes</option>
                <option value="ONLINE">Live Zoom Online</option>
                <option value="CLASSROOM">Physical Classroom</option>
                <option value="SELF_PACED">Recorded / Self-Paced</option>
              </select>

              {(searchQuery || selectedCat !== 'ALL' || selectedDivision !== 'BANKERS_PATH' || selectedMode !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear all filters and search query"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            2. RESULTS HEADER & PRICING ANCHOR
        ======================================================== */}
        <div id="pricing" className="scroll-mt-24 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#0B1E3D] font-heading">
              Available Courses & Batches
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

        {/* ========================================================
            3. COURSES GRID OR EMPTY STATE
        ======================================================== */}
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
          /* Empty State when Search or Filters yield 0 matches */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1769D2] flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#EAF3FF] text-[#12356B] px-3 py-1 rounded-full">
                No Results Found
              </span>
              <h3 className="text-xl font-black text-[#0B1E3D] font-heading mt-2">
                No Courses Match Your Criteria
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
                {searchQuery
                  ? `We could not find any active courses matching "${searchQuery}". Try adjusting your keywords or clearing the filter.`
                  : activeCertInfo?.desc ||
                    `No active courses found for ${selectedCat}. Contact our academic counselors for upcoming batch announcements and syllabus outlines.`}
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

export default BankersPathPage;
