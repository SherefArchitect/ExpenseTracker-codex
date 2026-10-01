import { useText } from '@/i18n/locale-provider';

export function Footer() {
  const t = useText();
  return (
    <footer className="footer">
      <div className="container py-5 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {t('app.name')}
      </div>
    </footer>
  );
}
