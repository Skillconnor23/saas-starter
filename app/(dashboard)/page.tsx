import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-[#3d4236] tracking-tight sm:text-5xl md:text-6xl">
                Online English classes for Mongolian students
                <span className="block text-[#7daf41]">built for real speaking.</span>
              </h1>

              <p className="mt-3 text-base text-[#5a5f57] sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Small live classes, weekend-friendly schedule, and a simple path
                from free trial to steady progress.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                <Button asChild variant="primary">
                  <Link href="/trial">Book a Free Trial</Link>
                </Button>

                <Button asChild variant="secondary">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#5a5f57] sm:justify-center lg:justify-start">
                <span>Live teachers</span>
                <span>Small groups</span>
                <span>Weekend classes</span>
                <span>Recordings + homework</span>
              </div>
            </div>

            {/* HERO IMAGE - GIF loops infinitely by default */}
            <div className="mt-12 sm:max-w-2xl sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 scale-85">
              <div className="rounded-[24px] overflow-hidden aspect-video relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-class.gif"
                  alt="Online English class in session"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3d4236]">
              A simple process that parents understand
            </h2>
            <p className="mt-3 text-base text-[#5a5f57]">
              Gecko exists to remove confusion and make the weekly routine easy.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-[#3d4236]">Book a trial</div>
              <p className="mt-2 text-sm text-[#5a5f57]">Pick a time. No payment. No forms.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-[#3d4236]">Trial → trust</div>
              <p className="mt-2 text-sm text-[#5a5f57]">We confirm level and show how classes work.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-[#3d4236]">Enroll monthly</div>
              <p className="mt-2 text-sm text-[#5a5f57]">One simple plan. Month-to-month.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-[#3d4236]">Use Class Hub</div>
              <p className="mt-2 text-sm text-[#5a5f57]">Meet link, recordings, homework, announcements.</p>
            </div>
          </div>

          <div className="mt-10">
            <Button asChild variant="gecko">
              <Link href="/trial">Book a Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#f5f6f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3d4236]">FAQ</h2>

            <div className="mt-8 space-y-6">
              <div>
                <div className="font-semibold text-[#3d4236]">Do we pay before the trial?</div>
                <p className="mt-2 text-[#5a5f57]">
                  No. You enroll only after the trial if it feels like a fit.
                </p>
              </div>

              <div>
                <div className="font-semibold text-[#3d4236]">When are classes?</div>
                <p className="mt-2 text-[#5a5f57]">
                  Mostly on weekends. After the trial we place you into the best time.
                </p>
              </div>

              <div>
                <div className="font-semibold text-[#3d4236]">What does the Class Hub include?</div>
                <p className="mt-2 text-[#5a5f57]">
                  Meet link, recordings, homework, schedule, and announcements.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <Button asChild variant="gecko">
                <Link href="/trial">Book a Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}