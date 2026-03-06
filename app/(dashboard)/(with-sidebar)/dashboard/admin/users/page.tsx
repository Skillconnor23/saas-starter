export const dynamic = 'force-dynamic';

import { requirePermission } from '@/lib/auth/permissions';
import { getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, GraduationCap, UserCog, Building2 } from 'lucide-react';

const hubCards = [
  {
    href: '/dashboard/admin/users/teachers',
    title: 'Teachers',
    description:
      'Manage teachers, view their profiles, and assign/remove classes.',
    icon: GraduationCap,
  },
  {
    href: '/dashboard/admin/users/students',
    title: 'Students',
    description:
      'View students, see their enrolled classes, and manage accounts.',
    icon: Users,
  },
  {
    href: '/dashboard/admin/users/school-admins',
    title: 'School Admins',
    description:
      'Manage school administrators and their assigned schools.',
    icon: Building2,
  },
  {
    href: '/dashboard/admin/users/all',
    title: 'All Users',
    description:
      'View all users across the platform with filtering by role and status.',
    icon: UserCog,
  },
];

export default async function AdminUsersHubPage() {
  await requirePermission(['classes:read', 'users:read']);
  const locale = await getLocale();

  const withLocale = (path: string) =>
    path.startsWith('/') ? `/${locale}${path}` : `/${locale}/${path}`;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-lg lg:text-2xl font-medium mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {hubCards.map((card) => (
            <Link key={card.href} href={withLocale(card.href)}>
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{card.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
