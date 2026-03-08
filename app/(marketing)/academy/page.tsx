import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { STUDENT_TRIAL_HREF } from "@/lib/routes";
import { Card } from "@/components/ui/card";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { TeacherCard } from "@/components/marketing/TeacherCard";
import {
  Users,
  BookOpen,
  Mic2,
  Globe,
  FileText,
  Video,
  BookMarked,
  BarChart3,
  MessageCircle,
  Calendar,
} from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AcademyPage() {
  const t = await getTranslations("marketing.home");
  const locale = await getLocale();

  return (
    <div className="bg-white">
      {/* 1. HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-20">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#3d4236]">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-lg md:text-xl text-slate-600">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                size="lg"
                className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
              >
                <Link href={STUDENT_TRIAL_HREF}>{t("heroPrimary")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/5 hover:text-[#429ead]"
              >
                <Link href="#how-it-works">{t("heroSecondary")}</Link>
              </Button>
            </div>
          </div>
          <div className="w-full max-w-[760px]">
            <Image
              src="/platform-dashboard-cta.svg"
              alt={t("heroImageAlt")}
              width={1500}
              height={1500}
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <MarketingSection className="pt-10 md:pt-14 pb-12">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { icon: MessageCircle, label: t("trust.teachersSpeakYourLanguage") },
            { icon: Users, label: t("trust.smallGroups") },
            { icon: BookOpen, label: t("trust.homeworkRecordings") },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#429ead]/10">
                <item.icon className="h-5 w-5 text-[#429ead]" />
              </div>
              <span className="font-medium text-[#3d4236]">{item.label}</span>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* 3. HOW IT WORKS */}
      <MarketingSection id="how-it-works">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("howItWorks.title")}
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              step: 1,
              text: t("howItWorks.step1"),
              image: "/images/how-it-works/level-check.png",
              imageAlt: "Level check",
              badgeClass: "bg-green-100 text-green-700",
            },
            {
              step: 2,
              text: t("howItWorks.step2"),
              image: "/images/how-it-works/live-class.png",
              imageAlt: "Live class",
              badgeClass: "bg-blue-100 text-blue-700",
            },
            {
              step: 3,
              text: t("howItWorks.step3"),
              image: "/learning-at-kitchen-table.jpg",
              imageAlt: "Practice homework",
              badgeClass: "bg-red-100 text-red-700",
            },
          ].map((item) => (
            <Card
              key={item.step}
              className="rounded-2xl shadow-md p-6 flex flex-col gap-4 border border-slate-200 bg-white"
            >
              <div className="relative h-44 w-full overflow-hidden rounded-2xl">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  priority={item.step === 1}
                />
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${item.badgeClass}`}
                >
                  {t("howItWorks.stepLabel", { step: item.step })}
                </span>
              </div>
              <p className="text-lg font-medium text-[#3d4236]">{item.text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
          >
            <Link href={STUDENT_TRIAL_HREF}>{t("heroPrimary")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-[#7daf41] text-[#7daf41] hover:bg-[#7daf41]/5"
          >
            <Link href={`/${locale}/level-check`}>{t("howItWorks.step1")}</Link>
          </Button>
        </div>
      </MarketingSection>

      {/* 4. WHAT YOU GET */}
      <MarketingSection id="what-you-get">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("whatYouGet.title")}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
          {[
            {
              icon: Mic2,
              title: t("whatYouGet.liveSpeakingClasses.title"),
              desc: t("whatYouGet.liveSpeakingClasses.desc"),
            },
            {
              icon: Globe,
              title: t("whatYouGet.platformInYourLanguage.title"),
              desc: t("whatYouGet.platformInYourLanguage.desc"),
            },
            {
              icon: FileText,
              title: t("whatYouGet.homeworkAssignments.title"),
              desc: t("whatYouGet.homeworkAssignments.desc"),
            },
            {
              icon: Video,
              title: t("whatYouGet.lessonRecordings.title"),
              desc: t("whatYouGet.lessonRecordings.desc"),
            },
            {
              icon: BookMarked,
              title: t("whatYouGet.vocabTrainer.title"),
              desc: t("whatYouGet.vocabTrainer.desc"),
            },
            {
              icon: BarChart3,
              title: t("whatYouGet.progressTracking.title"),
              desc: t("whatYouGet.progressTracking.desc"),
            },
          ].map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.desc}
            />
          ))}
        </div>
      </MarketingSection>

      {/* 5. TEACHERS */}
      <MarketingSection>
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("teachers.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[#5a5f57]">
          {t("teachers.subtitle")}
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3 justify-items-center">
          <TeacherCard
            name="Connor S."
            imageSrc="/teacher-connor-s.svg"
            credentials={t("teachers.card.credentials")}
            languages={t("teachers.card.languages")}
          />
          <TeacherCard
            name="Kay M."
            imageSrc="/teacher-kay-m.svg"
            credentials={t("teachers.card.credentials")}
            languages={t("teachers.card.languages")}
          />
          <TeacherCard
            name="Mason B."
            imageSrc="/teacher-mason-b.svg"
            credentials={t("teachers.card.credentials")}
            languages={t("teachers.card.languages")}
          />
        </div>
      </MarketingSection>

      {/* 6. STUDENT RESULTS / OUTCOMES */}
      <MarketingSection>
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          {t("results.title")}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: MessageCircle,
              title: t("results.speakConfidently.title"),
              desc: t("results.speakConfidently.desc"),
            },
            {
              icon: BookMarked,
              title: t("results.buildVocab.title"),
              desc: t("results.buildVocab.desc"),
            },
            {
              icon: Calendar,
              title: t("results.clearStructure.title"),
              desc: t("results.clearStructure.desc"),
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7daf41]/10">
                <item.icon className="h-5 w-5 text-[#7daf41]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#3d4236]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#5a5f57]">{item.desc}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      {/* 7. FINAL CTA */}
      <MarketingSection>
        <div className="flex flex-col items-center gap-10">
          <Image
            src="/platform-dashboard-cta.svg"
            alt={t("platformImageAlt")}
            width={1500}
            height={1500}
            className="w-full max-w-4xl h-auto"
          />
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-md text-center sm:p-16">
            <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
              {t("finalCta.title")}
            </h2>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-[#7daf41] hover:bg-[#6b9a39] text-white"
            >
              <Link href={STUDENT_TRIAL_HREF}>{t("heroPrimary")}</Link>
            </Button>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/${locale}/enroll`}
                className="text-sm font-medium text-[#7daf41] hover:underline"
              >
                {t("finalCta.enrollNow")}
              </Link>
              <span className="text-slate-400">|</span>
              <Link
                href="/pricing"
                className="text-sm font-medium text-[#429ead] hover:underline"
              >
                {t("finalCta.studentPricing")}
              </Link>
            </p>
          </div>
        </div>
      </MarketingSection>
    </div>
  );
}
