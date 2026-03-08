import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { getUser } from '@/lib/db/queries';
import { canAccessStudentReport, getMonthlyReportData } from '@/lib/reports/monthly-progress-report';
import { renderMonthlyReportHtml } from '@/lib/reports/monthly-progress-html';
import { getMonthlyReportLabels, formatMonthLabelForLocale } from '@/lib/reports/report-labels';
import { getGeckoLogoDataUrl } from '@/lib/reports/logo';
import type { Locale } from '@/lib/i18n/config';
import { isLocale } from '@/lib/i18n/config';

const LOG_PREFIX = '[Report PDF]';
const isDev = process.env.NODE_ENV === 'development';

function log(step: string, detail?: string | number | boolean) {
  const msg = detail !== undefined ? `${LOG_PREFIX} ${step} ${detail}` : `${LOG_PREFIX} ${step}`;
  console.log(msg);
}

function logError(step: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`${LOG_PREFIX} ERROR at ${step}:`, message);
  if (stack) console.error(`${LOG_PREFIX} stack:`, stack);
  if (err instanceof Error && (err as NodeJS.ErrnoException).code) {
    console.error(`${LOG_PREFIX} code:`, (err as NodeJS.ErrnoException).code);
  }
  const executableMsg = /executable|doesn't exist|ENOENT|not found/i.exec(message);
  if (executableMsg) {
    console.error(
      `${LOG_PREFIX} Chromium may not be installed. Run: pnpm exec playwright install chromium`
    );
  }
}

/** Serialize error for safe JSON response (dev only). */
function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId: studentIdParam } = await context.params;
  log('1. params', `studentId=${studentIdParam}`);

  const studentId = parseInt(studentIdParam, 10);
  if (isNaN(studentId) || studentId <= 0) {
    log('1. params invalid', 'bad studentId');
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  const month = request.nextUrl.searchParams.get('month') ?? '';
  const monthMatch = /^\d{4}-\d{2}$/.exec(month);
  if (!monthMatch) {
    log('1. params invalid', 'missing or bad month');
    return NextResponse.json(
      { error: 'Missing or invalid month (use YYYY-MM)' },
      { status: 400 }
    );
  }
  const monthKey = monthMatch[0];
  const localeParam = request.nextUrl.searchParams.get('locale') ?? 'en';
  const locale: Locale = isLocale(localeParam) ? localeParam : 'en';
  log('1. params ok', `month=${monthKey} locale=${locale}`);

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let permission;
  try {
    permission = await canAccessStudentReport(studentId);
    log('2. permission', permission.allowed ? 'allowed' : permission.error);
  } catch (err) {
    logError('2. permission', err);
    return NextResponse.json(
      {
        error: 'Permission check failed',
        ...(isDev && { detail: errorDetail(err) }),
      },
      { status: 500 }
    );
  }
  if (!permission.allowed) {
    return NextResponse.json(
      { error: permission.error ?? 'Forbidden' },
      { status: 403 }
    );
  }

  let data;
  try {
    data = await getMonthlyReportData(studentId, monthKey);
    log('3. report data', data ? 'loaded' : 'null');
  } catch (err) {
    logError('3. report data', err);
    return NextResponse.json(
      {
        error: 'Failed to load report data',
        ...(isDev && { detail: errorDetail(err) }),
      },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  data.monthLabel = formatMonthLabelForLocale(locale, monthKey);

  let labels;
  try {
    labels = getMonthlyReportLabels(locale);
    log('4. labels', 'loaded');
  } catch (err) {
    logError('4. labels', err);
    return NextResponse.json(
      {
        error: 'Failed to load labels',
        ...(isDev && { detail: errorDetail(err) }),
      },
      { status: 500 }
    );
  }

  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await getGeckoLogoDataUrl();
    log('5. logo', logoDataUrl ? 'loaded' : 'missing');
  } catch (err) {
    logError('5. logo', err);
  }

  let html: string;
  try {
    html = renderMonthlyReportHtml(data, labels, logoDataUrl);
    log('6. HTML rendered', `length=${html.length}`);
  } catch (err) {
    logError('6. HTML render', err);
    return NextResponse.json(
      {
        error: 'Failed to render report HTML',
        ...(isDev && { detail: errorDetail(err) }),
      },
      { status: 500 }
    );
  }

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 30000,
  };

  async function runPdfWithBrowser(
    launch: () => ReturnType<typeof chromium.launch>
  ): Promise<Buffer> {
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      return Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
          preferCSSPageSize: false,
        })
      );
    } finally {
      await browser.close();
    }
  }

  let pdfBuffer: Buffer;
  try {
    log('7. launching browser (Playwright Chromium)');
    try {
      pdfBuffer = await runPdfWithBrowser(() =>
        chromium.launch(launchOptions)
      );
      log('7–10. PDF generated', `size=${pdfBuffer.length}`);
    } catch (chromiumErr) {
      const msg = errorDetail(chromiumErr);
      const useSystemChrome = /executable|doesn't exist|ENOENT|not found/i.test(msg);
      if (useSystemChrome) {
        log('7. Playwright Chromium not found, trying system Chrome');
        try {
          pdfBuffer = await runPdfWithBrowser(() =>
            chromium.launch({ ...launchOptions, channel: 'chrome' })
          );
          log('7–10. PDF generated via system Chrome', `size=${pdfBuffer.length}`);
        } catch (chromeErr) {
          logError('7. system Chrome', chromeErr);
          throw chromiumErr;
        }
      } else {
        throw chromiumErr;
      }
    }
  } catch (err) {
    logError('7-10. PDF generation', err);
    const detail = errorDetail(err);
    const safeName = data.studentName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '-').trim() || 'student';
    const htmlFilename = `Monthly-Progress-Report-${safeName}-${monthKey}.html`;

    if (isDev) {
      return NextResponse.json(
        {
          error: 'Failed to generate PDF',
          detail,
          hint: /executable|doesn't exist|ENOENT/i.test(detail)
            ? 'Run: pnpm exec playwright install chromium'
            : undefined,
        },
        {
          status: 500,
          headers: { 'X-Report-PDF-Error': detail.slice(0, 200) },
        }
      );
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${htmlFilename}"`,
        'X-Report-Fallback': 'html',
        'X-Report-PDF-Error': detail.slice(0, 200),
      },
    });
  }

  const safeName = data.studentName.replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, '-').trim() || 'student';
  const filename = `Monthly-Progress-Report-${safeName}-${monthKey}.pdf`;
  log('11. responding PDF', filename);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
