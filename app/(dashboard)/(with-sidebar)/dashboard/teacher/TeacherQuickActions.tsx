'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, Upload, Calendar, Users } from 'lucide-react';

export function TeacherQuickActions() {
  const t = useTranslations('teacher.dashboard');

  const actions = [
    {
      href: '/dashboard/homework',
      icon: BookOpen,
      labelKey: 'createHomework' as const,
    },
    {
      href: '/dashboard/teacher/curriculum/materials',
      icon: Upload,
      labelKey: 'uploadMaterials' as const,
    },
    {
      href: '/dashboard/teacher/schedule',
      icon: Calendar,
      labelKey: 'viewSchedule' as const,
    },
    {
      href: '/dashboard/teacher/students',
      icon: Users,
      labelKey: 'viewStudents' as const,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[#1f2937]">{t('quickActions')}</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ href, icon: Icon, labelKey }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#1f2937] transition-colors hover:border-[#429ead]/50 hover:bg-[#429ead]/5"
          >
            <Icon className="h-4 w-4 text-[#429ead]" aria-hidden />
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}
