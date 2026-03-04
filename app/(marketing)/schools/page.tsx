import Link from "next/link";
import Image from "next/image";
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

export default function SchoolsPage() {
  return (
    <div className="bg-white">
      {/* 1. HERO */}
      <MarketingSection className="pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-[#3d4236] md:text-5xl">
              English infrastructure for schools.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#5a5f57]">
              License the Gecko platform by student seats. Add certified Gecko teachers to run live classes.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                asChild
                size="lg"
                className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
              >
                <Link href="/contact">Book a Demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/5 hover:text-[#429ead]"
              >
                <Link href="#platform">See the Platform</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 lg:max-w-[480px]">
            <Image
              src="/platform-dashboard-cta.svg"
              alt="Gecko Academy platform"
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
            { icon: Globe, label: "Localized platform" },
            { icon: Users, label: "Certified teachers" },
            { icon: BookOpen, label: "Structured curriculum + homework" },
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
              Problem
            </h2>
            <p className="mt-4 text-[#5a5f57]">
              Many schools struggle with English education:
            </p>
            <ul className="mt-6 space-y-3 text-[#5a5f57]">
              {[
                "Limited speaking practice",
                "Inconsistent curriculum",
                "Lack of fluent teachers",
                "No digital learning tools",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#7daf41]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
              Solution
            </h2>
            <p className="mt-4 text-[#5a5f57]">Gecko provides:</p>
            <ul className="mt-6 space-y-3 text-[#5a5f57]">
              {[
                "English learning platform",
                "Structured curriculum",
                "Homework and progress tracking",
                "Certified teachers who speak the local language",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#429ead]">•</span>
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
          How It Works
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { step: 1, text: "School licenses platform seats" },
            { step: 2, text: "Choose platform only or platform + teacher" },
            { step: 3, text: "Students begin classes" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7daf41]/10 text-sm font-semibold text-[#7daf41]">
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
            <Link href="/contact">Book a Demo</Link>
          </Button>
        </div>
      </MarketingSection>

      {/* 5. PLATFORM FEATURES */}
      <MarketingSection id="platform">
        <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
          Platform Features
        </h2>
        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {[
              { icon: Globe, title: "Local language UI", desc: "Platform in students' native language" },
              { icon: Library, title: "Curriculum library", desc: "Structured lessons and materials" },
              { icon: FileText, title: "Homework + submissions", desc: "Assign and track assignments" },
              { icon: BarChart3, title: "Progress tracking", desc: "Scores, activity, and reports" },
              { icon: Users, title: "Class management", desc: "Rosters, scheduling, and groups" },
              { icon: LayoutDashboard, title: "Teacher/admin dashboard", desc: "Full control and visibility" },
            ].map((item) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.desc}
              />
            ))}
          </div>
          <div className="w-full shrink-0 lg:w-[420px]">
            <Image
              src="/platform-dashboard-cta.svg"
              alt="Gecko Academy platform"
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
          Add Gecko Teachers (Optional)
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[#5a5f57]">
          Certified teachers who speak the local language, teach live classes, and follow Gecko curriculum.
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

      {/* 7. CTA FOOTER */}
      <MarketingSection>
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-md text-center sm:p-16">
          <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
            Ready to bring Gecko to your school?
          </h2>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-[#7daf41] hover:bg-[#6b9a39] text-white"
          >
            <Link href="/contact">Book a Demo</Link>
          </Button>
        </div>
      </MarketingSection>
    </div>
  );
}
