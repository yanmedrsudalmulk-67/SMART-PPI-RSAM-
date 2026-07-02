import { useRouter as useNextRouter } from 'next/router';

export function useSafeRouter() {
  if (typeof window === 'undefined') {
    return mockRouter();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useNextRouter();
  return router || mockRouter();
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
