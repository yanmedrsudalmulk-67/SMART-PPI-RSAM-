/**
 * Robust Scroll-to-Top Utility for SMART-PPI Dashboard
 * Handles multi-device (Mobile, Tablet, Desktop) and Next.js / Tailwind layouts
 * where scroll may be on <main>, window, documentElement, body, or custom container.
 */
export const forceScrollToTop = () => {
  if (typeof window === 'undefined') return;

  const performReset = () => {
    const scrollables = document.querySelectorAll(
      'main, html, body, #__next, [data-scroll-container], .overflow-y-auto, .overflow-y-scroll'
    );

    scrollables.forEach((el) => {
      if (el instanceof HTMLElement && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
        el.style.scrollBehavior = 'auto';
        el.scrollTop = 0;
        el.scrollLeft = 0;
        try {
          el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch (_) {}
      }
    });

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch (_) {}
    
    // Fallback: create a temporary anchor at the absolute top of the page and scroll it into view
    try {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        const anchor = document.createElement('div');
        anchor.style.position = 'absolute';
        anchor.style.top = '0';
        anchor.style.left = '0';
        anchor.style.width = '1px';
        anchor.style.height = '1px';
        anchor.style.pointerEvents = 'none';
        anchor.style.visibility = 'hidden';
        mainEl.prepend(anchor);
        anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
        mainEl.removeChild(anchor);
      }
    } catch (e) {}
  };

  // Execute synchronously
  performReset();

  // Execute on next paint & staggered timeouts
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      performReset();
      setTimeout(performReset, 10);
      setTimeout(performReset, 40);
      setTimeout(performReset, 100);
      setTimeout(performReset, 250);
      setTimeout(performReset, 500);
    });
  }
};
