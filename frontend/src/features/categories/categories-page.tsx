import { useState } from 'react';
import { useText } from '@/i18n/locale-provider';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryForm } from './category-form';
import { CategoryList } from './category-list';
import { CategoryApiError, type Category, type StatusFilter } from './types';
import { useCategories } from './use-categories';

export function CategoriesPage() {
  const t = useText();
  const categories = useCategories();
  const [editing, setEditing] = useState<Category | null | undefined>(
    undefined,
  );
  const [actionError, setActionError] = useState('');
  async function toggle(item: Category) {
    setActionError('');
    try {
      await categories.setActive(item);
    } catch (cause) {
      setActionError(
        cause instanceof CategoryApiError ? cause.code : 'server.error',
      );
    }
  }
  return (
    <div className="container space-y-6 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('categories.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('categories.description')}
          </p>
        </div>
        <Button
          type="button"
          disabled={categories.saving}
          onClick={() => setEditing(null)}
        >
          <Plus aria-hidden="true" />
          {t('categories.add')}
        </Button>
      </div>
      {import.meta.env.DEV && (
        <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          {t('categories.development')}
        </p>
      )}
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="grow space-y-2">
              <Label htmlFor="category-search">{t('categories.search')}</Label>
              <Input
                id="category-search"
                type="search"
                maxLength={100}
                placeholder={t('categories.searchPlaceholder')}
                value={categories.search}
                onChange={(event) => categories.setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:w-48">
              <Label htmlFor="category-status">{t('categories.filter')}</Label>
              <select
                id="category-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={categories.status}
                onChange={(event) =>
                  categories.setStatus(event.target.value as StatusFilter)
                }
              >
                <option value="all">{t('categories.all')}</option>
                <option value="active">{t('categories.active')}</option>
                <option value="inactive">{t('categories.inactive')}</option>
              </select>
            </div>
          </div>
          {categories.notice && (
            <p role="status" className="text-sm">
              {t(categories.notice)}
            </p>
          )}
          {categories.refreshFailed && (
            <p role="alert" className="text-sm text-destructive">
              {t('categories.refreshFailed')}
            </p>
          )}
          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {t(actionError)}
            </p>
          )}
          {categories.error && (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-destructive p-4"
            >
              <p>
                {t('categories.loadFailed')} {t(categories.error)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void categories.reload()}
              >
                {t('categories.retry')}
              </Button>
            </div>
          )}
          {categories.loading ? (
            <p role="status" className="py-8 text-center text-muted-foreground">
              {t('categories.loading')}
            </p>
          ) : (
            !categories.error &&
            (categories.items.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {t(
                  categories.hasFilters
                    ? 'categories.noMatches'
                    : 'categories.empty',
                )}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('categories.count', { count: categories.items.length })}
                </p>
                <CategoryList
                  items={categories.items}
                  saving={categories.saving}
                  edit={setEditing}
                  setActive={(item) => void toggle(item)}
                />
              </>
            ))
          )}
          <p className="text-sm text-muted-foreground">
            {t('categories.retirement')}
          </p>
        </CardContent>
      </Card>
      {editing !== undefined && (
        <CategoryForm
          key={editing?.id ?? 'new'}
          category={editing}
          saving={categories.saving}
          save={categories.save}
          close={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
