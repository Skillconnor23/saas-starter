'use client';

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const BEGINNER_CALENDLY_URL = "https://calendly.com/gecko-academy/meet-with-me?primary_color=7daf41";
const INTERMEDIATE_CALENDLY_URL = "https://calendly.com/gecko-academy/meet-with-me-1?primary_color=7daf41";

type Level = 'beginner' | 'intermediate';

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        resize?: boolean;
        inlineStyles?: boolean;
      }) => void;
    };
  }
}

export default function TrialPage() {
  const t = useTranslations("marketing.trial");
  const [level, setLevel] = useState<Level>('beginner');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const calendlyRef = useRef<HTMLDivElement>(null);

  const calendlyUrl = level === 'beginner' ? BEGINNER_CALENDLY_URL : INTERMEDIATE_CALENDLY_URL;

  useEffect(() => {
    const src = "https://assets.calendly.com/assets/external/widget.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing) {
      if (window.Calendly?.initInlineWidget) {
        setScriptLoaded(true);
      } else {
        existing.addEventListener("load", () => setScriptLoaded(true), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !calendlyRef.current || !window.Calendly?.initInlineWidget) return;
    const parent = calendlyRef.current;
    parent.innerHTML = "";
    try {
      window.Calendly.initInlineWidget({ url: calendlyUrl, parentElement: parent });
    } catch (_) {}
  }, [scriptLoaded, calendlyUrl]);

  const bullets = [t("heroBullet1"), t("heroBullet2"), t("heroBullet3"), t("heroBullet4")];
  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3d4236] md:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-6 text-lg text-slate-600 md:text-xl">
          {t("heroSubtitle")}
        </p>
        <ul className="mt-8 flex flex-col gap-3 text-left sm:mx-auto sm:max-w-md">
          {bullets.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7daf41]/15">
                <Check className="h-3.5 w-3.5 text-[#7daf41]" strokeWidth={2.5} />
              </span>
              <span className="text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button
            asChild
            size="lg"
            className="bg-[#7daf41] hover:bg-[#6b9a39] text-white"
          >
            <a href="#book-trial">{t("heroPrimary")}</a>
          </Button>
        </div>
      </section>

      {/* Level Selector */}
      <section className="border-t border-slate-100 bg-slate-50/50 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#3d4236] md:text-3xl">
            {t("levelTitle")}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              size="lg"
              variant={level === 'beginner' ? 'default' : 'outline'}
              className={
                level === 'beginner'
                  ? "bg-[#7daf41] hover:bg-[#6b9a39] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }
              onClick={() => setLevel('beginner')}
            >
              {t("level.beginner")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant={level === 'intermediate' ? 'default' : 'outline'}
              className={
                level === 'intermediate'
                  ? "bg-[#7daf41] hover:bg-[#6b9a39] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }
              onClick={() => setLevel('intermediate')}
            >
              {t("level.intermediate")}
            </Button>
          </div>
        </div>
      </section>

      {/* Calendly Booking */}
      <section id="book-trial" className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
            {t("bookingTitle")}
          </h2>
          <p className="mt-4 text-center text-slate-600">
            {t("bookingSubtitle")}
          </p>
          <div className="mt-10 w-full">
            <div
              ref={calendlyRef}
              style={{ minWidth: 320, height: 1400 }}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 bg-slate-50/50 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#3d4236] md:text-3xl">
            {t("faqTitle")}
          </h2>
          <dl className="mt-12 space-y-8">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-6">
                <dt className="font-semibold text-[#3d4236]">{item.q}</dt>
                <dd className="mt-3 text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
