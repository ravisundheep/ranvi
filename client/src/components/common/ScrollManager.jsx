import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/': 'RANVI INSTITUTIONS | Your Next Career Milestones — Banking & Competitive Exams Coaching',
  '/bankers-path': "Banker's Path — JAIIB, CAIIB, DBF, DTM & NISM Coaching | Ranvi Institutions",
  '/competitive-exams': 'Competitive Exams — IBPS, SBI, RBI, SSC & Railways Recruitment | Ranvi Institutions',
  '/entrance-exams': 'Entrance Exams — JEE, NEET, CUET, EAPCET & State CETs | Ranvi Institutions',
  '/tuition-programs': 'Tuitions & Academic Coaching Programs | Ranvi Institutions',
  '/mock-tests': 'Online Mock Tests & Real-Pattern Exam CBT Series | Ranvi Institutions',
  '/online-classes': 'Live Online Interactive Batches & Sessions | Ranvi Institutions',
  '/recorded-classes': 'Recorded Video Classes & PDF Study Notes | Ranvi Institutions',
  '/faculty': 'Expert Faculty Profiles & Subject Mentors | Ranvi Institutions',
  '/about': 'About Ranvi Institutions — Shape Your Future with Confidence',
  '/contact': 'Contact & Campus Support | Ranvi Institutions',
  '/enquiry': 'Enquiry & Free Demo Class Admission | Ranvi Institutions',
  '/notifications': 'Official Notifications & Exam Hall Ticket Updates | Ranvi Institutions',
  '/login': 'Student & Staff Secure Login | Ranvi Institutions',
  '/register': 'Student Admission Registration | Ranvi Institutions',
  '/checkout': 'Secure Online Payment Checkout | Ranvi Institutions',
  '/privacy-policy': 'Privacy Policy | Ranvi Institutions',
  '/terms-and-conditions': 'Terms & Conditions | Ranvi Institutions',
  '/refund-policy': 'Cancellation & Refund Policy | Ranvi Institutions',
};

/**
 * ScrollManager Component
 * 
 * Centralized scroll restoration, anchor navigation & technical SEO for React Router:
 * 1. On route change without hash: automatically scrolls to top (0, 0).
 * 2. On route change or anchor click with hash (#id): smoothly scrolls to the target
 *    element accounting for sticky navbar height (84px offset).
 * 3. Dynamically synchronizes document.title and robots meta tag (noindex on private portals).
 */
export const ScrollManager = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 1. Technical SEO: Synchronize document title
    if (ROUTE_TITLES[pathname]) {
      document.title = ROUTE_TITLES[pathname];
    } else if (pathname.startsWith('/student')) {
      document.title = 'Student Learning Portal | Ranvi Institutions';
    } else if (pathname.startsWith('/admin')) {
      document.title = 'Administrative Management Portal | Ranvi Institutions';
    } else if (pathname.startsWith('/courses/')) {
      // Dynamic course page title handled in page or fallback
      document.title = 'Course Curriculum & Batches | Ranvi Institutions';
    } else if (pathname.startsWith('/tuition-programs/')) {
      document.title = 'Tuition Coaching Program | Ranvi Institutions';
    }

    // 2. Technical SEO: Set robots tag (noindex on private or admin routes)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    const isPrivate = pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname === '/checkout';
    robotsMeta.setAttribute('content', isPrivate ? 'noindex, nofollow' : 'index, follow');

    // 3. Scroll restoration and anchor jumping
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      let attempts = 0;
      const maxAttempts = 10; // retry up to 500ms for lazy loaded or async content

      const scrollToElement = () => {
        const element = document.getElementById(targetId) || document.querySelector(hash);
        if (element) {
          const headerOffset = 84; // Navbar + sticky banner height
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = Math.max(0, elementPosition - headerOffset);

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
          return true;
        }
        return false;
      };

      // Try immediately
      if (!scrollToElement()) {
        const interval = setInterval(() => {
          attempts++;
          if (scrollToElement() || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 50);
        return () => clearInterval(interval);
      }
    } else {
      // Normal page navigation without hash: scroll immediately to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [pathname, search, hash]);

  return null;
};

export default ScrollManager;
