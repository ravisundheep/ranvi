import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollManager Component
 * 
 * Centralized scroll restoration & anchor navigation for React Router:
 * 1. On route change without hash: automatically scrolls to top (0, 0).
 * 2. On route change or anchor click with hash (#id): smoothly scrolls to the target
 *    element accounting for sticky navbar height (84px offset).
 * 3. Handles async rendered elements with retry mechanism.
 */
export const ScrollManager = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If hash is present (e.g. #coaching-programs, #contact, #pricing)
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
