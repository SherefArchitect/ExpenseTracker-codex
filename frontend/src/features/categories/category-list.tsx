import { useText } from '@/i18n/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Category } from './types';

export function CategoryList({
  items,
  saving,
  edit,
  setActive,
}: {
  items: Category[];
  saving: boolean;
  edit: (item: Category) => void;
  setActive: (item: Category) => void;
}) {
  const t = useText();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('categories.nameEn')}</TableHead>
          <TableHead>{t('categories.nameAr')}</TableHead>
          <TableHead>{t('categories.status')}</TableHead>
          <TableHead>{t('categories.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="max-w-64 break-words">
              <span lang="en" dir="ltr" className="block text-left">
                {item.nameEn}
              </span>
            </TableCell>
            <TableCell className="max-w-64 break-words">
              <span lang="ar" dir="rtl" className="block text-right">
                {item.nameAr}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={item.isActive ? 'success' : 'secondary'}>
                {t(item.isActive ? 'categories.active' : 'categories.inactive')}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => edit(item)}
                >
                  {t('categories.editAction')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setActive(item)}
                >
                  {t(
                    item.isActive
                      ? 'categories.deactivate'
                      : 'categories.activate',
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
