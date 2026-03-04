import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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

export default function AcademyPage() {
  return (
    <div className="bg-white">
      {/* 1. HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-20">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#3d4236]">
              Learn English with real teachers.
            </h1>
            <p className="mt-6 max-w-xl text-lg md:text-xl text-slate-600">
              Small live classes + a learning platform in your language + structured homework.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                size="lg"
                className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
              >
                <Link href="/contact">Start Free Trial</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/5 hover:text-[#429ead]"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
          <div className="w-full max-w-[760px]">
            <Image
              src="/platform-dashboard-cta.svg"
              alt="Gecko Academy student dashboard"
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
            { icon: MessageCircle, label: "Teachers speak your language" },
            { icon: Users, label: "Small groups (8–12)" },
            { icon: BookOpen, label: "Homework + recordings" },
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
          How It Works
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { step: 1, text: "Take a quick level check" },
            { step: 2, text: "Join a small live class" },
            { step: 3, text: "Practice with homework + recordings" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#429ead]/10 text-sm font-semibold text-[#429ead]">
                Step {item.step}
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
            <Link href="/contact">Start Free Trial</Link>
          </Button>
        </div>
      </MarketingSection>

      {/* 4. WHAT YOU GET */}
      <MarketingSection id="what-you-get">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          What You Get
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
          {[
            { icon: Mic2, title: "Live speaking classes", desc: "Small groups with real conversation" },
            { icon: Globe, title: "Platform in your language", desc: "UI and support in your native language" },
            { icon: FileText, title: "Homework assignments", desc: "Structured practice between classes" },
            { icon: Video, title: "Lesson recordings", desc: "Review and catch up anytime" },
            { icon: BookMarked, title: "Vocabulary trainer", desc: "Build and reinforce vocabulary" },
            { icon: BarChart3, title: "Progress tracking", desc: "See your improvement over time" },
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
          Meet your teachers
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[#5a5f57]">
          Certified teachers who speak your language and help you speak with confidence.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3 justify-items-center">
          <TeacherCard
            name="Connor S."
            imageSrc="/teacher-connor-s.svg"
            credentials="Certified • Bilingual • ESL Experience"
            languages="English + Mongolian"
          />
          <TeacherCard
            name="Kay M."
            imageSrc="/teacher-kay-m.svg"
            credentials="Certified • Bilingual • ESL Experience"
            languages="English + Mongolian"
          />
          <TeacherCard
            name="Mason B."
            imageSrc="/teacher-mason-b.svg"
            credentials="Certified • Bilingual • ESL Experience"
            languages="English + Mongolian"
          />
        </div>
      </MarketingSection>

      {/* 6. STUDENT RESULTS / OUTCOMES */}
      <MarketingSection>
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          Student Results
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Speak more confidently", desc: "Real conversation practice in every class" },
            { icon: BookMarked, title: "Build real vocabulary", desc: "Words you'll use, not just memorize" },
            { icon: Calendar, title: "Clear weekly structure", desc: "Classes, homework, and progress you can count on" },
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
            alt="Gecko Academy platform"
            width={1500}
            height={1500}
            className="w-full max-w-4xl h-auto"
          />
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-md text-center sm:p-16">
            <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
              Ready to try a real English class?
            </h2>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-[#7daf41] hover:bg-[#6b9a39] text-white"
            >
              <Link href="/contact">Start Free Trial</Link>
            </Button>
            <p className="mt-6">
              <Link
                href="/pricing-students"
                className="text-sm font-medium text-[#429ead] hover:underline"
              >
                See student pricing
              </Link>
            </p>
          </div>
        </div>
      </MarketingSection>
    </div>
  );
}
