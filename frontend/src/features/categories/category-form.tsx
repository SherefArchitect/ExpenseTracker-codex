import { useText } from '@/i18n/locale-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryApiError, type Category, type CategoryNames } from './types';
import { categoryNamesSchema } from './validation';

interface Props {
  category: Category | null;
  saving: boolean;
  save: (names: CategoryNames, id?: number) => Promise<void>;
  close: () => void;
}
export function CategoryForm({ category, saving, save, close }: Props) {
  const t = useText();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryNames>({
    resolver: zodResolver(categoryNamesSchema),
    defaultValues: {
      nameEn: category?.nameEn ?? '',
      nameAr: category?.nameAr ?? '',
    },
  });
  const pending = saving || isSubmitting;
  async function submit(names: CategoryNames) {
    try {
      await save(names, category?.id);
      close();
    } catch (cause) {
      const failure =
        cause instanceof CategoryApiError
          ? cause
          : new CategoryApiError('server.error');
      for (const field of ['nameEn', 'nameAr'] as const) {
        const code = failure.fields[field]?.[0];
        if (code) setError(field, { message: code }, { shouldFocus: true });
      }
      setError('root', { message: failure.code });
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) close();
      }}
    >
      <DialogContent showCloseButton={false} aria-busy={pending}>
        <DialogHeader>
          <DialogTitle>
            {t(category ? 'categories.edit' : 'categories.add')}
          </DialogTitle>
          <DialogDescription>
            {t('categories.formDescription')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {(['nameEn', 'nameAr'] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{t('categories.' + field)}</Label>
              <Input
                {...register(field)}
                id={field}
                lang={field === 'nameEn' ? 'en' : 'ar'}
                dir={field === 'nameEn' ? 'ltr' : 'rtl'}
                required
                maxLength={100}
                disabled={pending}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? field + '-error' : undefined}
              />
              {errors[field]?.message && (
                <p
                  id={field + '-error'}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {t(errors[field].message!)}
                </p>
              )}
            </div>
          ))}
          {errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {t(errors.root.message)}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={close}
            >
              {t('categories.cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {t(pending ? 'categories.saving' : 'categories.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
