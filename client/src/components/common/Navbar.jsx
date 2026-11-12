import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { RanviLogo } from './RanviLogo';
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  PhoneCall,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  GraduationCap,
  Video,
  FileCheck2,
  Receipt,
  CreditCard,
  MessageSquareQuote,
  Settings,
  ShieldAlert,
  LogIn,
  UserPlus,
  Landmark,
  Trophy,
  Users,
} from 'lucide-react';

// Programs dropdown items (single source of truth for desktop + mobile)
const programLinks = [
  {
    name: "Banker's Path",
    path: '/bankers-path',
    description: 'JAIIB, CAIIB & banking exam prep',
    icon: Landmark,
  },
  {
    name: 'Competitive Exams',
    path: '/competitive-exams',
    description: 'IBPS, SBI & other govt. exams',
    icon: Trophy,
  },
  {
    name: 'Entrance Exams',
    path: '/entrance-exams',
    description: 'Focused entrance test coaching',
    icon: GraduationCap,
  },
  {
    name: 'Tuitions',
    path: '/tuition-programs',
    description: 'Subject-wise classes & tutoring',
    icon: Users,
  },
];

// Links shown before / after the Programs dropdown
const linksBeforePrograms = [{ name: 'Home', path: '/' }];
const linksAfterPrograms = [
  { name: 'Online Classes', path: '/online-classes' },
  { name: 'Recorded Classes', path: '/recorded-classes' },
  { name: 'Mock Tests', path: '/mock-tests' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false); // desktop dropdown
  const [mobileProgramsOpen, setMobileProgramsOpen] = useState(false); // mobile accordion
  const profileRef = useRef(null);
  const programsRef = useRef(null);
  const programsCloseTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const topAnnouncement = settings?.topAnnouncement || {
    badgeText: 'Admissions Open 2026',
    message: 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!',
    phone: '+91 98765 43210',
    isActive: true,
  };
  const stripText = settings?.bannerStripText || settings?.supportingMessage || 'Learn • Excel • Achieve';

  // Highlight "Programs" when any program page is active
  const isProgramsActive = programLinks.some(
    (p) => location.pathname === p.path || location.pathname.startsWith(`${p.path}/`)
  );

  // Close everything on route change
  useEffect(() => {
    setProgramsOpen(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keep the Programs accordion open on mobile if a program page is active
  useEffect(() => {
    if (mobileMenuOpen && isProgramsActive) setMobileProgramsOpen(true);
  }, [mobileMenuOpen, isProgramsActive]);

  // Close dropdowns when clicking outside / pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (programsRef.current && !programsRef.current.contains(event.target)) {
        setProgramsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProgramsOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      clearTimeout(programsCloseTimer.current);
    };
  }, []);

  // Hover handlers with a short close delay so the menu doesn't flicker
  const openPrograms = () => {
    clearTimeout(programsCloseTimer.current);
    setProgramsOpen(true);
    setProfileDropdownOpen(false);
  };
  const scheduleClosePrograms = () => {
    clearTimeout(programsCloseTimer.current);
    programsCloseTimer.current = setTimeout(() => setProgramsOpen(false), 120);
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // Shared desktop link styling (nowrap keeps the bar on a single row)
  const desktopLinkClass = (active) =>
    `px-2.5 2xl:px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-150 ${
      active
        ? 'text-[#1769D2] bg-[#EAF3FF]'
        : 'text-[#17243A] hover:text-[#12356B] hover:bg-slate-100/80'
    }`;

  // Helper: Role Configuration
  const getRoleConfig = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return {
          title: 'Platform Administrator',
          shortLabel: 'Admin',
          avatarBg: 'bg-gradient-to-br from-[#0B1E3D] to-[#1E3A8A]',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          dotBg: 'bg-amber-400',
          ringColor: 'ring-amber-400/60',
          dashboardPath: '/admin/dashboard',
        };
      case 'STUDENT':
      default:
        return {
          title: 'Student Learner',
          shortLabel: 'Student',
          avatarBg: 'bg-gradient-to-br from-[#1976D2] to-[#0D47A1]',
          badgeBg: 'bg-[#EAF3FF] text-[#12356B] border-blue-200',
          dotBg: 'bg-emerald-500',
          ringColor: 'ring-blue-400/60',
          dashboardPath: '/student/dashboard',
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);

  // Helper: Extract Initials from Name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Notification Announcement Bar */}
      {topAnnouncement.isActive !== false && (
        <div className="bg-[#0B1E3D] text-white text-xs py-1.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center font-medium">
            <div className="flex items-center gap-2">
              <span className="bg-[#F4B942] text-[#0B1E3D] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {topAnnouncement.badgeText || 'Admissions Open 2026'}
              </span>
              <span className="text-slate-200">
                {topAnnouncement.message || 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              {topAnnouncement.phone && (
                <a
                  href={`tel:${topAnnouncement.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-1.5 hover:text-[#F4B942] transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#F4B942]" />
                  <span className="font-bold">{topAnnouncement.phone}</span>
                </a>
              )}
              <span className="text-white/40">•</span>
              <span className="text-[#F4B942] font-extrabold tracking-wider">
                {stripText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16 sm:h-18 relative">
          {/* 1. Mobile Menu Icon (LEFT on mobile, hidden on xl+) */}
          <div className="flex xl:hidden items-center z-20">
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setProfileDropdownOpen(false);
              }}
              className="w-10 h-10 rounded-xl bg-[#0B2545] hover:bg-[#12356B] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* 2. Website Logo (CENTERED on mobile, LEFT on desktop) */}
          <div className="xl:static absolute left-1/2 -translate-x-1/2 xl:translate-x-0 xl:left-auto flex items-center shrink-0 z-10">
            <Link to="/" className="flex items-center group">
              <RanviLogo size="default" />
            </Link>
          </div>

          {/* 3. Desktop Navigation Links (single row, hidden on mobile) */}
          <nav className="hidden xl:flex flex-1 items-center justify-center gap-0.5 2xl:gap-1 min-w-0">
            {linksBeforePrograms.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) => desktopLinkClass(isActive)}
              >
                {link.name}
              </NavLink>
            ))}

            {/* Programs Dropdown */}
            <div
              ref={programsRef}
              className="relative"
              onMouseEnter={openPrograms}
              onMouseLeave={scheduleClosePrograms}
            >
              <button
                type="button"
                onClick={() => setProgramsOpen((prev) => !prev)}
                className={`${desktopLinkClass(isProgramsActive || programsOpen)} inline-flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769D2]/50`}
                aria-haspopup="menu"
                aria-expanded={programsOpen}
              >
                Programs
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    programsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {programsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
                  <div
                    role="menu"
                    className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {programLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          role="menuitem"
                          onClick={() => setProgramsOpen(false)}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                              isActive ? 'bg-[#EAF3FF]' : 'hover:bg-[#EAF3FF]'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                                  isActive
                                    ? 'bg-[#1769D2] text-white'
                                    : 'bg-slate-100 text-[#1769D2] group-hover:bg-[#1769D2] group-hover:text-white'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="min-w-0">
                                <span
                                  className={`block text-sm font-bold leading-tight ${
                                    isActive ? 'text-[#1769D2]' : 'text-[#0B1E3D] group-hover:text-[#1769D2]'
                                  }`}
                                >
                                  {item.name}
                                </span>
                                <span className="block text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                                  {item.description}
                                </span>
                              </span>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {linksAfterPrograms.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => desktopLinkClass(isActive)}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* 4. Right Section: CTAs + Dynamic User Profile / Skeleton Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 z-20" ref={profileRef}>
            {/* Profile Section: Dynamic (Logged In) OR Skeleton Avatar (Logged Out) */}
            {isAuthenticated ? (
              /* ========================================================
                 A. LOGGED IN DYNAMIC USER PROFILE
              ======================================================== */
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setProgramsOpen(false);
                  }}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-2 rounded-2xl sm:rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 active:scale-95 focus:outline-none"
                  aria-label="User Profile Menu"
                >
                  {/* Avatar Circle with Online Dot */}
                  <div className="relative">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${roleConfig.avatarBg} text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md ring-2 ring-white`}
                    >
                      {getInitials(user?.name)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${roleConfig.dotBg} border-2 border-white shadow-xs`}
                      title={`Active Session (${roleConfig.shortLabel})`}
                    />
                  </div>

                  {/* Desktop Name & Role Badge */}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-black text-[#0B1E3D] leading-tight line-clamp-1 max-w-[120px]">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      {roleConfig.shortLabel}
                    </span>
                  </div>

                  <ChevronDown
                    className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dynamic Role-Based Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    {/* User Profile Header Card */}
                    <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl ${roleConfig.avatarBg} text-white flex items-center justify-center font-black text-base shadow-md shrink-0`}
                        >
                          {getInitials(user?.name)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-[#0B1E3D] truncate leading-tight">
                            {user?.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleConfig.badgeBg}`}
                            >
                              {roleConfig.title}
                            </span>
                            {user?.targetExam && isStudent && (
                              <span className="text-[10px] font-bold text-slate-600 truncate bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                {user.targetExam}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role-Specific Navigation Options */}
                    <div className="py-2 px-2 space-y-0.5">
                      {isStudent && (
                        <>
                          <Link
                            to="/student/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#1769D2]" />
                            <span>Student Dashboard</span>
                          </Link>
                          <Link
                            to="/student/my-courses"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                            <span>My Enrolled Courses</span>
                          </Link>
                          <Link
                            to="/student/live-classes"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <Video className="w-4 h-4 text-amber-600" />
                            <span>Live Zoom Classes</span>
                          </Link>
                          <Link
                            to="/student/mock-tests"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <FileCheck2 className="w-4 h-4 text-purple-600" />
                            <span>Online Mock Tests</span>
                          </Link>
                          <Link
                            to="/student/payments"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <Receipt className="w-4 h-4 text-sky-600" />
                            <span>Payment Receipts</span>
                          </Link>
                          <Link
                            to="/student/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Profile & Device Settings</span>
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#1769D2]" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            to="/admin/courses"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                            <span>Course Management</span>
                          </Link>
                          <Link
                            to="/admin/entrance-exams"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <GraduationCap className="w-4 h-4 text-[#1769D2]" />
                            <span>Entrance Exam Programs</span>
                          </Link>
                          <Link
                            to="/admin/mock-tests"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <FileCheck2 className="w-4 h-4 text-purple-600" />
                            <span>Mock Tests & Question Papers</span>
                          </Link>
                          <Link
                            to="/admin/students"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <User className="w-4 h-4 text-amber-600" />
                            <span>Students & Devices</span>
                          </Link>
                          <Link
                            to="/admin/payments"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            <span>Payments & Revenue</span>
                          </Link>
                          <Link
                            to="/admin/enquiries"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <MessageSquareQuote className="w-4 h-4 text-sky-600" />
                            <span>Enquiries & Leads</span>
                          </Link>
                          <Link
                            to="/admin/settings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <Settings className="w-4 h-4 text-slate-600" />
                            <span>Website Settings</span>
                          </Link>
                          <Link
                            to="/admin/audit-logs"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1769D2] transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>Security Audit Logs</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-2 px-3 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ========================================================
                 B. DEFAULT SKELETON AVATAR (GUEST / NOT LOGGED IN)
              ======================================================== */
              <div className="relative flex items-center gap-2">
                {/* Desktop Quick Login Button */}
                <Link
                  to="/login"
                  className="hidden md:inline-flex items-center gap-2 whitespace-nowrap bg-[#0B1E3D] hover:bg-[#12356B] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-[#F4B942]" />
                  <span>Portal Login</span>
                </Link>

                {/* Default Avatar Icon - Solid Purple circle matching reference image */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setProgramsOpen(false);
                  }}
                  className="w-10 h-10 rounded-full bg-[#5C45B3] hover:bg-[#4E37A4] text-white flex items-center justify-center relative transition-all duration-200 shadow-sm focus:outline-none active:scale-95 cursor-pointer"
                  title="Guest Profile / Account Options"
                  aria-label="Account Menu"
                >
                  <User className="w-5 h-5 text-white" />
                </button>

                {/* Guest Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 top-full w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    {/* Guest Header */}
                    <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0B1E3D] leading-tight">
                          Guest User
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Not logged in
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Account Access
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <p className="text-xs text-slate-600 px-2 leading-relaxed">
                        Sign in to access your course videos, live Zoom classes, mock test papers, and progress analytics.
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <Link
                          to="/login"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all active:scale-95"
                        >
                          <LogIn className="w-4 h-4 text-[#F4B942]" />
                          <span>Portal Login</span>
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#12356B] border border-[#1769D2]/25 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95"
                        >
                          <UserPlus className="w-4 h-4 text-[#1769D2]" />
                          <span>Create Student Account</span>
                        </Link>
                        <Link
                          to="/enquiry"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Book Free Demo Class</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (< xl screens) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
          {/* Mobile User Profile Header Banner */}
          {isAuthenticated ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${roleConfig.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-xs`}
                >
                  {getInitials(user?.name)}
                </div>
                <div>
                  <p className="text-sm font-black text-[#0B1E3D] leading-tight truncate max-w-[170px]">
                    {user?.name}
                  </p>
                  <p className="text-[11px] font-bold text-[#1769D2]">
                    {roleConfig.title}
                  </p>
                </div>
              </div>
              <Link
                to={roleConfig.dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black bg-[#0B1E3D] text-white px-3 py-1.5 rounded-xl shadow-xs"
              >
                Portal
              </Link>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">Guest Learner</p>
                  <p className="text-[10px] text-slate-500 font-medium">Access your portal</p>
                </div>
              </div>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black bg-[#0B1E3D] text-white px-3 py-1.5 rounded-xl shadow-xs"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            {linksBeforePrograms.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-colors ${
                    isActive
                      ? 'bg-[#EAF3FF] text-[#1769D2]'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Mobile Programs Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileProgramsOpen((prev) => !prev)}
                aria-expanded={mobileProgramsOpen}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-colors cursor-pointer ${
                  isProgramsActive
                    ? 'bg-[#EAF3FF] text-[#1769D2]'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>Programs</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileProgramsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileProgramsOpen && (
                <div className="mt-1 ml-4 pl-3 border-l-2 border-[#1769D2]/20 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {programLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            isActive
                              ? 'bg-[#EAF3FF] text-[#1769D2]'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 text-[#1769D2] shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {linksAfterPrograms.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-colors ${
                    isActive
                      ? 'bg-[#EAF3FF] text-[#1769D2]'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Mobile Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/enquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-[#EAF3FF] text-[#12356B] border border-[#1769D2]/25 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#1769D2]" />
              Book Free Demo Class
            </Link>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-center py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user?.name?.split(' ')[0]})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#0B1E3D] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#1769D2] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;