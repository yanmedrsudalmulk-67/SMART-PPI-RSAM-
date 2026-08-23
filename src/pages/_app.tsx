import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Router from 'next/router';
import { Poppins } from 'next/font/google';
import { AppProvider } from '@/components/Providers';
import { NextPage } from 'next';
import { ReactElement, ReactNode, useEffect } from 'react';

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans' 
});

function isAbortError(err: any) {
  if (!err) return false;
  if (err.cancelled) return true;
  if (err.name === 'AbortError') return true;
  const str = String(
    err?.message || err?.reason?.message || err?.reason || err?.error || err || ''
  );
  return (
    str.includes('Abort fetching component') ||
    str.includes('Route Cancelled') ||
    str.includes('cancelled') ||
    str.includes('aborted') ||
    str.includes('AbortError')
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      if (
        isAbortError(event.reason) ||
        isAbortError(event.reason?.message) ||
        String(event.reason || '').includes('Abort fetching component')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      if (
        isAbortError(event.error) ||
        isAbortError(event.message) ||
        (event.message && String(event.message).includes('Abort fetching component'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  Router.events.on('routeChangeError', (err: any) => {
    if (isAbortError(err)) {
      // Silently ignore user-cancelled or aborted route changes
    }
  });
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  useEffect(() => {
    const handleRouteChangeError = (err: any) => {
      if (isAbortError(err)) {
        // Silently ignore
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (
        isAbortError(event.error) ||
        isAbortError(event.message) ||
        (event.message && String(event.message).includes('Abort fetching component'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        isAbortError(event.reason) ||
        isAbortError(event.reason?.message) ||
        String(event.reason || '').includes('Abort fetching component')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener('error', handleWindowError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    Router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      window.removeEventListener('error', handleWindowError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      Router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <AppProvider>
      <style jsx global>{`
        :root {
          --font-sans: ${poppins.style.fontFamily};
        }
        body {
          font-family: var(--font-sans);
        }
      `}</style>
      <main className={`${poppins.variable} font-sans overflow-x-hidden`}>
        {getLayout(
          <Component {...pageProps} />
        )}
      </main>
    </AppProvider>
  );
}
