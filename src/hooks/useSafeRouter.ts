import { useRouter as useNextRouter } from 'next/router';
import { useMemo } from 'react';

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

export function useSafeRouter() {
  const router = useNextRouter();

  return useMemo(() => {
    if (!router) return mockRouter();
    return {
      ...router,
      push: async (...args: Parameters<typeof router.push>) => {
        try {
          return await router.push(...args);
        } catch (err) {
          if (isAbortError(err)) {
            return false;
          }
          throw err;
        }
      },
      replace: async (...args: Parameters<typeof router.replace>) => {
        try {
          return await router.replace(...args);
        } catch (err) {
          if (isAbortError(err)) {
            return false;
          }
          throw err;
        }
      },
      prefetch: async (...args: Parameters<typeof router.prefetch>) => {
        try {
          return await router.prefetch(...args);
        } catch (err) {
          if (isAbortError(err)) {
            return undefined;
          }
          throw err;
        }
      },
    };
  }, [router]);
}

function mockRouter() {
  return {
    basePath: '',
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    back: () => {},
    beforePopState: () => {},
    prefetch: async () => undefined,
    push: async () => true,
    reload: () => {},
    replace: async () => true,
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: 'en',
    domainLocales: [],
    isPreview: false,
  } as any;
}
