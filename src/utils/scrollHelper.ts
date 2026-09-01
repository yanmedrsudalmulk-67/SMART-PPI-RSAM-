/**
 * Robust Scroll-to-Top Utility for SMART-PPI Dashboard
 * Handles multi-device (Mobile, Tablet, Desktop) and Next.js / Tailwind layouts
 * where scroll may be on <main>, window, documentElement, body, or custom container.
 */
export const forceScrollToTop = () => {
  if (typeof window === 'undefined') return;

  const performReset = () => {
    // 1. Dispatch custom event for DashboardLayout mainRef
    try {
      window.dispatchEvent(new CustomEvent('smart_ppi_scroll_top'));
    } catch (_) {}

    // 2. Query all potential scroll containers
    const scrollables = document.querySelectorAll(
      'main, html, body, #__next, [data-scroll-container], .overflow-y-auto, .overflow-y-scroll'
    );

    scrollables.forEach((el) => {
      if (el instanceof HTMLElement && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
        const prevBehavior = el.style.scrollBehavior;
        el.style.scrollBehavior = 'auto';
        el.scrollTop = 0;
        el.scrollLeft = 0;
        try {
          el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch (_) {}
        el.style.scrollBehavior = prevBehavior;
      }
    });

    // 3. Reset window & document scrolling
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch (_) {}
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 4. Fallback anchor scroll
    try {
      const mainEl = document.querySelector('main');
      if (mainEl && mainEl.scrollTop !== 0) {
        mainEl.scrollTop = 0;
      }
    } catch (_) {}
  };

  // Execute synchronously
  performReset();

  // Execute on staggered intervals during render/animations
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      performReset();
      const intervals = [15, 40, 80, 150, 250, 400, 600];
      intervals.forEach((delay) => {
        setTimeout(performReset, delay);
      });
    });
  }
};

