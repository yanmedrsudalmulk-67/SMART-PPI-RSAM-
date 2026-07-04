import { useRouter as useNextRouter } from 'next/router';

export function useSafeRouter() {
  try {
    const router = useNextRouter();
    if (router) return router;
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
