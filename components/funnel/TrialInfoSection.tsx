'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wallet, BookOpen, HelpCircle } from 'lucide-react';
import { TrialInfoDialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const TRIAL_INFO_IDS = [
  { id: 'payment', icon: Wallet },
  { id: 'program', icon: BookOpen },
  { id: 'how-lessons', icon: HelpCircle },
] as const;

type TrialInfoId = (typeof TRIAL_INFO_IDS)[number]['id'];

function buildPricingBody(t: (key: string) => string): string {
  const base = 'pricing';
  return [
    t(`${base}.trialFree`),
    t(`${base}.noCard`),
    t(`${base}.afterTrial`),
    `${t(`${base}.programPrice`)}\n${t(`${base}.priceAmount`)}`,
    `${t(`${base}.includes`)}\n\n• ${t(`${base}.bullet1`)}\n• ${t(`${base}.bullet2`)}\n• ${t(`${base}.bullet3`)}\n• ${t(`${base}.bullet4`)}`,
    t(`${base}.noContract`),
  ].join('\n\n');
}

function buildProgramBody(t: (key: string) => string): string {
  const base = 'program';
  return [
    t(`${base}.intro`),
    `${t(`${base}.eachClass`)}\n\n• ${t(`${base}.bullet1`)}\n• ${t(`${base}.bullet2`)}\n• ${t(`${base}.bullet3`)}\n• ${t(`${base}.bullet4`)}`,
    t(`${base}.levels`),
  ].join('\n\n');
}

function buildHowItWorksBody(t: (key: string) => string): string {
  const base = 'howItWorks';
  return [
    `1. ${t(`${base}.step1`)}\n2. ${t(`${base}.step2`)}\n3. ${t(`${base}.step3`)}\n4. ${t(`${base}.step4`)}`,
    t(`${base}.frequency`),
    t(`${base}.observe`),
  ].join('\n\n');
}

function InfoItemCard({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Wallet;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 flex-1 min-h-[44px] py-2 px-2',
        'rounded-lg border border-slate-200/60 bg-slate-50/50',
        'hover:border-slate-300 hover:bg-slate-100/80 active:bg-slate-200/60',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7daf41]/40 focus-visible:ring-offset-1',
        'min-w-0 touch-manipulation'
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
      <span className="text-[11px] sm:text-xs font-medium text-slate-600 text-center leading-tight truncate min-w-0 flex-1">
        {label}
      </span>
    </button>
  );
}

function ModalBody({ body }: { body: string }) {
  const paragraphs = body.trim().split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
      {paragraphs.map((p, i) => {
        const isBullet = p.trim().startsWith('•') || /^\d+\./.test(p.trim());
        if (isBullet) {
          const items = p
            .split('\n')
            .map((line) => line.replace(/^[•\d.]\s*/, '').trim())
            .filter(Boolean);
          return (
            <ul key={i} className="list-none space-y-1.5 pl-0">
              {items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-[#7daf41] shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

export function TrialInfoSection() {
  const t = useTranslations('funnel.infoBar');
  const pathname = usePathname();
  const [openId, setOpenId] = useState<TrialInfoId | null>(null);

  const isConfirmed = pathname?.includes('/trial/confirmed') ?? false;
  const isPortal = pathname?.includes('/trial/portal') ?? false;
  if (isConfirmed || isPortal) return null;

  const getLabel = (id: TrialInfoId): string => {
    switch (id) {
      case 'payment':
        return t('labelPricing');
      case 'program':
        return t('labelProgram');
      case 'how-lessons':
        return t('labelHowItWorks');
      default:
        return '';
    }
  };

  const getTitle = (id: TrialInfoId): string => {
    switch (id) {
      case 'payment':
        return t('pricing.title');
      case 'program':
        return t('program.title');
      case 'how-lessons':
        return t('howItWorks.title');
      default:
        return '';
    }
  };

  const getBody = (id: TrialInfoId): string => {
    switch (id) {
      case 'payment':
        return buildPricingBody(t);
      case 'program':
        return buildProgramBody(t);
      case 'how-lessons':
        return buildHowItWorksBody(t);
      default:
        return '';
    }
  };

  return (
    <>
      <div
        className="pt-3 pb-2 border-b border-slate-200/60 mb-4"
        role="region"
        aria-label={t('regionAriaLabel')}
      >
        <div className="grid grid-cols-3 gap-2">
          {TRIAL_INFO_IDS.map((item) => (
            <InfoItemCard
              key={item.id}
              label={getLabel(item.id)}
              icon={item.icon}
              onClick={() => setOpenId(item.id)}
            />
          ))}
        </div>
      </div>

      {openId && (
        <TrialInfoDialog
          open={!!openId}
          onOpenChange={(open) => !open && setOpenId(null)}
          title={getTitle(openId)}
          sheetOnMobile
        >
          <ModalBody body={getBody(openId)} />
        </TrialInfoDialog>
      )}
    </>
  );
}
