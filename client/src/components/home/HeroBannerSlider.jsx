import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// ========================================================
// 1. CLASSICAL PARLIAMENT / BANK BUILDING GRAPHIC (EXACT SVG)
// ========================================================
export const ClassicalBuildingGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-full h-auto max-h-[85px] sm:max-h-[115px] md:max-h-[130px] shrink-0 drop-shadow-md select-none"
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
// 2. BANKER'S PATH BUILDING GRAPHIC (EXACT IMAGE 1 MATCH)
// ========================================================
export const BankersBuildingGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-full h-auto max-h-[85px] sm:max-h-[115px] md:max-h-[130px] shrink-0 drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* White Triangular Pediment Roof (Slopes down on both sides) */}
    <polygon points="80,18 16,52 144,52" fill="#FFFFFF" />

    {/* Architrave / Entablature (Horizontal white bar under pediment) */}
    <rect x="14" y="52" width="132" height="9" rx="1.5" fill="#FFFFFF" />

    {/* Golden Graduation Cap (Mortarboard) - Sits on top of the pediment */}
    <polygon points="80,22 126,37 80,52 34,37" fill="#F4B942" />

    {/* White Tassel String hanging from right tip of mortarboard */}
    <line x1="126" y1="37" x2="126" y2="52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    {/* Golden Bead at bottom of tassel */}
    <circle cx="126" cy="54" r="3.5" fill="#F4B942" />

    {/* 4 Classical White Columns */}
    <rect x="25" y="64" width="13" height="40" rx="1.5" fill="#FFFFFF" />
    <rect x="57" y="64" width="13" height="40" rx="1.5" fill="#FFFFFF" />
    <rect x="89" y="64" width="13" height="40" rx="1.5" fill="#FFFFFF" />
    <rect x="121" y="64" width="13" height="40" rx="1.5" fill="#FFFFFF" />

    {/* Golden Base Bar (Stylobate) */}
    <rect x="12" y="106" width="136" height="9" rx="2" fill="#F4B942" />
  </svg>
);

// ========================================================
// 3. ENTRANCE EXAMS OPEN BOOK & MORTARBOARD GRAPHIC (EXACT IMAGE 2 MATCH)
// ========================================================
export const EntranceBookCapGraphic = () => (
  <svg
    viewBox="0 0 160 130"
    className="w-full h-auto max-h-[85px] sm:max-h-[115px] md:max-h-[130px] shrink-0 drop-shadow-md select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Golden Mortarboard Diamond Top */}
    <polygon points="80,18 134,36 80,54 26,36" fill="#F4B942" />

    {/* White Cap Underside / Skull Band */}
    <path d="M50,47 C50,60 110,60 110,47 Z" fill="#FFFFFF" />

    {/* Center Button on Mortarboard */}
    <circle cx="80" cy="36" r="2.5" fill="#FFFFFF" />

    {/* Golden Tassel hanging from right tip down to a golden bead */}
    <line x1="134" y1="36" x2="134" y2="54" stroke="#F4B942" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="134" cy="58" r="4" fill="#F59E0B" />

    {/* Open 3D Book underneath: Left & Right Folded Pages */}
    {/* Left Wing */}
    <polygon points="80,68 18,84 18,104 80,88" fill="#FFFFFF" />
    <polygon points="80,68 18,84 80,76" fill="#F5F3FF" />
    {/* Right Wing */}
    <polygon points="80,68 142,84 142,104 80,88" fill="#EDE9FE" />
    <polygon points="80,68 142,84 80,76" fill="#DDD6FE" />
    {/* Spine Line */}
    <line x1="80" y1="68" x2="80" y2="104" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
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
    gradient: 'from-[#008A52] via-[#009E60] to-[#047857]',
    glowColor: 'bg-emerald-300/25',
    link: '/competitive-exams',
    graphic: <ClassicalBuildingGraphic />,
  },
  {
    id: 'bankers-path',
    division: 'BANKERS_PATH',
    tag: "Banker's Path",
    title: 'Grow Your Banking Career',
    subtitle: 'JAIIB • CAIIB • DBF • DTM • NISM',
    gradient: 'from-[#1258C2] via-[#1665D8] to-[#1769D2]',
    glowColor: 'bg-blue-300/25',
    link: '/bankers-path',
    graphic: <BankersBuildingGraphic />,
  },
  {
    id: 'entrance-exams',
    division: 'ENTRANCE_EXAMS',
    tag: 'Entrance Exams',
    title: 'Unlock Your Dream College',
    subtitle: 'JEE • NEET • CUET • EAPCET • CLAT • NDA',
    gradient: 'from-[#6D28D9] via-[#7C3AED] to-[#8B5CF6]',
    glowColor: 'bg-purple-300/25',
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
  const sliderTrackRef = useRef(null);

  // Real index (0, 1, or 2) for indicator dots
  const realIndex =
    extendedIndex === 0
      ? count - 1
      : extendedIndex === count + 1
      ? 0
      : extendedIndex - 1;

  // Handle advancing next
  const handleNext = useCallback(() => {
    setIsTransitionEnabled(true);
    setExtendedIndex((prev) => prev + 1);
  }, []);

  // Handle going prev
  const handlePrev = useCallback(() => {
    setIsTransitionEnabled(true);
    setExtendedIndex((prev) => prev - 1);
  }, []);

  // Jump to specific slide from dots
  const handleDotClick = (targetRealIdx) => {
    setIsTransitionEnabled(true);
    setExtendedIndex(targetRealIdx + 1);
  };

  // Seamless boundary wrap when transition finishes with DOM reflow guard
  const handleTransitionEnd = () => {
    const track = sliderTrackRef.current;
    if (extendedIndex === extendedSlides.length - 1) {
      // Reached the clone of Slide 0 -> instantly snap to real Slide 0 (index 1)
      if (track) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(-100%)';
        void track.offsetHeight; // Force reflow
      }
      setIsTransitionEnabled(false);
      setExtendedIndex(1);
      setTimeout(() => {
        if (track) track.style.transition = '';
        setIsTransitionEnabled(true);
      }, 40);
    } else if (extendedIndex === 0) {
      // Reached the clone of Slide 2 -> instantly snap to real Slide 2 (index count)
      if (track) {
        track.style.transition = 'none';
        track.style.transform = `translateX(-${count * 100}%)`;
        void track.offsetHeight; // Force reflow
      }
      setIsTransitionEnabled(false);
      setExtendedIndex(count);
      setTimeout(() => {
        if (track) track.style.transition = '';
        setIsTransitionEnabled(true);
      }, 40);
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
          ref={sliderTrackRef}
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
                className={`block rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 text-white bg-gradient-to-r ${slide.gradient} relative overflow-hidden flex items-center justify-between gap-3 sm:gap-4 cursor-pointer focus:outline-hidden min-h-[125px] sm:min-h-[145px] md:min-h-[160px]`}
              >
                {/* Ambient glow in bottom-right corner */}
                <div
                  className={`absolute -right-10 -bottom-10 w-52 h-52 ${slide.glowColor} rounded-full blur-3xl pointer-events-none`}
                />
                {/* Subtle top-right radial arc highlight matching reference */}
                <div
                  className="absolute right-0 top-0 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"
                />

                {/* Left Slide Details */}
                <div className="space-y-1 sm:space-y-1.5 relative z-10 flex-1 min-w-0 pr-1 sm:pr-2">
                  <div
                    className="text-[10px] sm:text-xs md:text-sm font-black text-white/95 uppercase tracking-wider drop-shadow-xs"
                  >
                    {slide.tag}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-serif text-white tracking-tight leading-tight drop-shadow-sm">
                    {slide.title}
                  </h1>
                  <p
                    className="text-[11px] sm:text-xs md:text-sm font-bold text-white flex flex-wrap items-center gap-1 sm:gap-1.5 pt-0.5 drop-shadow-xs"
                  >
                    {slide.subtitle.split('•').map((item, itemIdx, arr) => (
                      <React.Fragment key={itemIdx}>
                        <span>{item.trim()}</span>
                        {itemIdx < arr.length - 1 && <span className="opacity-80">•</span>}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                {/* Right Vector Graphic - ALWAYS visible on all screen sizes */}
                <div className="relative z-10 shrink-0 flex items-center justify-center w-20 sm:w-28 md:w-36 transition-transform duration-300 group-hover:scale-105">
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
