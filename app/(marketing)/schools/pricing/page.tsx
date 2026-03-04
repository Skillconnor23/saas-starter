import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/Section";
import { schoolTiers } from "@/lib/pricing/tiers";
import { PricingCompareTable } from "@/components/pricing/PricingCompareTable";
import { PricingFAQ, type FAQItem } from "@/components/pricing/PricingFAQ";
import { PricingCtaBanner } from "@/components/pricing/PricingCtaBanner";
import { SchoolsPricingPageClient } from "./SchoolsPricingPageClient";

export default async function SchoolsPricingPage() {
  const t = await getTranslations("pricingSchools");
  const tCommon = await getTranslations("common.cta");
  const locale = await getLocale();
  const contactHref = `/${locale}/contact`;
  const studentPricingHref = `/${locale}/pricing`;
  const demoHref = contactHref;

  const schoolFaqs: FAQItem[] = [
    { id: "teachers", question: t("faq.q1"), answer: t("faq.a1") },
    { id: "demo", question: t("faq.q2"), answer: t("faq.a2") },
    { id: "platform-only", question: t("faq.q3"), answer: t("faq.a3") },
    { id: "training", question: t("faq.q4"), answer: t("faq.a4") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <Section className="pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#3d4236] sm:text-4xl md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-[#5a5f57]">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
            >
              <Link href={demoHref}>{t("heroPrimary")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/5"
            >
              <Link href={studentPricingHref}>{t("heroSecondary")}</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Billing toggle + Cards */}
      <SchoolsPricingPageClient tiers={schoolTiers} />

      {/* Compare plans */}
      <Section variant="alt" className="py-12 sm:py-16">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] sm:text-3xl">
          {t("compareTitle")}
        </h2>
        <div className="mt-8">
          <PricingCompareTable tiers={schoolTiers} />
        </div>
      </Section>

      {/* FAQ */}
      <Section className="py-12 sm:py-16">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] sm:text-3xl">
          {t("faqTitle")}
        </h2>
        <div className="mx-auto mt-10 max-w-2xl">
          <PricingFAQ items={schoolFaqs} />
        </div>
      </Section>

      {/* Final CTA */}
      <Section variant="alt" className="py-12 sm:py-16">
        <PricingCtaBanner
          headline={t("finalCta.headline")}
          subline={t("finalCta.subline")}
          primaryLabel={t("finalCta.primary")}
          primaryHref={demoHref}
          secondaryLabel={tCommon("contactUs")}
          secondaryHref={contactHref}
          accentColor="#7daf41"
        />
      </Section>
    </div>
  );
}
