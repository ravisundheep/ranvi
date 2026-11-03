import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService, latestUpdateService } from '../../services';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { HeroBannerSlider } from '../../components/home/HeroBannerSlider';
import {
  BookOpen,
  Users,
  Shield,
  Star,
  MonitorPlay,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  GraduationCap,
  FileText,
  ClipboardList,
  Mail,
  Search,
  Bell,
  MapPin,
  MessageSquare,
  Sparkles,
  Compass,
  Play,
  CheckCircle2,
  X,
} from 'lucide-react';

// ========================================================
// 2. TILE HELPER FUNCTIONS (FAST CACHED TITLES & SUBTITLES)
// ========================================================
const shortNameCache = new Map();
const getTileShortName = (course) => {
  if (!course) return 'PROGRAM';
  const id = course._id || course.slug || course.title || course.name;
  if (id && shortNameCache.has(id)) return shortNameCache.get(id);

  let result = 'PROGRAM';
  if (course?.tileShortName) result = course.tileShortName;
  else if (course?.name && !course?.title) result = course.name;
  else {
    const t = course?.title || course?.name || '';
    if (!t) result = 'PROGRAM';
    else if (/^JAIIB/i.test(t)) result = 'JAIIB';
    else if (/^CAIIB/i.test(t)) result = 'CAIIB';
    else if (/\bDBF\b/i.test(t)) result = 'DBF';
    else if (/\bDTM\b/i.test(t)) result = 'DTM';
    else if (/\bAMFI\b/i.test(t)) result = 'AMFI';
    else if (/\bNISM\b/i.test(t)) result = 'NISM (SEBI)';
    else if (/\bIRDAI\b/i.test(t)) result = 'IRDAI';
    else if (/\bDRA\b/i.test(t)) result = 'DRA';
    else if (/^IBPS/i.test(t)) result = 'IBPS';
    else if (/^SBI/i.test(t)) result = 'SBI';
    else if (/^RBI/i.test(t)) result = 'RBI';
    else if (/^SSC/i.test(t)) result = 'SSC';
    else if (/\bRailways\b|\bRRB\b/i.test(t)) result = 'RAILWAYS';
    else if (/Police/i.test(t)) result = 'POLICE & DEFENCE';
    else if (/LIC/i.test(t)) result = 'LIC / INSURANCE';
    else if (/Teaching/i.test(t)) result = 'TEACHING';
    else if (/^JEE/i.test(t)) result = 'JEE';
    else if (/^NEET/i.test(t)) result = 'NEET-UG';
    else if (/^CUET/i.test(t)) result = 'CUET';
    else if (/AP EAPCET/i.test(t)) result = 'AP EAPCET';
    else if (/TG EAPCET/i.test(t)) result = 'TG EAPCET';
    else if (/CLAT/i.test(t)) result = 'CLAT';
    else if (/NDA/i.test(t)) result = 'NDA';
    else if (/POLYCET/i.test(t)) result = 'POLYCET';
    else if (/APRJC/i.test(t)) result = 'APRJC CET';
    else if (/TGCET/i.test(t)) result = 'TGCET';
    else {
      const parts = t.split(' ');
      result = parts.length > 1 && parts[0].length <= 4 ? `${parts[0]} ${parts[1]}` : parts[0];
    }
  }

  if (id) shortNameCache.set(id, result);
  return result;
};

const subtitleCache = new Map();
const getTileSubtitle = (course, fallbackSubtitle = '') => {
  const id = course?._id || course?.slug || course?.title;
  if (id && subtitleCache.has(id)) return subtitleCache.get(id);

  const t = (course?.title || course?.name || '').toLowerCase();
  const slug = (course?.slug || '').toLowerCase();
  const rawSub = course?.tileSubtitle || course?.subtitle || '';

  let result = '';
  if (slug.includes('jaiib') || t.includes('jaiib')) result = 'Junior Associate of IIBF';
  else if (slug.includes('caiib') || t.includes('caiib')) result = 'Certified Associate of IIBF';
  else if (slug.includes('dbf') || t.includes('diploma in banking')) result = 'Diploma in Banking & Finance';
  else if (slug.includes('dtm') || t.includes('treasury')) result = 'Treasury & Risk Management';
  else if (slug.includes('amfi') || t.includes('mutual fund')) result = 'Mutual Fund Certification';
  else if (slug.includes('nism') || t.includes('sebi')) result = 'Securities Market Certification';
  else if (slug.includes('irdai') || t.includes('insurance regulatory')) result = 'Insurance Agent & Broker';
  else if (slug.includes('dra') || t.includes('debt recovery')) result = 'Debt Recovery Agent';
  else if (slug.includes('ibps') || t.startsWith('ibps')) result = 'PO / Clerk / SO / RRB';
  else if (slug.includes('sbi') || t.startsWith('sbi')) result = 'PO / Clerk / Specialist';
  else if (slug.includes('rbi') || t.startsWith('rbi')) result = 'Grade B / Assistant';
  else if (slug.includes('ssc') || t.startsWith('ssc')) result = 'CGL / CHSL / MTS';
  else if (slug.includes('railway') || slug.includes('rrb') || t.includes('railway')) result = 'RRB NTPC / Group D';
  else if (slug.includes('police') || t.includes('police')) result = 'SI / Constable / Defence';
  else if (slug.includes('lic') || t.includes('lic')) result = 'AAO / ADO / Assistant';
  else if (slug.includes('teaching') || t.includes('teaching') || t.includes('ctet') || t.includes('dsc')) result = 'TET / CTET / DSC';
  else if (slug.includes('jee') || t.startsWith('jee')) result = 'Main / Advanced';
  else if (slug.includes('neet') || t.startsWith('neet')) result = 'Medical Entrance';
  else if (slug.includes('cuet') || t.startsWith('cuet')) result = 'Central Universities';
  else if (slug.includes('ap-eapcet') || t.includes('ap eapcet')) result = 'Engineering / Agriculture';
  else if (slug.includes('tg-eapcet') || t.includes('tg eapcet')) result = 'Engineering / Agriculture';
  else if (slug.includes('clat') || t.startsWith('clat')) result = 'Law Entrance';
  else if (slug.includes('nda') || t.startsWith('nda')) result = 'Defence Academy';
  else if (slug.includes('polycet') || t.includes('polycet')) result = 'Polytechnic Diploma';
  else if (slug.includes('aprjc') || t.includes('aprjc')) result = 'Intermediate Courses';
  else if (slug.includes('tgcet') || t.includes('tgcet')) result = 'Gurukul Schools';
  else if (rawSub) {
    result = rawSub
      .replace(/\s*•\s*/g, ' / ')
      .replace(/\s*,\s*/g, ' / ')
      .replace(/Certified Course/gi, '')
      .replace(/Comprehensive Batch/gi, '')
      .replace(/Target Coaching Batch/gi, '')
      .replace(/Prep Series/gi, '')
      .replace(/Certification Batch/gi, '')
      .replace(/Master Batch/gi, '')
      .replace(/Super 60 Batch/gi, '')
      .replace(/Intensive Batch/gi, '')
      .replace(/Foundation Batch/gi, '')
      .replace(/Foundation Course/gi, '')
      .trim();
  } else {
    result = fallbackSubtitle || course?.shortDescription || '';
  }

  if (id) subtitleCache.set(id, result);
  return result;
};

// ========================================================
// 3. REUSABLE PROGRAM CARD (4x2 PASTEL TILES MATCHING REFERENCE)
// ========================================================
const ProgramCard = React.memo(({
  title,
  subtitle,
  courses,
  defaultTiles,
  isExpanded,
  onToggleExpand,
  pageLink,
  pageLinkLabel,
  fallbackColor = '#E0F2FE',
}) => {
  const displayCourses =
    courses && courses.length > 0
      ? isExpanded
        ? courses
        : courses.slice(0, 8)
      : defaultTiles;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
      {/* Card Header with in-place toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0B2545] font-serif">
            {title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>
        {courses.length > 8 ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="bg-[#2A3B5C] hover:bg-[#1E293B] active:scale-95 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                View All ({courses.length}) <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        ) : (
          <Link
            to={pageLink}
            className="bg-[#2A3B5C] hover:bg-[#1E293B] text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      {/* 4 columns x 2 rows Responsive Grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {displayCourses.map((course, idx) => {
          const fallback = defaultTiles[idx % defaultTiles.length] || {};
          const shortName = getTileShortName(course) || fallback.name;
          const courseSubtitle = getTileSubtitle(course, fallback.subtitle);
          const color = course.tileColor || fallback.color || fallbackColor;
          const slug = course.slug || fallback.slug;

          return (
            <Link
              key={course._id || idx}
              to={`/courses/${slug}`}
              className="group min-w-0 px-1 py-1.5 sm:px-2 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl border border-white/10 shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center gap-0.5 sm:gap-1 min-h-[58px] sm:min-h-[66px] md:min-h-[72px] overflow-hidden !text-white"
              style={{ backgroundColor: color, color: '#FFFFFF' }}
              title={course.title || course.name}
            >
              <div
                className="font-black text-[9.5px] sm:text-xs md:text-sm tracking-tight uppercase leading-[1.1] !text-white w-full px-0.5 break-words line-clamp-2 text-center"
                style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {shortName}
              </div>
              <div
                className="text-[7.5px] sm:text-[9px] md:text-[9.5px] !text-white font-medium leading-[1.15] w-full px-0.5 break-words line-clamp-2 text-center"
                style={{ color: '#FFFFFF', opacity: 0.95, textShadow: '0 1px 1px rgba(0,0,0,0.4)' }}
              >
                {courseSubtitle}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom expansion toggle & dedicated full page link */}
      {courses.length > 8 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={onToggleExpand}
            className="font-bold text-[#1769D2] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                View All {courses.length} Courses <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <Link
            to={pageLink}
            className="font-bold text-slate-600 hover:text-[#1769D2] inline-flex items-center gap-0.5 text-[11px]"
          >
            <span>{pageLinkLabel}</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
});

// Cache loader from sessionStorage for instant 0ms paint
const getInitialCachedCourses = (state) => {
  try {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(`ranvi_courses_${state || 'all'}`);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
};

let cachedAvailableStates = [
  'All India',
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Delhi',
  'Uttar Pradesh',
  'Kerala',
];

export const HomePage = () => {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  // ----------------------------------------------------
  // 1. STATE & DATA HOOKS (INSTANT CACHED FIRST PAINT)
  // ----------------------------------------------------
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [courses, setCourses] = useState(() => getInitialCachedCourses('Andhra Pradesh'));
  const [availableStates, setAvailableStates] = useState(cachedAvailableStates);
  const [coursesLoading, setCoursesLoading] = useState(() => getInitialCachedCourses('Andhra Pradesh').length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // Expanded "View All" state per coaching card
  const [expandedSection, setExpandedSection] = useState({
    competitive: false,
    entrance: false,
    bankers: false,
    tuitions: false,
  });

  // Fetch dynamic latest updates
  useEffect(() => {
    let isMounted = true;
    const fetchUpdates = async () => {
      try {
        const res = await latestUpdateService.getPublishedUpdates({ limit: 15 });
        if (isMounted && res?.success && Array.isArray(res.data?.updates)) {
          setLatestUpdates(res.data.updates);
        }
      } catch (err) {
        // Soft fallback
      }
    };
    fetchUpdates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch available states once with caching
  useEffect(() => {
    let isMounted = true;
    const fetchStates = async () => {
      try {
        const res = await courseService.getAvailableStates();
        if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
          cachedAvailableStates = res.data;
          setAvailableStates(res.data);
        }
      } catch (err) {}
    };
    fetchStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch courses with SWR caching
  useEffect(() => {
    let isMounted = true;
    const cached = getInitialCachedCourses(selectedState);
    if (cached.length > 0) {
      setCourses(cached);
      setCoursesLoading(false);
    } else {
      setCoursesLoading(true);
    }

    const fetchCourses = async () => {
      try {
        const params = { limit: 100 };
        if (selectedState && selectedState !== 'ALL' && selectedState !== 'All India') {
          params.state = selectedState;
        }
        const res = await courseService.getCourses(params);
        if (isMounted && res?.success) {
          let list = Array.isArray(res.data?.courses)
            ? res.data.courses
            : Array.isArray(res.data)
            ? res.data
            : [];

          if (selectedState && selectedState !== 'ALL' && selectedState !== 'All India') {
            const stateMatches = list.filter((c) => {
              if (!c.states || c.states.length === 0) return true;
              return (
                c.states.some((s) => s.toLowerCase() === selectedState.toLowerCase()) ||
                c.states.some((s) => s.toLowerCase() === 'all india')
              );
            });
            list = stateMatches;
          }

          setCourses(list);
          try {
            sessionStorage.setItem(`ranvi_courses_${selectedState || 'all'}`, JSON.stringify(list));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        if (isMounted) setCoursesLoading(false);
      }
    };

    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/bankers-path?search=${encodeURIComponent(searchQuery.trim())}&division=ALL`);
  };

  // ----------------------------------------------------
  // 2. MEMOIZED COURSE CATEGORIZATION & UTILITIES
  // ----------------------------------------------------
  const competitiveCourses = useMemo(
    () => courses.filter((c) => c.division === 'COMPETITIVE_EXAMS'),
    [courses]
  );
  const entranceCourses = useMemo(
    () => courses.filter((c) => c.division === 'ENTRANCE_EXAMS'),
    [courses]
  );
  const bankersCourses = useMemo(
    () => courses.filter((c) => c.division === 'BANKERS_PATH'),
    [courses]
  );
  const tuitionsCourses = useMemo(
    () => courses.filter((c) => c.division === 'TUITIONS'),
    [courses]
  );

  // Fallback 8 rich tiles matching database theme
  const defaultCompetitiveTiles = [
    { name: 'IBPS', subtitle: 'PO / Clerk / SO / RRB', color: '#007B88', slug: 'ibps-po-clerk-so-rrb' },
    { name: 'SBI', subtitle: 'PO / Clerk / SO', color: '#7A1D5A', slug: 'sbi-po-clerk-target-batch' },
    { name: 'RBI', subtitle: 'Grade B / Assistant', color: '#48631E', slug: 'rbi-grade-b-assistant' },
    { name: 'SSC', subtitle: 'CGL / CHSL / MTS', color: '#B94715', slug: 'ssc-cgl-chsl-cpo-mts' },
    { name: 'RAILWAYS', subtitle: 'RRB NTPC / Group D', color: '#2D5482', slug: 'railways-rrb-ntpc-group-d' },
    { name: 'POLICE & DEFENCE', subtitle: 'SI / Constable / Defence', color: '#96372B', slug: 'police-si-constable-defence-batch' },
    { name: 'LIC / INSURANCE', subtitle: 'AAO / ADO / Assistant', color: '#22636B', slug: 'lic-aao-ado-insurance-recruitment' },
    { name: 'TEACHING', subtitle: 'TET / CTET / DSC', color: '#512D6D', slug: 'teaching-ctet-dsc-state-tet' },
  ];

  const defaultEntranceTiles = [
    { name: 'JEE', subtitle: 'Main / Advanced', color: '#007B88', slug: 'jee-main-advanced-engineering' },
    { name: 'NEET-UG', subtitle: 'Medical Entrance', color: '#7A1D5A', slug: 'neet-ug-medical-entrance' },
    { name: 'CUET', subtitle: 'UG / PG', color: '#48631E', slug: 'cuet-ug-central-universities' },
    { name: 'AP EAPCET', subtitle: 'Engineering / Agriculture', color: '#B94715', slug: 'ap-eapcet-engineering-agriculture' },
    { name: 'TG EAPCET', subtitle: 'Engineering / Agriculture', color: '#2D5482', slug: 'tg-eapcet-engineering-agriculture' },
    { name: 'CLAT', subtitle: 'Law Entrance', color: '#96372B', slug: 'clat-common-law-admission-test' },
    { name: 'NDA', subtitle: 'Defence Academy', color: '#22636B', slug: 'nda-national-defence-academy' },
    { name: 'POLYCET', subtitle: 'Polytechnic Diploma', color: '#512D6D', slug: 'polycet-diploma-entrance-exam' },
  ];

  const defaultBankersTiles = [
    { name: 'JAIIB', subtitle: 'Junior Associate of IIBF', color: '#007B88', slug: 'jaiib-master-class-2026' },
    { name: 'CAIIB', subtitle: 'Certified Associate of IIBF', color: '#7A1D5A', slug: 'caiib-advanced-comprehensive-batch' },
    { name: 'DBF', subtitle: 'Diploma in Banking & Finance', color: '#48631E', slug: 'dbf-diploma-banking-finance' },
    { name: 'DTM', subtitle: 'Treasury & Risk Management', color: '#B94715', slug: 'dtm-treasury-management' },
    { name: 'AMFI', subtitle: 'Mutual Fund Certification', color: '#2D5482', slug: 'amfi-mutual-funds-certification' },
    { name: 'NISM (SEBI)', subtitle: 'Securities Market Certification', color: '#96372B', slug: 'nism-sebi-certification' },
    { name: 'IRDAI', subtitle: 'Insurance Regulatory', color: '#22636B', slug: 'irdai-insurance-certification' },
    { name: 'DRA', subtitle: 'Debt Recovery Agent', color: '#512D6D', slug: 'dra-debt-recovery-agent' },
  ];

  const defaultTuitionsTiles = [
    { name: 'School Tuitions', subtitle: 'Class 6 - 10 All Boards', color: '#2D5482', slug: 'school-tuitions-class-6-10' },
    { name: 'Intermediate', subtitle: 'MPC • BiPC • MEC • CEC', color: '#7A1D5A', slug: 'intermediate-tuitions' },
    { name: 'Subject-wise', subtitle: 'Maths • Accounts • English', color: '#007B88', slug: 'subject-wise-tuitions' },
    { name: 'Foundation', subtitle: 'IIT-JEE & NEET Foundation', color: '#48631E', slug: 'foundation-course-class-6-10' },
    { name: 'Vedic Maths', subtitle: 'Speed Math & Mental Ability', color: '#B94715', slug: 'vedic-maths-mental-ability' },
    { name: 'Spoken English', subtitle: 'Communication & Fluency', color: '#96372B', slug: 'spoken-english-communication' },
    { name: 'Mathematics', subtitle: 'Concept & Problem Solving', color: '#22636B', slug: 'mathematics-special-tuition' },
    { name: 'Science & Physics', subtitle: 'Foundation & Practical', color: '#512D6D', slug: 'science-physics-tuition' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 bg-[#F8FAFC] overflow-x-hidden">
      {/* ========================================================
          1. TOP HERO BANNER SLIDER: INFINITE SCROLL CAROUSEL
      ======================================================== */}
      <HeroBannerSlider autoPlayInterval={3800} />

      {/* ========================================================
          2. STATE SELECTOR & SEARCH BAR + LATEST UPDATES TICKER
      ======================================================== */}
      <section id="search-section" className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6 space-y-2.5">
        {/* Search Row */}
        <div className="flex items-center gap-2">
          {/* State Selector Pill */}
          <div className="relative shrink-0">
            <div className="border border-[#009E60] bg-white text-[#007044] font-bold text-xs sm:text-sm rounded-xl px-3 sm:px-3.5 py-2.5 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50/50 transition-colors cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-[#009E60] shrink-0" />
              <span className="whitespace-nowrap max-w-[90px] sm:max-w-none truncate">
                {selectedState || 'Select State'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#007044] shrink-0" />
            </div>
            {/* Native Overlaid Select for zero-lag mobile/desktop state changes */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Select State"
            >
              <option value="All India">All India</option>
              {availableStates
                .filter((s) => s !== 'All India')
                .map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
            </select>
          </div>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for courses, exams, services..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-28 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs outline-none focus:border-[#009E60] focus:ring-1 focus:ring-[#009E60]"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-[#008A5E] hover:bg-[#007044] text-white font-bold text-xs px-3 sm:px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Ticker / Marquee Banner with Dynamic Updates & View All */}
        <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200/80 rounded-xl px-3 py-1.5 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setUpdatesModalOpen(true)}
            className="bg-[#0B2545] hover:bg-[#1E293B] text-white text-[9.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Click to view all latest updates"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Latest Updates
          </button>
          <div
            onClick={() => setUpdatesModalOpen(true)}
            className="overflow-hidden whitespace-nowrap text-slate-700 font-medium text-[11px] sm:text-xs flex-1 cursor-pointer"
            title="Click to view all latest updates"
          >
            <span className="inline-block animate-marquee pl-4">
              {latestUpdates.length > 0
                ? latestUpdates.map((u) => `${u.title}${u.badgeText ? ` [${u.badgeText}]` : ''}`).join('  •  ')
                : 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week! • Admissions Open 2026 • Live Zoom Classes with Senior Ex-Bankers • 10–20 Real Pattern Online Mock Tests'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUpdatesModalOpen(true)}
            className="text-[11px] font-bold text-[#1769D2] hover:text-[#0B2545] hover:underline shrink-0 px-1 py-0.5 cursor-pointer whitespace-nowrap"
          >
            View All ({latestUpdates.length || 4})
          </button>
        </div>
      </section>

      {/* ========================================================
          3. TWO PROMINENT ACTION CARDS (NOTIFICATION & GUIDANCE)
      ======================================================== */}
      <section id="quick-actions" className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* Card 1: Notification */}
          <Link
            to="/notifications"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F4B942] text-[#0B1E3D] flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 fill-[#0B1E3D]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-xs sm:text-base leading-tight text-white truncate">
                  Notification
                </h4>
                <p className="text-[9px] sm:text-xs text-blue-100 font-medium truncate">
                  Exam Alerts & Latest Updates
                </p>
              </div>
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </Link>

          {/* Card 2: Guidance */}
          <Link
            to="/enquiry"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-400/30 text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-xs sm:text-base leading-tight text-white truncate">
                  Guidance
                </h4>
                <p className="text-[9px] sm:text-xs text-emerald-100 font-medium truncate">
                  Personal Guidance & Courses
                </p>
              </div>
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================
          4. "OUR COACHING PROGRAMS" (4 DISTINCT CARDS WITH 4x2 TILES)
      ======================================================== */}
      <section id="coaching-programs" className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6 space-y-3.5">
        <div className="space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif tracking-tight">
            Our Coaching Programs
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose your career path and explore courses, entrance preparation, classes and exams.
          </p>
        </div>

        {/* Program 1: Competitive Exams */}
        <ProgramCard
          title={settings?.competitiveExamsSection?.title || settings?.competitiveSection?.title || 'Competitive Exams'}
          subtitle={settings?.competitiveExamsSection?.subtitle || 'Govt. Jobs, Banking & Public Sector Exams'}
          courses={competitiveCourses}
          defaultTiles={defaultCompetitiveTiles}
          isExpanded={expandedSection.competitive}
          onToggleExpand={() =>
            setExpandedSection((prev) => ({ ...prev, competitive: !prev.competitive }))
          }
          pageLink="/competitive-exams"
          pageLinkLabel="Competitive Exams Page"
          fallbackColor="#007B88"
        />

        {/* Program 2: Entrance Exams */}
        <ProgramCard
          title={settings?.entranceExamsSection?.title || 'Entrance Exams'}
          subtitle={settings?.entranceExamsSection?.subtitle || 'Engineering, Medical & Professional Entrance'}
          courses={entranceCourses}
          defaultTiles={defaultEntranceTiles}
          isExpanded={expandedSection.entrance}
          onToggleExpand={() =>
            setExpandedSection((prev) => ({ ...prev, entrance: !prev.entrance }))
          }
          pageLink="/entrance-exams"
          pageLinkLabel="Entrance Exams Page"
          fallbackColor="#7A1D5A"
        />

        {/* Program 3: Banker's Path */}
        <ProgramCard
          title={settings?.bankersPathSection?.title || "Banker's Path"}
          subtitle={settings?.bankersPathSection?.subtitle || 'Banking, Insurance & Finance Certifications'}
          courses={bankersCourses}
          defaultTiles={defaultBankersTiles}
          isExpanded={expandedSection.bankers}
          onToggleExpand={() =>
            setExpandedSection((prev) => ({ ...prev, bankers: !prev.bankers }))
          }
          pageLink="/bankers-path"
          pageLinkLabel="Banker's Path Page"
          fallbackColor="#007B88"
        />

        {/* Program 4: Tuitions (NEW from reference) */}
        <ProgramCard
          title="Tuitions"
          subtitle="School, Intermediate & Degree Tuitions"
          courses={tuitionsCourses}
          defaultTiles={defaultTuitionsTiles}
          isExpanded={expandedSection.tuitions}
          onToggleExpand={() =>
            setExpandedSection((prev) => ({ ...prev, tuitions: !prev.tuitions }))
          }
          pageLink="/tuition-programs"
          pageLinkLabel="Tuition Programs Page"
          fallbackColor="#2D5482"
        />
      </section>

      {/* ========================================================
          5. 4 ACTION CARDS (2x2 GRID MATCHING REFERENCE UI)
      ======================================================== */}
      <section id="features-action-grid" className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Card 1: Enquiry & Demo */}
          <Link
            to="/enquiry"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-black text-xs sm:text-sm leading-tight text-white truncate">
                  Enquiry & Demo
                </h4>
                <p className="text-[8.5px] sm:text-[10px] text-white/90 font-medium truncate">
                  Offline Free Demo
                </p>
              </div>
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>

          {/* Card 2: Materials */}
          <Link
            to="/recorded-classes"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-black text-xs sm:text-sm leading-tight text-white truncate">
                  Materials
                </h4>
                <p className="text-[8.5px] sm:text-[10px] text-white/90 font-medium truncate">
                  Free PDFs
                </p>
              </div>
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>

          {/* Card 3: Classes */}
          <Link
            to="/online-classes"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-[#059669] text-[#059669] translate-x-0.5" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-black text-xs sm:text-sm leading-tight text-white truncate">
                  Classes
                </h4>
                <p className="text-[8.5px] sm:text-[10px] text-white/90 font-medium truncate">
                  Learn Online
                </p>
              </div>
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>

          {/* Card 4: Exams */}
          <Link
            to="/mock-tests"
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-[#7C3AED] flex items-center justify-center shrink-0 shadow-xs">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-[#7C3AED] text-[#7C3AED] translate-x-0.5" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-black text-xs sm:text-sm leading-tight text-white truncate">
                  Exams
                </h4>
                <p className="text-[8.5px] sm:text-[10px] text-white/90 font-medium truncate">
                  Model Papers & Mock Tests
                </p>
              </div>
            </div>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/40 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================
          6. "LEARN WITH A CLEAR PLAN" (EXACT MATCH TO REFERENCE)
      ======================================================== */}
      <section id="learning-plan" className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
          {/* Header with graduation cap badge */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                STRUCTURED LEARNING METHODOLOGY
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif tracking-tight mt-0.5">
                Learn with a Clear Plan
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Choose your goal. Build your knowledge. Practice with your dream.
              </p>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1976D2] text-white flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6 text-[#F4B942]" />
            </div>
          </div>

          {/* 4 Feature Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Card 1: Study Materials */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F7FF] border border-[#D0E6FD] space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1769D2] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#1769D2]" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0B2545]">
                  Study Materials
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                  Keep notes and learning resources in one place.
                </p>
              </div>
              <Link
                to="/recorded-classes"
                className="text-[10px] sm:text-[11px] font-black text-[#1769D2] hover:underline uppercase tracking-wide inline-flex items-center gap-1 pt-1"
              >
                <span>EXPLORE NOTES</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 2: Classes */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EAF9F1] border border-[#D1F2DF] space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <MonitorPlay className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0B2545]">
                  Classes
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                  Access live and recorded learning sessions.
                </p>
              </div>
              <Link
                to="/online-classes"
                className="text-[10px] sm:text-[11px] font-black text-emerald-600 hover:underline uppercase tracking-wide inline-flex items-center gap-1 pt-1"
              >
                <span>JOIN SESSIONS</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 3: Practice Exams */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F6EEFD] border border-[#E9D5FA] space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0B2545]">
                  Practice Exams
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                  Prepare with mock tests and exam-style practice.
                </p>
              </div>
              <Link
                to="/mock-tests"
                className="text-[10px] sm:text-[11px] font-black text-purple-600 hover:underline uppercase tracking-wide inline-flex items-center gap-1 pt-1"
              >
                <span>TAKE MOCK TESTS</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 4: Career Guidance */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF8EC] border border-[#FEE7C3] space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0B2545]">
                  Career Guidance
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                  Find a course path that matches your next goal.
                </p>
              </div>
              <Link
                to="/enquiry"
                className="text-[10px] sm:text-[11px] font-black text-amber-600 hover:underline uppercase tracking-wide inline-flex items-center gap-1 pt-1"
              >
                <span>GET GUIDANCE</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Sub-section: YOUR LEARNING JOURNEY */}
          <div id="learning-journey" className="scroll-mt-24 pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#0B2545] uppercase tracking-wider text-[11px]">
                YOUR LEARNING JOURNEY
              </span>
              <span className="text-slate-500 font-medium text-[11px]">
                Three simple steps
              </span>
            </div>

            <div className="space-y-2">
              {/* Step 1 */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1769D2] font-black text-xs flex items-center justify-center shrink-0">
                  01
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Choose a Course
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B2545]">
                    Banker's Path, Competitive or Entrance Exams.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1769D2] font-black text-xs flex items-center justify-center shrink-0">
                  02
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Learn & Practice
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B2545]">
                    Use classes, study materials and practice exams.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1769D2] font-black text-xs flex items-center justify-center shrink-0">
                  03
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Move Toward Your Goal
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#0B2545]">
                    Stay consistent and track your preparation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FLOATING ACTION WIDGET: "Chat with us" (EXACT REFERENCE)
      ======================================================== */}
      <a
        href={
          settings?.socialLinks?.whatsapp ||
          `https://wa.me/${(settings?.contactInfo?.phone || '919876543210').replace(/[^0-9]/g, '')}`
        }
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-4 sm:right-6 z-50 inline-flex items-center gap-2 bg-[#0B2545] hover:bg-[#12356B] text-white px-4 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-bold border border-white/20 active:scale-95 transition-all cursor-pointer"
        aria-label="Chat with Ranvi Institutions"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <MessageSquare className="w-4 h-4 text-white" />
        <span>Chat with us</span>
      </a>

      {/* ========================================================
          LATEST UPDATES MODAL (DYNAMIC REAL-TIME POPUP)
      ======================================================== */}
      {updatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#F4B942]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B2545]">
                    Latest Institutional Updates
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Official announcements, admission alerts & upcoming schedules
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUpdatesModalOpen(false);
                  setSelectedUpdate(null);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close updates dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Updates List */}
            <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
              {latestUpdates.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No published updates at this moment. Please check back later.
                </div>
              ) : (
                latestUpdates.map((update) => (
                  <div key={update._id} className="pt-3.5 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {update.badgeText || 'Update'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {update.publishedAt ? new Date(update.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : ''}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {update.title}
                    </h4>
                    {update.description && (
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {update.description}
                      </p>
                    )}
                    {update.link && (
                      <div className="pt-1">
                        <a
                          href={update.link}
                          target={update.link.startsWith('http') ? '_blank' : '_self'}
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1769D2] hover:underline"
                        >
                          Learn More / Apply Now <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Total {latestUpdates.length} active updates
              </span>
              <button
                type="button"
                onClick={() => setUpdatesModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0B2545] text-white font-bold hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
