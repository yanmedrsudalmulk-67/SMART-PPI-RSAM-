import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Poppins } from 'next/font/google';
import { AppProvider } from '@/components/Providers';
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans' 
});

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <AppProvider>
      <main className={`${poppins.variable} font-sans overflow-x-hidden`}>
        {getLayout(<Component {...pageProps} />)}
      </main>
    </AppProvider>
  );
}
