import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import {
  Settings,
  Save,
  Sparkles,
  Layers,
  GraduationCap,
  BookOpen,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Shield,
  Star,
  MonitorPlay,
  Users,
  FileText,
  ClipboardList,
  Mail,
  Share2,
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { success, error: toastError } = useToast();
  const { refreshSettings } = useSiteSettings();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminService.getSiteSettings();
        if (res.success && res.data) {
          const data = { ...res.data };

          // Normalize nested sections with resilient defaults
          data.topAnnouncement = {
            badgeText: 'Admissions Open 2026',
            message: 'New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!',
            phone: '+91 98765 43210',
            isActive: true,
            ...(data.topAnnouncement || {}),
          };

          data.heroBanner = {
            badgeText: "India's Premier Coaching for Banking & Government Exams",
            headline: 'Build Your Banking & Government Career with Us',
            highlightWord: 'Banking & Government',
            headlinePrefix: 'Build Your',
            headlineHighlight: 'Banking & Government',
            headlineSuffix: 'Career with Us',
            subheadline:
              'Expert-led coaching, live interactive Zoom classes, high-yield study material, and 10–20 real-pattern online mock tests to help you achieve your next career milestone.',
            heroImage: '/assets/hero-banner.png',
            ...(data.heroBanner || {}),
          };

          data.bannerStripText =
            data.bannerStripText ||
            data.bannerStrip?.tagline ||
            data.supportingMessage ||
            'Learn • Excel • Achieve';

          data.bankersPathSection = {
            title: "Banker's Path",
            subtitle: 'Banking • Insurance • Finance',
            ...(data.bankersPathSection || {}),
          };

          data.competitiveExamsSection = {
            title: 'Competitive Exams',
            subtitle: 'Government Jobs • Banking • Railways • Defence & More',
            ...(data.competitiveExamsSection || data.competitiveSection || {}),
          };

          data.entranceExamsSection = {
            title: 'Entrance Exams',
            subtitle: 'Engineering • Medical • Central Universities & State CETs',
            ...(data.entranceExamsSection || {}),
          };

          data.actionCards =
            Array.isArray(data.actionCards) && data.actionCards.length === 4
              ? data.actionCards
              : [
                  {
                    title: 'Enquiry & Demo',
                    subtitle: 'Join our free demo classes',
                    path: '/enquiry',
                    bgColor: '#0080FF',
                  },
                  {
                    title: 'Materials',
                    subtitle: 'Get study notes',
                    path: '/recorded-classes',
                    bgColor: '#FF8C00',
                  },
                  {
                    title: 'Classes',
                    subtitle: 'Live & Recorded',
                    path: '/online-classes',
                    bgColor: '#00C853',
                  },
                  {
                    title: 'Exams',
                    subtitle: 'Mock tests & Online tests',
                    path: '/mock-tests',
                    bgColor: '#9B51E0',
                  },
                ];

          data.clearPlanSection = {
            badge: 'PREPARE WITH STRUCTURED METHODOLOGY',
            title: 'Learn with a Clear Plan',
            description:
              'Focus on what matters most with our structured approach that turns aspirants into achievers.',
            features: [
              {
                title: 'Daily Planner',
                desc: 'Structured daily schedule to cover complete syllabus on time.',
              },
              {
                title: 'Classes',
                desc: 'Interactive live & high quality recorded video lectures.',
              },
              {
                title: 'Practice Exams',
                desc: 'Chapter-wise quizzes and full-length online mock tests.',
              },
              {
                title: 'Expert Guidance',
                desc: 'Doubt sessions and personal mentoring by retired bankers & rankers.',
              },
            ],
            ...(data.clearPlanSection || {}),
          };

          data.roadmapSection = {
            title: 'Roadmap',
            steps: [
              {
                step: '01',
                title: 'Enroll in your course',
                desc: 'Get instant access to study material & video lectures.',
              },
              {
                step: '02',
                title: 'Learn & Practice',
                desc: 'Join daily live classes & take chapter-wise mock tests.',
              },
              {
                step: '03',
                title: 'Crack Exam & Reach Goal',
                desc: 'Achieve top ranks with continuous guidance & analysis.',
              },
            ],
            ...(data.roadmapSection || {}),
          };

          data.aboutSection = {
            legacyTitle: 'Shaping India’s Next Generation of Banking Leaders & Public Servants',
            legacyText1:
              'Founded by veteran bankers and educationists, Ranvi Institutions stands at the forefront of career development for banking employees and competitive recruitment aspirants.',
            legacyText2:
              'We specialize in IIBF-accredited certifications (JAIIB, CAIIB, DBF, DTM) and premier government examinations (IBPS PO/Clerk, SBI PO, RBI Grade B, SSC CGL, Railways). Our pedagogical model pairs conceptual mastery with rigorous computer-based exam simulations.',
            stats: [
              { label: 'Students Trained', value: '25,000+' },
              { label: '1st Attempt Clear', value: '89.4%' },
              { label: 'Ex-Banker Faculty', value: '45+' },
            ],
            missionText:
              'To deliver accessible, result-driven, and ethically grounded coaching that empowers every banking professional and competitive exam aspirant to achieve their highest career milestones with confidence and conceptual clarity.',
            visionText:
              'To be recognized as India’s most trusted educational institution for professional banking certifications and government recruitment, setting the standard for quality pedagogy and student success rates.',
            ...(data.aboutSection || {}),
          };

          data.contactInfo = {
            phone: '+91 98765 43210',
            email: 'admissions@ranviinstitutions.com',
            whatsapp: '+91 98765 43210',
            address: 'Ranvi Knowledge Tower, MG Road Coaching Hub, India',
            workingHours: 'Monday - Saturday: 8:00 AM - 8:00 PM IST',
            ...(data.contactInfo || {}),
          };

          data.socialLinks = {
            whatsapp: 'https://wa.me/919876543210',
            youtube: 'https://youtube.com',
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
            linkedin: 'https://linkedin.com',
            telegram: 'https://telegram.org',
            ...(data.socialLinks || {}),
          };

          data.demoPolicy = {
            freeRecordedLessonsLimit: 2,
            freeMockTestsLimit: 1,
            ...(data.demoPolicy || {}),
          };

          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toastError('Failed to load website settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Sync bannerStrip text across both keys
      const payload = {
        ...settings,
        bannerStripText: settings.bannerStripText || settings.supportingMessage || 'Learn • Excel • Achieve',
        supportingMessage: settings.bannerStripText || settings.supportingMessage || 'Learn • Excel • Achieve',
        bannerStrip: { tagline: settings.bannerStripText || 'Learn • Excel • Achieve' },
      };

      const res = await adminService.updateSiteSettings(payload);
      if (res.success) {
        success('Website settings updated & synchronized live across the website!');
        if (refreshSettings) refreshSettings();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Testimonial helpers
  const addTestimonial = () => {
    setSettings((prev) => ({
      ...prev,
      testimonials: [
        ...(prev.testimonials || []),
        {
          name: 'New Student',
          designation: 'Assistant Manager, SBI',
          exam: 'Cleared JAIIB 2026',
          quote: 'Excellent coaching and practice tests provided by Ranvi Institutions.',
          image:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
          stars: 5,
        },
      ],
    }));
  };

  const removeTestimonial = (index) => {
    setSettings((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index),
    }));
  };

  // FAQ helpers
  const addFaq = () => {
    setSettings((prev) => ({
      ...prev,
      faqs: [
        ...(prev.faqs || []),
        {
          question: 'New Question?',
          answer: 'Comprehensive answer goes here.',
          category: 'General',
        },
      ],
    }));
  };

  const removeFaq = (index) => {
    setSettings((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const tabs = [
    { id: 'general', label: 'General & Top Bar', icon: Settings },
    { id: 'hero', label: 'Hero Banner (Static)', icon: Sparkles },
    { id: 'programs', label: 'Coaching Programs', icon: GraduationCap },
    { id: 'actionHubs', label: 'Action Cards & Plan', icon: BookOpen },
    { id: 'contact', label: 'Contact & Social Links', icon: PhoneCall },
    { id: 'about', label: 'About Institute & Stats', icon: Award },
    { id: 'testimonials', label: 'Student Reviews', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs & Help', icon: HelpCircle },
  ];

  if (loading || !settings) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-500">Loading website configuration...</p>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6 max-w-5xl">
      {/* ========================================================
          1. HEADER BAR WITH IMMEDIATE SAVE & PUBLISH ACTION
      ======================================================== */}
      <div className="shrink-0 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1E3D] font-heading">
              Website Settings Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic branding, announcement bar, hero copy, coaching program headers, action cards, and contact links.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] active:scale-95 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" /> {saving ? 'Publishing Changes...' : 'Save & Publish Live'}
        </button>
      </div>

      {/* ========================================================
          2. SCROLLABLE TAB PILLS
      ======================================================== */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#12356B] text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. TAB CONTENT CARDS
      ======================================================== */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {/* ----------------------------------------------------
            TAB 1: GENERAL & TOP ANNOUNCEMENT BAR
        ---------------------------------------------------- */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B1E3D]">Brand Identity & Top Announcement</h2>
              <p className="text-xs text-slate-500">
                Configure institute name, global ribbon tagline, and top header notification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={settings.institutionName || ''}
                  onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                  placeholder="RANVI INSTITUTIONS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="Your Next Career Milestones"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-extrabold text-slate-700 mb-1">
                  Website Timezone (Security Audit Logs & Daily Midnight Cutoff)
                </label>
                <select
                  value={settings.timezone || 'Asia/Kolkata'}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+05:30 — India Standard Time)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST — UTC+04:00)</option>
                  <option value="Europe/London">Europe/London (GMT / BST)</option>
                  <option value="America/New_York">America/New_York (EST / EDT)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Security audit logs are retained strictly for the current day based on this timezone. Records older than 00:00:00 local time are automatically purged.
                </p>
              </div>

              {/* Gold Ribbon Tagline */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <label className="block font-extrabold text-amber-900">
                  Gold Banner Ribbon Strip (Below Hero & In Navigation)
                </label>
                <input
                  type="text"
                  value={settings.bannerStripText || 'Learn • Excel • Achieve'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bannerStripText: e.target.value,
                      supportingMessage: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 font-black text-amber-900 bg-white"
                />
              </div>
            </div>

            {/* Top Announcement Bar Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                    Top Announcement Bar (Header Notification)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    The highlighted yellow pill and alert bar shown at the very top of all pages.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.topAnnouncement?.isActive !== false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: {
                          ...settings.topAnnouncement,
                          isActive: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Pill Text</label>
                  <input
                    type="text"
                    value={settings.topAnnouncement?.badgeText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: {
                          ...settings.topAnnouncement,
                          badgeText: e.target.value,
                        },
                      })
                    }
                    placeholder="Admissions Open 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hotline Phone</label>
                  <input
                    type="text"
                    value={settings.topAnnouncement?.phone || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: {
                          ...settings.topAnnouncement,
                          phone: e.target.value,
                        },
                      })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Notification Message</label>
                  <input
                    type="text"
                    value={settings.topAnnouncement?.message || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        topAnnouncement: {
                          ...settings.topAnnouncement,
                          message: e.target.value,
                        },
                      })
                    }
                    placeholder="New Batches for JAIIB, CAIIB, IBPS PO & SBI PO starting this week!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 2: HERO BANNER (STATIC IMAGES MATCHING REFERENCE)
        ---------------------------------------------------- */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B1E3D]">Hero Banner (Static Reference Design)</h2>
              <p className="text-xs text-slate-500">
                The hero banner uses the official, responsive static visual. Customize the main headline and feature labels.
              </p>
            </div>

            {/* Static Image Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-xs shrink-0 bg-slate-800">
                <img
                  src="/assets/hero-banner.png"
                  alt="Static Hero Preview"
                  className="w-full h-full object-cover object-right"
                  onError={(e) => {
                    e.currentTarget.src = '/hero-banner.png';
                  }}
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Fixed Static Image (Production-Optimized)
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  Fixed Brand Hero Visual (/assets/hero-banner.png)
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Per the website specifications, dynamic slide uploads have been replaced with the high-yield static reference graphic to maintain fast load times and clean layout consistency.
                </p>
              </div>
            </div>

            {/* Headline Configuration */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                Hero Headline Customization
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Headline Prefix</label>
                  <input
                    type="text"
                    value={settings.heroBanner?.headlinePrefix || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroBanner: { ...settings.heroBanner, headlinePrefix: e.target.value },
                      })
                    }
                    placeholder="Build Your"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Highlighted Phrase <span className="text-amber-600">(Gold Color)</span>
                  </label>
                  <input
                    type="text"
                    value={settings.heroBanner?.headlineHighlight || settings.heroBanner?.highlightWord || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroBanner: {
                          ...settings.heroBanner,
                          headlineHighlight: e.target.value,
                          highlightWord: e.target.value,
                        },
                      })
                    }
                    placeholder="Banking & Government"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Headline Suffix</label>
                  <input
                    type="text"
                    value={
                      settings.heroBanner?.headlineSuffix !== undefined
                        ? settings.heroBanner.headlineSuffix
                        : 'Career with Us'
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        heroBanner: { ...settings.heroBanner, headlineSuffix: e.target.value },
                      })
                    }
                    placeholder="Career with Us"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-[#081A36] text-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Live Headline Preview:
                </span>
                <p className="text-lg sm:text-xl font-black font-serif">
                  {settings.heroBanner?.headlinePrefix || 'Build Your'}{' '}
                  <span className="text-[#F4B942]">
                    {settings.heroBanner?.headlineHighlight ||
                      settings.heroBanner?.highlightWord ||
                      'Banking & Government'}
                  </span>{' '}
                  {settings.heroBanner?.headlineSuffix !== undefined
                    ? settings.heroBanner.headlineSuffix
                    : 'Career with Us'}
                </p>
              </div>
            </div>

            {/* 4 Feature Badges Preview */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                4 Fixed Trust Highlights (Under Headline)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                  <Shield className="w-5 h-5 text-[#12356B] mb-1" />
                  <span className="text-xs font-extrabold text-slate-800">Expert Faculty</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#12356B] mb-1" />
                  <span className="text-xs font-extrabold text-slate-800">Updated Material</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                  <MonitorPlay className="w-5 h-5 text-[#12356B] mb-1" />
                  <span className="text-xs font-extrabold text-slate-800">Online & Offline</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                  <Users className="w-5 h-5 text-[#12356B] mb-1" />
                  <span className="text-xs font-extrabold text-slate-800">Personal Guidance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: COACHING PROGRAMS HEADERS
        ---------------------------------------------------- */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-[#0B1E3D]">3 Coaching Programs Section Headers</h2>
                <p className="text-xs text-slate-500">
                  Configure section titles and subtitles for Banker's Path, Competitive Exams, and Entrance Exams.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/courses"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1769D2] hover:bg-blue-100 text-[11px] font-bold border border-blue-200"
                >
                  Manage Courses <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  to="/admin/entrance-exams"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold border border-purple-200"
                >
                  Entrance Exams <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {/* Program 1: Banker's Path */}
              <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-teal-800 tracking-wider">
                    Program 01: Banker's Path Header
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                    Live on Homepage
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={settings.bankersPathSection?.title || "Banker's Path"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankersPathSection: {
                            ...settings.bankersPathSection,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Banker's Path"
                      className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                    <input
                      type="text"
                      value={settings.bankersPathSection?.subtitle || 'Banking • Insurance • Finance'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankersPathSection: {
                            ...settings.bankersPathSection,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Banking • Insurance • Finance"
                      className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Program 2: Competitive Exams */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-purple-800 tracking-wider">
                    Program 02: Competitive Exams Header
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Live on Homepage
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={settings.competitiveExamsSection?.title || 'Competitive Exams'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          competitiveExamsSection: {
                            ...settings.competitiveExamsSection,
                            title: e.target.value,
                          },
                          competitiveSection: {
                            ...settings.competitiveSection,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Competitive Exams"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                    <input
                      type="text"
                      value={
                        settings.competitiveExamsSection?.subtitle ||
                        'Government Jobs • Banking • Railways • Defence & More'
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          competitiveExamsSection: {
                            ...settings.competitiveExamsSection,
                            subtitle: e.target.value,
                          },
                          competitiveSection: {
                            ...settings.competitiveSection,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Government Jobs • Banking • Railways • Defence & More"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Program 3: Entrance Exams */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                    Program 03: Entrance Exams Header
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live on Homepage
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={settings.entranceExamsSection?.title || 'Entrance Exams'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          entranceExamsSection: {
                            ...settings.entranceExamsSection,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Entrance Exams"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
                    <input
                      type="text"
                      value={
                        settings.entranceExamsSection?.subtitle ||
                        'Engineering • Medical • Central Universities & State CETs'
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          entranceExamsSection: {
                            ...settings.entranceExamsSection,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Engineering • Medical • Central Universities & State CETs"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 4: ACTION CARDS & LEARNING PLAN
        ---------------------------------------------------- */}
        {activeTab === 'actionHubs' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B1E3D]">Action Cards & Learning Plan</h2>
              <p className="text-xs text-slate-500">
                Manage the 4 action hub cards and the structured learning plan displayed on the homepage.
              </p>
            </div>

            {/* 4 Action Cards List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                4 Action Cards (2x2 Grid)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {settings.actionCards?.map((card, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-[#12356B]">CARD #{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                          style={{ backgroundColor: card.bgColor || '#12356B' }}
                        ></span>
                        <input
                          type="text"
                          value={card.bgColor || '#12356B'}
                          onChange={(e) => {
                            const updated = [...settings.actionCards];
                            updated[idx] = { ...updated[idx], bgColor: e.target.value };
                            setSettings({ ...settings, actionCards: updated });
                          }}
                          className="w-20 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Card Title</label>
                        <input
                          type="text"
                          value={card.title || ''}
                          onChange={(e) => {
                            const updated = [...settings.actionCards];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setSettings({ ...settings, actionCards: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Link Route</label>
                        <input
                          type="text"
                          value={card.path || card.link || ''}
                          onChange={(e) => {
                            const updated = [...settings.actionCards];
                            updated[idx] = {
                              ...updated[idx],
                              path: e.target.value,
                              link: e.target.value,
                            };
                            setSettings({ ...settings, actionCards: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Subtitle / Helper</label>
                      <input
                        type="text"
                        value={card.subtitle || ''}
                        onChange={(e) => {
                          const updated = [...settings.actionCards];
                          updated[idx] = { ...updated[idx], subtitle: e.target.value };
                          setSettings({ ...settings, actionCards: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* "Learn with a Clear Plan" Section Header */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3 pt-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                "Learn with a Clear Plan" Header & Badge
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={settings.clearPlanSection?.badge || 'PREPARE WITH STRUCTURED METHODOLOGY'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clearPlanSection: {
                          ...settings.clearPlanSection,
                          badge: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={settings.clearPlanSection?.title || 'Learn with a Clear Plan'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clearPlanSection: {
                          ...settings.clearPlanSection,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Section Description</label>
                  <input
                    type="text"
                    value={
                      settings.clearPlanSection?.description ||
                      'Follow our proven, step-by-step methodology to crack your exams with confidence.'
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clearPlanSection: {
                          ...settings.clearPlanSection,
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3-Step Roadmap */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                3-Step Preparation Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {settings.roadmapSection?.steps?.map((stepItem, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1769D2] font-black text-[11px] flex items-center justify-center">
                      {stepItem.step || `0${idx + 1}`}
                    </span>
                    <input
                      type="text"
                      value={stepItem.title || ''}
                      onChange={(e) => {
                        const updated = [...settings.roadmapSection.steps];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setSettings({
                          ...settings,
                          roadmapSection: { ...settings.roadmapSection, steps: updated },
                        });
                      }}
                      placeholder="Step Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                    <textarea
                      rows={2}
                      value={stepItem.desc || ''}
                      onChange={(e) => {
                        const updated = [...settings.roadmapSection.steps];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setSettings({
                          ...settings,
                          roadmapSection: { ...settings.roadmapSection, steps: updated },
                        });
                      }}
                      placeholder="Step Description"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 5: CONTACT & SOCIAL MEDIA LINKS
        ---------------------------------------------------- */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B1E3D]">Contact Information & Social Links</h2>
              <p className="text-xs text-slate-500">
                Manage official support telephone, emails, office address, and social platform URLs.
              </p>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.contactInfo?.phone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, phone: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Hotline</label>
                <input
                  type="text"
                  value={settings.contactInfo?.whatsapp || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, whatsapp: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.contactInfo?.email || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, email: e.target.value },
                    })
                  }
                  placeholder="admissions@ranviinstitutions.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Working / Counseling Hours</label>
                <input
                  type="text"
                  value={settings.contactInfo?.workingHours || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, workingHours: e.target.value },
                    })
                  }
                  placeholder="Monday - Saturday: 8:00 AM - 8:00 PM IST"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Campus / Branch Address</label>
                <input
                  type="text"
                  value={settings.contactInfo?.address || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, address: e.target.value },
                    })
                  }
                  placeholder="Ranvi Knowledge Tower, MG Road Coaching Hub, Vijayawada, Andhra Pradesh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                Social Media Channels & Direct Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Direct Link / URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.whatsapp || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, whatsapp: e.target.value },
                      })
                    }
                    placeholder="https://wa.me/919876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">YouTube Channel URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.youtube || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/@ranviinstitutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram Profile URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/ranviinstitutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facebook Page URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, facebook: e.target.value },
                      })
                    }
                    placeholder="https://facebook.com/ranviinstitutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.linkedin || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/company/ranvi-institutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telegram Community URL</label>
                  <input
                    type="text"
                    value={settings.socialLinks?.telegram || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, telegram: e.target.value },
                      })
                    }
                    placeholder="https://t.me/ranvi_institutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Demo Policy & Quotas */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                Student Free Demo Policy & Quotas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Free Demo Recorded Lessons Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings.demoPolicy?.freeRecordedLessonsLimit || 2}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        demoPolicy: {
                          ...settings.demoPolicy,
                          freeRecordedLessonsLimit: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Free Demo Mock Tests Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings.demoPolicy?.freeMockTestsLimit || 1}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        demoPolicy: {
                          ...settings.demoPolicy,
                          freeMockTestsLimit: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 6: ABOUT INSTITUTE & STATS
        ---------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B1E3D]">About Institute & Platform Metrics</h2>
              <p className="text-xs text-slate-500">
                Configure platform achievements, mission, vision, and legacy overview copy.
              </p>
            </div>

            {/* 3 Impact Stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-[#12356B] tracking-wider">
                3 Key Platform Achievement Counters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {settings.aboutSection?.stats?.map((stat, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400">COUNTER #{idx + 1}</span>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...settings.aboutSection.stats];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setSettings({
                          ...settings,
                          aboutSection: { ...settings.aboutSection, stats: updated },
                        });
                      }}
                      placeholder="25,000+"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-black text-[#12356B] text-base"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const updated = [...settings.aboutSection.stats];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setSettings({
                          ...settings,
                          aboutSection: { ...settings.aboutSection, stats: updated },
                        });
                      }}
                      placeholder="Students Trained"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Our Mission</label>
                <textarea
                  rows={3}
                  value={settings.aboutSection?.missionText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aboutSection: { ...settings.aboutSection, missionText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Our Vision</label>
                <textarea
                  rows={3}
                  value={settings.aboutSection?.visionText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aboutSection: { ...settings.aboutSection, visionText: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Legacy Main Title</label>
                <input
                  type="text"
                  value={settings.aboutSection?.legacyTitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aboutSection: { ...settings.aboutSection, legacyTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Legacy Primary Text</label>
                <textarea
                  rows={2}
                  value={settings.aboutSection?.legacyText1 || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aboutSection: { ...settings.aboutSection, legacyText1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 7: STUDENT REVIEWS & TESTIMONIALS
        ---------------------------------------------------- */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-[#0B1E3D]">Student Success Stories</h2>
                <p className="text-xs text-slate-500">
                  Manage authentic bank officer and aspirant reviews with photos and ranks.
                </p>
              </div>
              <button
                type="button"
                onClick={addTestimonial}
                className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.testimonials?.map((t, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#12356B]">REVIEW #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeTestimonial(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Student Name</label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const updated = [...settings.testimonials];
                          updated[idx].name = e.target.value;
                          setSettings({ ...settings, testimonials: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Bank / Designation</label>
                      <input
                        type="text"
                        value={t.designation}
                        onChange={(e) => {
                          const updated = [...settings.testimonials];
                          updated[idx].designation = e.target.value;
                          setSettings({ ...settings, testimonials: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Exam Cleared (e.g. JAIIB 84%)</label>
                    <input
                      type="text"
                      value={t.exam}
                      onChange={(e) => {
                        const updated = [...settings.testimonials];
                        updated[idx].exam = e.target.value;
                        setSettings({ ...settings, testimonials: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-emerald-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Student Feedback Quote</label>
                    <textarea
                      rows={2}
                      value={t.quote}
                      onChange={(e) => {
                        const updated = [...settings.testimonials];
                        updated[idx].quote = e.target.value;
                        setSettings({ ...settings, testimonials: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Avatar / Photo URL</label>
                    <input
                      type="text"
                      value={t.image}
                      onChange={(e) => {
                        const updated = [...settings.testimonials];
                        updated[idx].image = e.target.value;
                        setSettings({ ...settings, testimonials: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 8: FAQS & HELP
        ---------------------------------------------------- */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-[#0B1E3D]">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500">
                  Manage student FAQs shown across course details and help sections.
                </p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {settings.faqs?.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#1769D2]">QUESTION #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const updated = [...settings.faqs];
                      updated[idx].question = e.target.value;
                      setSettings({ ...settings, faqs: updated });
                    }}
                    placeholder="Enter question here..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = [...settings.faqs];
                      updated[idx].answer = e.target.value;
                      setSettings({ ...settings, faqs: updated });
                    }}
                    placeholder="Enter comprehensive answer..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ========================================================
          4. BOTTOM STICKY SAVE BAR
      ======================================================== */}
      <div className="shrink-0 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#12356B] hover:bg-[#0e2a56] active:scale-95 text-white text-sm font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Publishing Changes...' : 'Save & Synchronize All Settings'}
        </button>
      </div>
    </div>
  );
};
