import { useText } from '@/i18n/locale-provider';
import { Helmet } from 'react-helmet-async';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';

export function Layout1() {
  const t = useText();
  return (
    <>
      <Helmet>
        <title>{t('app.name')}</title>
      </Helmet>

      <LayoutProvider>
        <Main />
      </LayoutProvider>
    </>
  );
}
