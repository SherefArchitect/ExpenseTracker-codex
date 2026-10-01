import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { Direction } from 'radix-ui';
import { IntlProvider, useIntl } from 'react-intl';
import { messages } from './messages';

type Locale = 'en' | 'ar';
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({
  locale: 'en',
  setLocale: () => {},
});
function initialLocale(): Locale {
  try {
    return localStorage.getItem('expense-tracker-locale') === 'ar'
      ? 'ar'
      : 'en';
  } catch {
    return 'en';
  }
}
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('expense-tracker-locale', locale);
    } catch {
      /* Storage may be unavailable. */
    }
  }, [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        <Direction.Provider dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {children}
        </Direction.Provider>
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
export const useLocale = () => useContext(LocaleContext);
export function useText() {
  const intl = useIntl();
  return (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage(
      {
        id,
        defaultMessage:
          messages.en[id as keyof typeof messages.en] ??
          messages.en['server.error'],
      },
      values,
    );
}
