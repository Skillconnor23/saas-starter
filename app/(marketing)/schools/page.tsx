import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { TeacherCard } from "@/components/marketing/TeacherCard";
import {
  BookOpen,
  Users,
  BarChart3,
  LayoutDashboard,
  Globe,
  Library,
  FileText,
} from "lucide-react";

const PLATFORM_FEATURE_KEYS = [
  "localLanguageUi",
  "curriculumLibrary",
  "homework",
  "progress",
  "classManagement",
  "dashboard",
] as const;

const PLATFORM_FEATURE_ICONS = [
  Globe,
  Library,
  FileText,
  BarChart3,
  Users,
  LayoutDashboard,
] as const;

export default async function SchoolsPage() {
  const t = await getTranslations("marketing.schools");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const contactHref = `/${locale}/contact`;

  return (
    <div className="bg-white">
      {/* 1. HERO */}
      <MarketingSection className="pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-[#3d4236] md:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#5a5f57]">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                size="lg"
                className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
              >
                <Link href={contactHref}>{tNav("bookDemo")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/5 hover:text-[#429ead]"
              >
                <Link href="#platform">{t("heroSecondary")}</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 lg:max-w-[480px]">
            <Image
              src="/platform-dashboard-cta.svg"
              alt={t("platformImageAlt")}
              width={1500}
              height={1500}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
        </div>
      </MarketingSection>

      {/* 2. TRUST STRIP */}
      <MarketingSection className="py-12">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { icon: Globe, label: t("trust.localizedPlatform") },
            { icon: Users, label: t("trust.certifiedTeachers") },
            { icon: BookOpen, label: t("trust.structuredCurriculum") },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7daf41]/10">
                <item.icon className="h-5 w-5 text-[#7daf41]" />
              </div>
              <span className="font-medium text-[#3d4236]">{item.label}</span>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* 3. PROBLEM / SOLUTION */}
      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-[#429ead] p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              {t("problem.title")}
            </h2>
            <p className="mt-4 text-white">
              {t("problem.lead")}
            </p>
            <ul className="mt-6 space-y-3 text-white">
              {[
                t("problem.bullet1"),
                t("problem.bullet2"),
                t("problem.bullet3"),
                t("problem.bullet4"),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-white">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-[#7daf41] p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              {t("solution.title")}
            </h2>
            <p className="mt-4 text-white">{t("solution.lead")}</p>
            <ul className="mt-6 space-y-3 text-white">
              {[
                t("solution.bullet1"),
                t("solution.bullet2"),
                t("solution.bullet3"),
                t("solution.bullet4"),
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-white">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      {/* 4. HOW IT WORKS */}
      <MarketingSection>
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("howItWorks.title")}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { step: 1, text: t("howItWorks.step1") },
            { step: 2, text: t("howItWorks.step2") },
            { step: 3, text: t("howItWorks.step3") },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7daf41]/10 text-sm font-semibold text-[#7daf41]">
                {t("howItWorks.stepLabel", { step: item.step })}
              </span>
              <p className="mt-5 font-medium text-[#3d4236]">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
          >
            <Link href={contactHref}>{tNav("bookDemo")}</Link>
          </Button>
        </div>
      </MarketingSection>

      {/* 5. PLATFORM FEATURES */}
      <MarketingSection id="platform">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("platformFeatures.title")}
        </h2>
        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {PLATFORM_FEATURE_KEYS.map((key, i) => (
              <FeatureCard
                key={key}
                icon={PLATFORM_FEATURE_ICONS[i]}
                title={t(`platformFeatures.${key}.title`)}
                description={t(`platformFeatures.${key}.desc`)}
              />
            ))}
          </div>
          <div className="w-full shrink-0 lg:w-[420px]">
            <Image
              src="/schools-features.svg"
              alt={t("platformFeaturesImageAlt")}
              width={1500}
              height={1500}
              className="w-full h-auto"
              sizes="(max-width: 1024px) 100vw, 420px"
            />
          </div>
        </div>
      </MarketingSection>

      {/* 6. TEACHER ADD-ON */}
      <MarketingSection>
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("teacherAddon.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[#5a5f57]">
          {t("teacherAddon.subtitle")}
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3 justify-items-center">
          <TeacherCard
            name="Connor S."
            imageSrc="/teacher-connor-s.svg"
            credentials={t("teacherAddon.card.credentials")}
            languages={t("teacherAddon.card.languages")}
          />
          <TeacherCard
            name="Kay M."
            imageSrc="/teacher-kay-m.svg"
            credentials={t("teacherAddon.card.credentials")}
            languages={t("teacherAddon.card.languages")}
          />
          <TeacherCard
            name="Mason B."
            imageSrc="/teacher-mason-b.svg"
            credentials={t("teacherAddon.card.credentials")}
            languages={t("teacherAddon.card.languages")}
          />
        </div>
      </MarketingSection>

      {/* 7. CTA FOOTER */}
      <MarketingSection>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-md text-center sm:p-16">
          <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
            {t("footerCta.title")}
          </h2>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-[#7daf41] hover:bg-[#6b9a39] text-white"
          >
            <Link href={contactHref}>{tNav("bookDemo")}</Link>
          </Button>
        </div>
      </MarketingSection>
    </div>
  );
}
