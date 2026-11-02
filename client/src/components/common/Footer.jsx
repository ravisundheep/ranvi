import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  BookOpen,
  ChevronRight,
  Sparkles,
  Smartphone,
  GraduationCap,
  FileCheck2,
  Trophy,
  Star,
  LayoutList,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppIcon, Instagram, Facebook, Youtube, Linkedin } from './SocialIcons';

export const Footer = () => {
  const { settings } = useSiteSettings();
  const contact = settings?.contactInfo || {
    address: 'Vijayawada, Andhra Pradesh',
    phone: '+91 98765 43210',
    email: 'admissions@ranviinstitutions.com',
  };

  return (
    <footer className="bg-[#06152B] text-slate-200 border-t border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* ========================================================
            1. CONVOCATION BANNER MATCHING EXACT REFERENCE IMAGE
        ======================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-blue-400/20 bg-[#0E2849]">
          <img
            src="/assets/hero-banner.png"
            alt="Ranvi Institutions Admissions & Batches"
            onError={(e) => {
              e.currentTarget.src = '/hero-banner.png';
            }}
            className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl"
          />
        </div>

        {/* ========================================================
            2. TWO COLUMNS: PROGRAMS & STUDENT PORTAL
        ======================================================== */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {/* Column 1: PROGRAMS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm uppercase tracking-wider">
              <span className="w-6 h-6 rounded-md bg-[#1976D2] flex items-center justify-center text-white text-xs shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Programs</span>
            </div>
            <ul className="divide-y divide-white/10 text-xs text-slate-300 font-medium">
              <li>
                <Link to="/" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Home</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>About Us</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/bankers-path" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Courses</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/bankers-path" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Pricing</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Contact Us</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: STUDENT PORTAL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm uppercase tracking-wider">
              <span className="w-6 h-6 rounded-md bg-[#1976D2] flex items-center justify-center text-white text-xs shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Student Portal</span>
            </div>
            <ul className="divide-y divide-white/10 text-xs text-slate-300 font-medium">
              <li>
                <Link to="/register" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Register</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Login</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/student/my-courses" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>My Courses</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/student/live-classes" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Live Classes</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/student/mock-tests" className="flex items-center justify-between py-2.5 hover:text-[#F4B942] transition-colors">
                  <span>Mock Tests</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================
            3. CONTACT & SUPPORT SECTION (EXACT REFERENCE UI)
        ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-xs sm:text-sm uppercase tracking-wider">
            <span className="w-6 h-6 rounded-md bg-[#1976D2] flex items-center justify-center text-white text-xs shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </span>
            <span>Contact & Support</span>
          </div>

          <div className="bg-[#0B1E38] rounded-2xl p-4 sm:p-5 border border-blue-900/50 space-y-3 text-xs shadow-md">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                Location & Campus
              </span>
              <span className="text-white font-bold text-xs block leading-relaxed">
                {contact.address || 'Vijayawada, Andhra Pradesh'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Ranvi Knowledge Tower, MG Road Coaching Hub
              </span>
            </div>

            <div className="border-t border-white/5 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                  Call / WhatsApp
                </span>
                <a
                  href={`tel:${contact.phone?.replace(/[^0-9+]/g, '')}`}
                  className="text-white font-extrabold text-sm hover:text-[#F4B942] transition-colors"
                >
                  {contact.phone || '+91 98765 43210'}
                </a>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                  Email
                </span>
                <a
                  href={`mailto:${contact.email || 'admissions@ranviinstitutions.com'}`}
                  className="text-white font-bold text-xs hover:text-[#F4B942] transition-colors"
                >
                  {contact.email || 'admissions@ranviinstitutions.com'}
                </a>
              </div>
            </div>

            <div className="border-t border-white/5 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                Working Hours
              </span>
              <span className="text-slate-300 font-medium text-xs">
                {contact.workingHours || 'Mon - Sat: 8:00 AM - 8:00 PM'}
              </span>
            </div>
          </div>

          {/* Connect With Us (Clean Social Buttons with Authentic SVG / Lucide Icons) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-400 block">Connect with us:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <a
                href={
                  settings?.socialLinks?.whatsapp ||
                  `https://wa.me/${contact.phone?.replace(/[^0-9]/g, '') || '919876543210'}`
                }
                target="_blank"
                rel="noreferrer"
                aria-label="Connect with us on WhatsApp"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1E38] hover:bg-[#25D366]/20 border border-white/10 hover:border-[#25D366]/50 text-slate-200 text-xs font-bold transition-all shadow-xs group"
              >
                <span className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="truncate">WhatsApp</span>
              </a>

              {/* YouTube */}
              <a
                href={settings?.socialLinks?.youtube || 'https://youtube.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Watch Ranvi Institutions on YouTube"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1E38] hover:bg-[#FF0000]/20 border border-white/10 hover:border-[#FF0000]/50 text-slate-200 text-xs font-bold transition-all shadow-xs group"
              >
                <span className="w-6 h-6 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                  <Youtube className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="truncate">YouTube</span>
              </a>

              {/* Instagram */}
              <a
                href={settings?.socialLinks?.instagram || 'https://instagram.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow Ranvi Institutions on Instagram"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1E38] hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/50 text-slate-200 text-xs font-bold transition-all shadow-xs group"
              >
                <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                  <Instagram className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="truncate">Instagram</span>
              </a>

              {/* Facebook */}
              <a
                href={settings?.socialLinks?.facebook || 'https://facebook.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Like Ranvi Institutions on Facebook"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0B1E38] hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/50 text-slate-200 text-xs font-bold transition-all shadow-xs group"
              >
                <span className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                  <Facebook className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="truncate">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================
            4. 4 TRUST BADGES IN 2x2 GRID MATCHING REFERENCE
        ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1E38]/80 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#F4B942]" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Advanced Security</div>
              <div className="text-[10px] text-slate-400">Single Device Protection</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1E38]/80 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Instant Scoring</div>
              <div className="text-[10px] text-slate-400">Real-Time Performance</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1E38]/80 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Expert Faculty</div>
              <div className="text-[10px] text-slate-400">Live Zoom Classes</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1E38]/80 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white">Certified Courses</div>
              <div className="text-[10px] text-slate-400">IIBF & Govt Exam Curricula</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            5. LEGAL LINKS & COPYRIGHT
        ======================================================== */}
        <div className="border-t border-white/10 pt-6 text-center space-y-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-semibold uppercase tracking-wider">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Sitemap</Link>
            <span>•</span>
            <Link to="/faq" className="hover:text-white transition-colors">FAQs</Link>
          </div>
          <p className="text-[10px] text-slate-500">
            © {new Date().getFullYear()} RANVI INSTITUTIONS. All rights reserved. Designed for excellence in competitive coaching.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
