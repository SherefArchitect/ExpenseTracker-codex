import { useText } from '@/i18n/locale-provider';
import { Card, CardContent } from '@/components/ui/card';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';

export function HomePage() {
  const t = useText();
  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>{t('nav.home')}</ToolbarPageTitle>
        </ToolbarHeading>
      </Toolbar>
      <Card>
        <CardContent className="py-12">
          <h2 className="text-lg font-medium">{t('home.welcome')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('home.description')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
