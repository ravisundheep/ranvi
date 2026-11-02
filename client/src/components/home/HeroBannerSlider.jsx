import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// ========================================================
// 1. CLASSICAL PARLIAMENT / BANK BUILDING GRAPHIC (EXACT SVG)
// ========================================================
export const ClassicalBuildingGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Classical Pediment (Triangle Roof) */}
    <path d="M80 18 L18 50 L142 50 Z" fill="#FFFFFF" />
    {/* Architrave / Entablature */}
    <rect x="14" y="50" width="132" height="10" rx="2" fill="#FFFFFF" />
    {/* 5 Classical Columns */}
    <rect x="24" y="64" width="12" height="42" rx="2" fill="#FFFFFF" />
    <rect x="50" y="64" width="12" height="42" rx="2" fill="#FFFFFF" />
    <rect x="74" y="64" width="12" height="42" rx="2" fill="#FFFFFF" />
    <rect x="98" y="64" width="12" height="42" rx="2" fill="#FFFFFF" />
    <rect x="124" y="64" width="12" height="42" rx="2" fill="#FFFFFF" />
    {/* Steps / Stylobate Base */}
    <rect x="14" y="110" width="132" height="8" rx="2" fill="#FFFFFF" />
    <rect x="8" y="118" width="144" height="10" rx="2" fill="#F4B942" />
    {/* Golden Checkmark Badge on Pediment */}
    <circle cx="136" cy="22" r="13" fill="#F4B942" />
    <path
      d="M130 22 L134 26 L142 18"
      stroke="#0B2545"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ========================================================
// 2. BANKER'S PATH BUILDING GRAPHIC (WITH MORTARBOARD CAP)
// ========================================================
export const BankersBuildingGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Classical Pediment (Triangle Roof) */}
    <path d="M80 32 L20 54 L140 54 Z" fill="#FFFFFF" />
    {/* Architrave / Entablature */}
    <rect x="16" y="54" width="128" height="9" rx="2" fill="#FFFFFF" />
    {/* 4 Classical Columns matching reference */}
    <rect x="28" y="66" width="14" height="42" rx="2" fill="#FFFFFF" />
    <rect x="58" y="66" width="14" height="42" rx="2" fill="#FFFFFF" />
    <rect x="88" y="66" width="14" height="42" rx="2" fill="#FFFFFF" />
    <rect x="118" y="66" width="14" height="42" rx="2" fill="#FFFFFF" />
    {/* Steps / Stylobate Base */}
    <rect x="16" y="110" width="128" height="7" rx="2" fill="#FFFFFF" />
    <rect x="10" y="118" width="140" height="9" rx="2" fill="#F4B942" />
    {/* Golden Graduation Cap (Mortarboard) on Roof */}
    <path d="M58 24 C58 32 102 32 102 24 L102 28 C102 36 58 36 58 28 Z" fill="#FFFFFF" />
    <polygon points="80,8 122,22 80,36 38,22" fill="#F4B942" />
    <circle cx="80" cy="22" r="2.5" fill="#FFFFFF" />
    <path
      d="M82 22 C98 25 116 34 118 46"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="118" cy="48" r="3.5" fill="#F4B942" />
  </svg>
);

// ========================================================
// 3. ENTRANCE EXAMS OPEN BOOK & MORTARBOARD GRAPHIC
// ========================================================
export const EntranceBookCapGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Open Book / Geometric Wings Base matching reference */}
    <polygon points="78,76 18,94 18,114 78,98" fill="#FFFFFF" />
    <polygon points="78,76 18,94 78,86" fill="#EDE9FE" opacity="0.8" />
    <polygon points="82,76 142,94 142,114 82,98" fill="#DDD6FE" />
    <polygon points="82,76 142,94 82,86" fill="#C4B5FD" opacity="0.8" />
    {/* Base Line */}
    <polygon points="16,116 144,116 80,122" fill="#A78BFA" opacity="0.6" />
    {/* Cap Skull Pedestal */}
    <ellipse cx="80" cy="66" rx="30" ry="10" fill="#FFFFFF" />
    <path d="M50 66 L50 72 C50 82 110 82 110 72 L110 66 Z" fill="#F3E8FF" />
    {/* Golden Mortarboard Diamond Top */}
    <polygon points="80,32 134,50 80,68 26,50" fill="#F4B942" />
    <circle cx="80" cy="50" r="3.5" fill="#FFFFFF" />
    {/* Golden Tassel dangling to right with bead */}
    <path
      d="M83 50 C104 55 125 64 128 78"
      stroke="#F4B942"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="128" cy="82" r="4" fill="#F59E0B" />
  </svg>
);

// ========================================================
// SLIDES CONFIGURATION (EXACT MATCH TO REFERENCE & UPLOADS)
// ========================================================
export const BANNER_SLIDES = [
  {
    id: 'competitive-exams',
    division: 'COMPETITIVE_EXAMS',
    tag: 'Competitive Exams',
    title: 'Your Government Job Journey',
    subtitle: 'IBPS • SBI • RBI • SSC • RRB • LIC',
    gradient: 'from-[#009E60] via-[#059669] to-[#10B981]',
    glowColor: 'bg-emerald-300/20',
    tagBg: 'bg-white/20 text-white',
    subColor: 'text-emerald-100',
    link: '/competitive-exams',
    graphic: <ClassicalBuildingGraphic />,
  },
  {
    id: 'bankers-path',
    division: 'BANKERS_PATH',
    tag: "Banker's Path",
    title: 'Grow Your Banking Career',
    subtitle: 'JAIIB • CAIIB • DBF • DTM • NISM',
    gradient: 'from-[#0052CC] via-[#0D62D9] to-[#1E70EB]',
    glowColor: 'bg-blue-300/20',
    tagBg: 'bg-white/20 text-white',
    subColor: 'text-blue-100',
    link: '/bankers-path',
    graphic: <BankersBuildingGraphic />,
  },
  {
    id: 'entrance-exams',
    division: 'ENTRANCE_EXAMS',
    tag: 'Entrance Exams',
    title: 'Unlock Your Dream College',
    subtitle: 'JEE • NEET • CUET • EAPCET • CLAT • NDA',
    gradient: 'from-[#581C87] via-[#7C3AED] to-[#9333EA]',
    glowColor: 'bg-purple-300/20',
    tagBg: 'bg-white/20 text-white',
    subColor: 'text-purple-100',
    link: '/entrance-exams',
    graphic: <EntranceBookCapGraphic />,
  },
];

export const HeroBannerSlider = ({ autoPlayInterval = 3800 }) => {
  const slides = BANNER_SLIDES;
  const count = slides.length;

  // Clone first and last slide for seamless infinite loop:
  // [Slide 2 (clone), Slide 0, Slide 1, Slide 2, Slide 0 (clone)]
  const extendedSlides = [slides[count - 1], ...slides, slides[0]];

  // Extended index starts at 1 (real slide index 0)
  const [extendedIndex, setExtendedIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const autoPlayTimerRef = useRef(null);

  // Real index (0, 1, or 2) for indicator dots
  const realIndex =
    extendedIndex === 0
      ? count - 1
      : extendedIndex === count + 1
      ? 0
      : extendedIndex - 1;

  // Handle advancing next
  const handleNext = useCallback(() => {
    if (!isTransitionEnabled) return;
    setExtendedIndex((prev) => prev + 1);
  }, [isTransitionEnabled]);

  // Handle going prev
  const handlePrev = useCallback(() => {
    if (!isTransitionEnabled) return;
    setExtendedIndex((prev) => prev - 1);
  }, [isTransitionEnabled]);

  // Jump to specific slide from dots
  const handleDotClick = (targetRealIdx) => {
    setIsTransitionEnabled(true);
    setExtendedIndex(targetRealIdx + 1);
  };

  // Seamless boundary wrap when transition finishes
  const handleTransitionEnd = () => {
    if (extendedIndex === extendedSlides.length - 1) {
      // Reached the clone of Slide 0 -> instantly snap to real Slide 0 (index 1)
      setIsTransitionEnabled(false);
      setExtendedIndex(1);
    } else if (extendedIndex === 0) {
      // Reached the clone of Slide 2 -> instantly snap to real Slide 2 (index count)
      setIsTransitionEnabled(false);
      setExtendedIndex(count);
    }
  };

  // Re-enable transition smoothly after an instant snap
  useEffect(() => {
    if (!isTransitionEnabled) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitionEnabled]);

  // Auto-play infinite scroll timer
  useEffect(() => {
    if (isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, handleNext, autoPlayInterval]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const delta = touchDeltaXRef.current;
    if (delta < -45) {
      handleNext();
    } else if (delta > 45) {
      handlePrev();
    }
  };

  return (
    <section
      id="hero"
      className="scroll-mt-24 max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Highlights Banner Slider"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/40 bg-slate-900 group">
        {/* Infinite Sliding Reel */}
        <div
          className={`flex ${
            isTransitionEnabled
              ? 'transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]'
              : ''
          }`}
          style={{
            transform: `translateX(-${extendedIndex * 100}%)`,
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((slide, idx) => (
            <div
              key={`${slide.id}-${idx}`}
              className="w-full shrink-0 select-none"
            >
              <Link
                to={slide.link}
                className={`block rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white bg-gradient-to-r ${slide.gradient} relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden`}
              >
                {/* Ambient glow in corner */}
                <div
                  className={`absolute -right-10 -bottom-10 w-52 h-52 ${slide.glowColor} rounded-full blur-3xl pointer-events-none`}
                />

                {/* Left Slide Details */}
                <div className="space-y-2 relative z-10 max-w-xl">
                  <div
                    className={`inline-block ${slide.tagBg} backdrop-blur-xs text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider shadow-xs`}
                  >
                    {slide.tag}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black font-serif text-white tracking-tight leading-tight">
                    {slide.title}
                  </h1>
                  <p
                    className={`text-xs sm:text-sm font-bold ${slide.subColor} flex flex-wrap items-center gap-1.5 pt-0.5`}
                  >
                    {slide.subtitle.split('•').map((item, itemIdx, arr) => (
                      <React.Fragment key={itemIdx}>
                        <span>{item.trim()}</span>
                        {itemIdx < arr.length - 1 && <span>•</span>}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                {/* Right Vector Graphic matching reference */}
                <div className="relative z-10 shrink-0 hidden xs:block transition-transform duration-300 group-hover:scale-105">
                  {slide.graphic}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Prev & Next Navigation Chevrons (Hover/Tap visible) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-xs flex items-center justify-center opacity-75 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md focus:outline-hidden"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-xs flex items-center justify-center opacity-75 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md focus:outline-hidden"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        {/* Pagination Dots (Bottom-Center) */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(idx);
              }}
              className={`transition-all duration-300 rounded-full focus:outline-hidden ${
                realIndex === idx
                  ? 'w-6 h-1.5 bg-white shadow-xs'
                  : 'w-2 h-1.5 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBannerSlider;
