import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, CheckCircle2, ArrowRight, PlayCircle, Sparkles, Star, Users } from 'lucide-react';

export const CourseCard = ({ course }) => {
  const isBankersPath = course.division === 'BANKERS_PATH';
  const discountPercent = course.originalPrice && course.originalPrice > course.fee
    ? Math.round(((course.originalPrice - course.fee) / course.originalPrice) * 100)
    : null;

  // High quality relevant stock imagery fallback based on course title
  const getRelevantImage = () => {
    if (course.thumbnail) return course.thumbnail;
    const title = (course.title || '').toUpperCase();
    if (title.includes('JAIIB')) {
      return 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop';
    }
    if (title.includes('CAIIB')) {
      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop';
    }
    if (title.includes('BANKING') || title.includes('IBPS') || title.includes('SBI')) {
      return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1.5 relative">
      {/* Thumbnail Banner */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
        <img
          src={getRelevantImage()}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-95"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

        {/* Division & Demo Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md text-white backdrop-blur-md ${
            isBankersPath ? 'bg-[#1769D2]/90 border border-blue-300/30' : 'bg-[#0B1E3D]/90 border border-white/20'
          }`}>
            {course.categoryId?.name || (isBankersPath ? "Banker's Path" : "Competitive Exam")}
          </span>

          {course.isDemoEligible && (
            <span className="bg-[#F4B942] text-[#0B1E3D] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
              <PlayCircle className="w-3 h-3" /> Free Demo
            </span>
          )}
        </div>

        {/* Star Rating & Mode Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
            {course.mode === 'BOTH' ? 'Online + Offline' : `${course.mode} Mode`}
          </span>

          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/10">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>4.9 (480+)</span>
          </div>
        </div>
      </div>

      {/* Course Details Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-black text-[#0B1E3D] font-heading group-hover:text-[#1769D2] transition-colors line-clamp-2 leading-snug mb-2">
            <Link to={`/courses/${course.slug}`}>{course.title}</Link>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {course.shortDescription}
          </p>

          {/* Metadata badges */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 mb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#1769D2]" />
              <span className="font-bold truncate">{course.duration || '3 Months'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1769D2]" />
              <span className="font-bold truncate">{course.batchSchedule?.split('&')[0] || 'Live Batches'}</span>
            </div>
          </div>
        </div>

        {/* Price and CTA Actions */}
        <div className="pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline justify-between mb-3.5">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tuition Fee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#0B1E3D]">₹{(course.fee ?? course.price ?? 0).toLocaleString('en-IN')}</span>
                {course.originalPrice && course.originalPrice > (course.fee ?? course.price ?? 0) && (
                  <span className="text-xs text-slate-400 line-through">₹{course.originalPrice?.toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
            {discountPercent && (
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/courses/${course.slug}`}
              className="w-full text-center py-2.5 px-3 rounded-xl bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm hover:scale-102"
            >
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to={course.isDemoEligible ? `/courses/${course.slug}#demo` : `/enquiry?course=${encodeURIComponent(course.title)}`}
              className="w-full text-center py-2.5 px-3 rounded-xl bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#1769D2] border border-[#1769D2]/30 text-xs font-black transition-all flex items-center justify-center gap-1"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Free Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
