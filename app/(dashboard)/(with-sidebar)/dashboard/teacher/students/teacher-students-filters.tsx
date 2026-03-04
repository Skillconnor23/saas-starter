'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type ClassRow = { id: string; name: string };

type Props = {
  classes: ClassRow[];
  currentParams: { classId?: string; search?: string };
};

export function TeacherStudentsFilters({ classes, currentParams }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('teacher.filters');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const search = (form.elements.namedItem('search') as HTMLInputElement)?.value?.trim();
    const classId = (form.elements.namedItem('classId') as HTMLSelectElement)?.value;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (classId && classId !== 'all') params.set('classId', classId);
    router.push(`/${locale}/dashboard/teacher/students?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 mt-4">
      <div className="flex items-center gap-2">
        <Input
          name="search"
          placeholder={t('searchPlaceholder')}
          defaultValue={currentParams.search}
          className="w-48"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
          <span className="sr-only">{t('searchSrOnly')}</span>
        </Button>
      </div>
      <select
        name="classId"
        defaultValue={currentParams.classId ?? 'all'}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="all">{t('allClasses')}</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm">
        {t('apply')}
      </Button>
    </form>
  );
}
