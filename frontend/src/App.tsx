import { LocaleProvider } from '@/i18n/locale-provider';
import { AppRouting } from '@/routing/app-routing';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="vite-theme"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <HelmetProvider>
        <BrowserRouter basename={BASE_URL}>
          <LocaleProvider>
            <Toaster />
            <AppRouting />
          </LocaleProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ThemeProvider>
  );
}
