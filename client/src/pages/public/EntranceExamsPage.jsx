import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '../../components/common/PageBanner';
import { entranceExamService } from '../../services';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Cpu,
  Stethoscope,
  Building2,
  School,
  ExternalLink,
  Laptop,
  Users,
  X,
  RotateCcw,
} from 'lucide-react';

const FALLBACK_ENTRANCE_EXAMS = [
  {
    _id: '1',
    title: 'JEE Main',
    shortCode: 'JEE MAIN',
    category: 'Engineering & Technology',
    badge: 'National Level',
    description: 'Admission to B.Tech programs at NITs, IIITs, and other engineering institutions.',
    targetAdmissions: 'B.Tech / B.E. at NITs, IIITs, CFTIs & State Tech Colleges',
    eligibility: '12th Standard / Intermediate with Physics, Chemistry & Mathematics (PCM)',
    conductingBody: 'National Testing Agency (NTA)',
    examPattern: 'Computer-Based Test (CBT) • 3 Hours',
    syllabusHighlights: ['Physics', 'Chemistry', 'Mathematics'],
    colorTheme: 'blue',
  },
  {
    _id: '2',
    title: 'NEET-UG',
    shortCode: 'NEET-UG',
    category: 'Medical & Healthcare',
    badge: 'National Level',
    description: 'Admission to MBBS, BDS, and other eligible medical courses.',
    targetAdmissions: 'MBBS, BDS, BAMS, BHMS, BSMS & All India Medical Seats',
    eligibility: '12th Standard / Intermediate with Physics, Chemistry & Biology (PCB)',
    conductingBody: 'National Testing Agency (NTA)',
    examPattern: 'Pen-and-Paper (OMR) • 3 Hours 20 Mins',
    syllabusHighlights: ['Physics', 'Chemistry', 'Botany', 'Zoology'],
    colorTheme: 'emerald',
  },
  {
    _id: '3',
    title: 'CUET-UG',
    shortCode: 'CUET-UG',
    category: 'Central Universities',
    badge: 'National Level',
    description: 'Admission to undergraduate degree programs at Central Universities.',
    targetAdmissions: 'BA, B.Sc, B.Com, BBA across DU, BHU, JNU, HCU & 45+ Central Universities',
    eligibility: '12th Standard / Intermediate in any stream (Science, Commerce, Arts)',
    conductingBody: 'National Testing Agency (NTA)',
    examPattern: 'Computer-Based Test (CBT) • Domain Subjects + Aptitude',
    syllabusHighlights: ['Domain Subjects', 'Language Comprehension', 'General Mental Ability'],
    colorTheme: 'purple',
  },
  {
    _id: '4',
    title: 'AP EAPCET',
    shortCode: 'AP EAPCET',
    category: 'State Level (Andhra Pradesh)',
    badge: 'State Level - Andhra Pradesh',
    description: 'Admission to Engineering, Agriculture, and Pharmacy courses in Andhra Pradesh.',
    targetAdmissions: 'B.Tech, B.Sc (Agri), B.Pharmacy in Government & Private Colleges across AP',
    eligibility: 'Intermediate 2nd Year / Class 12 with MPC / BiPC',
    conductingBody: 'JNTU Kakinada on behalf of APSCHE',
    examPattern: 'Computer-Based Test (CBT) • 160 Questions • 3 Hours',
    syllabusHighlights: ['Mathematics / Biology', 'Physics', 'Chemistry'],
    colorTheme: 'teal',
  },
  {
    _id: '5',
    title: 'TG EAPCET',
    shortCode: 'TG EAPCET',
    category: 'State Level (Telangana)',
    badge: 'State Level - Telangana',
    description: 'Admission to Engineering, Agriculture, and Pharmacy courses in Telangana.',
    targetAdmissions: 'B.Tech, B.Sc (Hons) Agriculture, B.Pharmacy in Top Telangana Institutions',
    eligibility: 'Intermediate / Class 12 with MPC / BiPC',
    conductingBody: 'JNTU Hyderabad on behalf of TGCHE',
    examPattern: 'Computer-Based Test (CBT) • 160 Questions • 3 Hours',
    syllabusHighlights: ['Mathematics / Biology', 'Physics', 'Chemistry'],
    colorTheme: 'indigo',
  },
  {
    _id: '6',
    title: 'AP POLYCET',
    shortCode: 'AP POLYCET',
    category: 'Polytechnic Diploma',
    badge: 'State Level - Andhra Pradesh',
    description: 'Admission to Polytechnic Diploma courses in Andhra Pradesh.',
    targetAdmissions: '3-Year Technical Engineering & Non-Engineering Diploma Programs',
    eligibility: 'SSC / 10th Class Passed or Appearing with Mathematics',
    conductingBody: 'State Board of Technical Education and Training (SBTET), AP',
    examPattern: 'Offline OMR • 120 Questions • 2 Hours',
    syllabusHighlights: ['SSC Mathematics', 'SSC Physics', 'SSC Chemistry'],
    colorTheme: 'amber',
  },
  {
    _id: '7',
    title: 'TG POLYCET',
    shortCode: 'TG POLYCET',
    category: 'Polytechnic Diploma',
    badge: 'State Level - Telangana',
    description: 'Admission to Polytechnic Diploma courses in Telangana.',
    targetAdmissions: 'Diploma in Engineering & Technology, Agricultural Polytechnic & PJTSAU Programs',
    eligibility: 'SSC / 10th Class Passed or Appearing with Mathematics',
    conductingBody: 'State Board of Technical Education and Training (SBTET), Telangana',
    examPattern: 'Offline OMR • 120 / 150 Questions • 2 Hours 30 Mins',
    syllabusHighlights: ['Mathematics', 'Physics', 'Chemistry', 'Biology (Optional)'],
    colorTheme: 'rose',
  },
  {
    _id: '8',
    title: 'APRJC CET',
    shortCode: 'APRJC CET',
    category: 'Residential Colleges',
    badge: 'State Level - Andhra Pradesh',
    description: 'Admission to Intermediate courses at Andhra Pradesh Residential Junior Colleges.',
    targetAdmissions: 'Intermediate 1st Year (MPC, BPC, CEC, MEC) with Free Residential Facilities',
    eligibility: 'SSC / 10th Class Passed in First Attempt in Andhra Pradesh',
    conductingBody: 'AP Residential Educational Institutions Society (APREIS)',
    examPattern: 'Offline Objective Test • 150 Marks • 2 Hours 30 Mins',
    syllabusHighlights: ['10th Standard State Syllabus in Core Subjects'],
    colorTheme: 'cyan',
  },
  {
    _id: '9',
    title: 'TGCET',
    shortCode: 'TGCET',
    category: 'Residential Schools',
    badge: 'State Level - Telangana',
    description: 'Admission to Telangana Gurukul Residential Schools.',
    targetAdmissions: 'Admissions into Class 5 & Intermediate in TSWREIS, TTWREIS, MJPTBCWREIS Gurukuls',
    eligibility: '4th Class / 10th Class passed students belonging to Telangana State',
    conductingBody: 'Telangana Gurukul Vidyalayas Common Entrance Test Convenor',
    examPattern: 'OMR Based Exam • Core Subjects & Aptitude',
    syllabusHighlights: ['Class-appropriate State Syllabus in Core Subjects'],
    colorTheme: 'blue',
  },
];

export const EntranceExamsPage = () => {
  const [exams, setExams] = useState(FALLBACK_ENTRANCE_EXAMS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await entranceExamService.getEntranceExams();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setExams(res.data);
        }
      } catch (err) {
        console.warn('Using default entrance exam list', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filterTabs = [
    { id: 'ALL', label: 'All Programs' },
    { id: 'NATIONAL', label: 'National Level (JEE / NEET / CUET)' },
    { id: 'STATE_AP', label: 'Andhra Pradesh (EAPCET / POLYCET / APRJC)' },
    { id: 'STATE_TG', label: 'Telangana (EAPCET / POLYCET / TGCET)' },
    { id: 'POLY_RES', label: 'Polytechnic & Residential' },
  ];

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.shortCode && exam.shortCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.targetAdmissions && exam.targetAdmissions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'NATIONAL') {
      return exam.badge?.includes('National') || ['JEE Main', 'NEET-UG', 'CUET-UG'].includes(exam.title);
    }
    if (selectedFilter === 'STATE_AP') {
      return (
        exam.badge?.includes('Andhra') ||
        ['AP EAPCET', 'AP POLYCET', 'APRJC CET'].includes(exam.title)
      );
    }
    if (selectedFilter === 'STATE_TG') {
      return (
        exam.badge?.includes('Telangana') ||
        ['TG EAPCET', 'TG POLYCET', 'TGCET'].includes(exam.title)
      );
    }
    if (selectedFilter === 'POLY_RES') {
      return (
        exam.category?.includes('Polytechnic') ||
        exam.category?.includes('Residential') ||
        ['AP POLYCET', 'TG POLYCET', 'APRJC CET', 'TGCET'].includes(exam.title)
      );
    }

    return true;
  });

  const getThemeStyles = (theme) => {
    switch (theme) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          btnHover: 'hover:border-emerald-500 hover:text-emerald-600',
          accent: 'text-emerald-600',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          btnHover: 'hover:border-purple-500 hover:text-purple-600',
          accent: 'text-purple-600',
        };
      case 'teal':
        return {
          iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
          btnHover: 'hover:border-teal-500 hover:text-teal-600',
          accent: 'text-teal-600',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          btnHover: 'hover:border-indigo-500 hover:text-indigo-600',
          accent: 'text-indigo-600',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          btnHover: 'hover:border-amber-500 hover:text-amber-600',
          accent: 'text-amber-600',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          btnHover: 'hover:border-rose-500 hover:text-rose-600',
          accent: 'text-rose-600',
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          btnHover: 'hover:border-cyan-500 hover:text-cyan-600',
          accent: 'text-cyan-600',
        };
      default:
        return {
          iconBg: 'bg-blue-50 text-[#1769D2] border-blue-200',
          badge: 'bg-blue-50 text-[#12356B] border-blue-200',
          btnHover: 'hover:border-[#1769D2] hover:text-[#1769D2]',
          accent: 'text-[#1769D2]',
        };
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-24 bg-[#F8FAFC]">
      {/* Page Banner */}
      <PageBanner
        title="Entrance Exam Programs"
        subtitle="Premier preparatory programs and targeted coaching for National and State Level Engineering, Medical, Central University, Polytechnic, and Residential Admissions."
        breadcrumbs={[{ label: 'Entrance Exams' }]}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Search & Filter Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by exam name, syllabus, or admission course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2] shadow-xs"
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

            {/* Program Count Badge & Reset */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                Showing <strong className="text-[#0B1E3D]">{filteredExams.length}</strong> of {exams.length} Entrance Exam Programs
              </span>

              {(searchQuery || selectedFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('ALL');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title="Reset filters and search"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-[#0B1E3D] text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-[#0B1E3D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entrance Exam Programs Grid or Empty State */}
        {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredExams.map((exam) => {
            const theme = getThemeStyles(exam.colorTheme);

            return (
              <div
                key={exam._id || exam.title}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Subtle top accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    exam.colorTheme === 'emerald'
                      ? 'bg-emerald-500'
                      : exam.colorTheme === 'purple'
                      ? 'bg-purple-600'
                      : exam.colorTheme === 'teal'
                      ? 'bg-teal-500'
                      : exam.colorTheme === 'indigo'
                      ? 'bg-indigo-600'
                      : exam.colorTheme === 'amber'
                      ? 'bg-amber-500'
                      : exam.colorTheme === 'rose'
                      ? 'bg-rose-500'
                      : exam.colorTheme === 'cyan'
                      ? 'bg-cyan-500'
                      : 'bg-[#1769D2]'
                  }`}
                />

                <div className="space-y-4">
                  {/* Card Header: Icon & Badges */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs ${theme.iconBg}`}
                    >
                      <GraduationCap className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                      >
                        {exam.badge || 'National Level'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {exam.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Official Description */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#0B1E3D] font-heading group-hover:text-[#1769D2] transition-colors leading-tight">
                      {exam.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                      {exam.description}
                    </p>
                  </div>

                  {/* Key Details Tags */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {exam.targetAdmissions && (
                      <div className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Admissions:</strong> {exam.targetAdmissions}
                        </span>
                      </div>
                    )}

                    {exam.eligibility && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Eligibility:</strong> {exam.eligibility}
                        </span>
                      </div>
                    )}

                    {exam.examPattern && (
                      <div className="flex items-start gap-2 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{exam.examPattern}</span>
                      </div>
                    )}
                  </div>

                  {/* Syllabus Pills */}
                  {Array.isArray(exam.syllabusHighlights) && exam.syllabusHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {exam.syllabusHighlights.map((sub, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={`/enquiry?course=${encodeURIComponent(exam.title)}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 group-hover:bg-[#1769D2]"
                  >
                    <span>Enquire & Enroll</span>
                    <ArrowRight className="w-4 h-4 text-[#F4B942] group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to={`/enquiry?course=${encodeURIComponent(exam.title)}`}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    title="Request Demo Session"
                  >
                    Demo
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1769D2] flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#EAF3FF] text-[#12356B] px-3 py-1 rounded-full">
                No Programs Found
              </span>
              <h3 className="text-xl font-black text-[#0B1E3D] font-heading mt-2">
                No Entrance Exam Programs Match
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
                {searchQuery
                  ? `No entrance exam courses match "${searchQuery}". Please check your search terms or reset the filters.`
                  : 'No programs found under the selected category filter.'}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('ALL');
                }}
                className="inline-flex items-center gap-2 bg-[#1769D2] hover:bg-[#12356B] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters & View All
              </button>
              <Link
                to={`/enquiry?course=${encodeURIComponent(searchQuery || 'Entrance Exams')}`}
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

export default EntranceExamsPage;
