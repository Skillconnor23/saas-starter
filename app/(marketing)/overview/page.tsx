import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/landing/Section";
import { AppPreviewCard } from "@/components/landing/AppPreviewCard";
import {
  Monitor,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 1. HERO */}
        <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="order-2 flex flex-col gap-6 lg:order-1 lg:flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-[#3d4236] sm:text-4xl md:text-5xl">
                English learning built for real speaking.
              </h1>
              <p className="max-w-lg text-base text-[#5a5f57] sm:text-lg">
                A localized platform and certified teachers who speak your language.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button asChild size="lg" className="bg-[#7daf41] hover:bg-[#6b9a39] text-white">
                  <Link href="/schools">For Schools</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="bg-[#429ead] hover:bg-[#388694] text-white">
                  <Link href="/academy">For Students</Link>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:w-[400px] xl:w-[440px]">
              <AppPreviewCard />
            </div>
          </div>
        </section>
      </div>

      {/* HOW GECKO WORKS */}
      <Section>
        <h2 className="text-center text-xl font-semibold text-[#3d4236] sm:text-2xl">
          How Gecko Works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7daf41]/10">
              <Monitor className="h-5 w-5 text-[#7daf41]" />
            </div>
            <h3 className="mt-4 font-medium text-[#3d4236]">Platform</h3>
            <p className="mt-2 text-sm text-[#5a5f57]">
              Localized English learning platform with lessons, homework, and progress tracking.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7daf41]/10">
              <GraduationCap className="h-5 w-5 text-[#7daf41]" />
            </div>
            <h3 className="mt-4 font-medium text-[#3d4236]">Teachers</h3>
            <p className="mt-2 text-sm text-[#5a5f57]">
              Certified English teachers who speak the local language.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7daf41]/10">
              <BookOpen className="h-5 w-5 text-[#7daf41]" />
            </div>
            <h3 className="mt-4 font-medium text-[#3d4236]">Curriculum</h3>
            <p className="mt-2 text-sm text-[#5a5f57]">
              Structured curriculum designed to help students speak confidently.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
