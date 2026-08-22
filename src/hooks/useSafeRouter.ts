import { useRouter as useNextRouter } from 'next/router';

function isAbortError(err: any) {
  if (!err) return false;
  if (err.cancelled) return true;
  if (err.name === 'AbortError') return true;
  const msg = typeof err === 'string' ? err : err?.message;
  if (typeof msg === 'string') {
    if (
      msg.includes('Abort fetching component') ||
      msg.includes('Route Cancelled') ||
      msg.includes('cancelled')
    ) {
      return true;
    }
  }
  return false;
}

export function useSafeRouter() {
  try {
    const router = useNextRouter();
    if (router) {
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
    }
  } catch (e) {
    // Fallback to mock router if called outside Next.js context
  }
  return mockRouter();
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
