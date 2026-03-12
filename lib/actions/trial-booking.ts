'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { trialBookings } from '@/lib/db/schema';
import { TRIAL_SLOTS_UTAH } from '@/lib/trial/config';
import { trackFunnelEvent } from '@/lib/actions/funnel-events';
import {
  findOrCreateTrialLeadByEmail,
  findOrCreateTrialLeadByPhone,
  createTrialAccessToken,
  updateTrialLeadStatus,
  updateTrialLeadPlacement,
} from '@/lib/actions/trial-leads';
import { clearPlacementCookies } from '@/lib/actions/level-check';
import { sendSmsViaUnimtx } from '@/lib/sms/unimtx';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

const LOG_PREFIX = '[trial-booking]';
const isDev = process.env.NODE_ENV === 'development';

function safeParseJson(raw: FormDataEntryValue | null): Record<string, unknown> | undefined {
  const str = raw != null ? String(raw).trim() : '';
  if (!str) return undefined;
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

const createTrialBookingSchema = z.object({
  fullName: z.string().min(1).max(200).trim(),
  phone: z
    .string()
    .min(1)
    .max(50)
    .trim()
    .refine(
      (v) => /^\+\d{8,15}$/.test(v),
      'Phone must be in international format starting with +'
    ),
  email: z.string().email().optional().or(z.literal('')),
  slotId: z.string().min(1).max(50),
  slotLabel: z.string().min(1),
  trialTime: z.string().optional(),
  recommendedLevel: z.string().optional(),
  learnerType: z.string().optional(),
  locale: z.string().optional(),
  questionnaireAnswers: z.record(z.unknown()).optional(),
  placementLevel: z.string().optional(),
  placementScore: z.string().optional(),
});

export type CreateTrialBookingInput = z.infer<typeof createTrialBookingSchema>;

export async function createTrialBookingAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  if (isDev) {
    console.log(LOG_PREFIX, 'server action entered');
  }

  const raw = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    email: formData.get('email') || undefined,
    slotId: formData.get('slotId'),
    slotLabel: formData.get('slotLabel'),
    trialTime: formData.get('trialTime') || undefined,
    recommendedLevel: formData.get('recommendedLevel') || undefined,
    learnerType: formData.get('learnerType') || undefined,
    locale: formData.get('locale') || undefined,
    questionnaireAnswers: safeParseJson(formData.get('questionnaireAnswers')),
    placementLevel: formData.get('placementLevel') || undefined,
    placementScore: formData.get('placementScore') || undefined,
  };

  if (isDev) {
    console.log(LOG_PREFIX, 'payload (sanitized):', {
      fullName: raw.fullName ? '(present)' : '(missing)',
      phone: raw.phone ? '(present)' : '(missing)',
      email: raw.email ? '(present)' : '(missing)',
      slotId: raw.slotId,
      slotLabel: raw.slotLabel ? '(present)' : '(missing)',
      trialTime: raw.trialTime ? '(present)' : '(missing)',
      recommendedLevel: raw.recommendedLevel,
      learnerType: raw.learnerType,
      locale: raw.locale,
      questionnaireAnswers: raw.questionnaireAnswers ? '(object)' : '(none)',
    });
  }

  const parsed = createTrialBookingSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = isDev
      ? `Validation failed: ${parsed.error.flatten().formErrors.join('; ')}`
      : 'Invalid input';
    if (isDev) {
      console.error(LOG_PREFIX, 'validation failed', parsed.error.flatten());
    }
    return { error: msg };
  }

  if (isDev) {
    console.log(LOG_PREFIX, 'validation success');
  }

  const slot = TRIAL_SLOTS_UTAH.find((s) => s.id === parsed.data.slotId);
  if (!slot) {
    if (isDev) {
      console.error(LOG_PREFIX, 'invalid slot id:', parsed.data.slotId);
    }
    return { error: isDev ? `Invalid slot: ${parsed.data.slotId}` : 'Invalid slot' };
  }

  let redirectUrl: string | null = null;

  try {
    const trialTime = parsed.data.trialTime
      ? new Date(parsed.data.trialTime)
      : null;

    if (isDev) {
      console.log(LOG_PREFIX, 'find/create trial lead start');
    }

    let trialLeadId: string;
    if (parsed.data.email?.trim()) {
      const { lead, created } = await findOrCreateTrialLeadByEmail(parsed.data.email.trim(), {
        name: parsed.data.fullName,
        phone: parsed.data.phone,
        learnerType: parsed.data.learnerType ?? undefined,
        locale: parsed.data.locale ?? undefined,
        selfSelectedLevel: parsed.data.recommendedLevel ?? undefined,
        recommendedLevel: parsed.data.recommendedLevel ?? undefined,
      });
      trialLeadId = lead.id;
      if (isDev) {
        console.log(LOG_PREFIX, 'find/create trial lead by email:', created ? 'created' : 'existing', lead.id);
      }
    } else {
      const { lead, created } = await findOrCreateTrialLeadByPhone(parsed.data.phone, {
        name: parsed.data.fullName,
        learnerType: parsed.data.learnerType ?? undefined,
        locale: parsed.data.locale ?? undefined,
        selfSelectedLevel: parsed.data.recommendedLevel ?? undefined,
        recommendedLevel: parsed.data.recommendedLevel ?? undefined,
      });
      trialLeadId = lead.id;
      if (isDev) {
        console.log(LOG_PREFIX, 'find/create trial lead by phone:', created ? 'created' : 'existing', lead.id);
      }
    }

    if (isDev) {
      console.log(LOG_PREFIX, 'update trial lead status -> trial_booked');
    }
    await updateTrialLeadStatus(trialLeadId, 'trial_booked');

    // If user came from placement test (cookie), attach placement to trial lead and clear cookies
    const placementLevel = parsed.data.placementLevel?.trim();
    const placementScoreRaw = parsed.data.placementScore?.trim();
    const placementScore = placementScoreRaw ? parseInt(placementScoreRaw, 10) : undefined;
    if (placementLevel && !Number.isNaN(placementScore ?? NaN)) {
      try {
        await updateTrialLeadPlacement(trialLeadId, {
          placementLevel,
          placementScore: placementScore ?? 0,
        });
        await clearPlacementCookies();
      } catch (e) {
        if (isDev) console.warn(LOG_PREFIX, 'placement attach failed:', e);
      }
    }

    if (isDev) {
      console.log(LOG_PREFIX, 'db.insert(trialBookings) start');
    }
    await db.insert(trialBookings).values({
      trialLeadId,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      slotId: parsed.data.slotId,
      slotLabel: parsed.data.slotLabel,
      trialTime,
      recommendedLevel: parsed.data.recommendedLevel || null,
      learnerType: parsed.data.learnerType || null,
      locale: parsed.data.locale || null,
      questionnaireAnswers: parsed.data.questionnaireAnswers
        ? (parsed.data.questionnaireAnswers as Record<string, unknown>)
        : null,
      updatedAt: new Date(),
    });
    if (isDev) {
      console.log(LOG_PREFIX, 'db.insert(trialBookings) success');
    }

    const locale = (await getLocale()) || 'en';

    if (isDev) {
      console.log(LOG_PREFIX, 'createTrialAccessToken start');
    }
    const { token } = await createTrialAccessToken(trialLeadId);
    if (isDev) {
      console.log(LOG_PREFIX, 'createTrialAccessToken success');
    }

    // Fire-and-forget confirmation SMS. Booking must still succeed even if SMS fails.
    try {
      const base =
        process.env.APP_BASE_URL ||
        process.env.BASE_URL ||
        '';
      const portalBase = base.replace(/\/+$/, '');
      const portalPath = `/${locale}/trial/portal?token=${token}`;
      const portalLink = portalBase ? `${portalBase}${portalPath}` : portalPath;

      const lines = [
        'Сайн байна уу?',
        '',
        'This is Gecko Academy.',
        'Your English trial class is confirmed.',
        '',
        'See details:',
        portalLink,
      ];
      const smsText = lines.join('\n');

      // Do not await; allow booking redirect to proceed.
      void sendSmsViaUnimtx(parsed.data.phone, smsText);
    } catch (e) {
      if (isDev) {
        console.warn(LOG_PREFIX, 'SMS send failed (non-blocking):', e);
      }
    }

    await trackFunnelEvent(
      'trial_booked',
      {
        slotId: parsed.data.slotId,
        learnerType: parsed.data.learnerType,
        level: parsed.data.recommendedLevel,
      },
      parsed.data.locale ?? undefined
    );
    const params = new URLSearchParams({
      name: parsed.data.fullName,
      slot: parsed.data.slotLabel,
      phone: parsed.data.phone,
      token,
    });
    if (parsed.data.email) params.set('email', parsed.data.email);
    redirectUrl = `/${locale}/trial/confirmed?${params.toString()}`;
    if (isDev) {
      console.log(LOG_PREFIX, 'redirect URL built:', redirectUrl);
    }
  } catch (e) {
    // Next.js redirect() throws a special error; rethrow so it is not treated as a booking failure.
    const digest = typeof e === 'object' && e !== null && 'digest' in e ? (e as { digest?: string }).digest : undefined;
    if (digest === 'NEXT_REDIRECT') {
      throw e;
    }
    const err = e instanceof Error ? e : new Error(String(e));
    const message = err.message;
    const stack = err.stack;
    console.error(LOG_PREFIX, 'FAILED:', message);
    console.error(LOG_PREFIX, 'stack:', stack);
    const userMessage = isDev
      ? `Booking failed: ${message}`
      : 'Booking failed. Please try again.';
    return { error: userMessage };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
  return { error: 'Booking failed. Please try again.' };
}
