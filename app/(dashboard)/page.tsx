import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Online English classes for Mongolian students
                <span className="block text-orange-500">built for real speaking.</span>
              </h1>

              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Small live classes, weekend-friendly schedule, and a simple path
                from free trial to steady progress.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  variant="gecko"
                  className="text-lg rounded-full"
                >
                  <Link href="/trial">Book a Free Trial</Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 sm:justify-center lg:justify-start">
                <span>Live teachers</span>
                <span>Small groups</span>
                <span>Weekend classes</span>
                <span>Recordings + homework</span>
              </div>
            </div>

            {/* TRUST CARD */}
            <div className="mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-5">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="text-sm font-medium text-gray-900">
                  What happens in the free trial
                </div>

                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>Short live speaking session (no preparation)</li>
                  <li>We confirm level and recommended class</li>
                  <li>You see exactly how Gecko works</li>
                  <li>No payment before the trial</li>
                </ul>

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold text-gray-700">
                    Typical schedule
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Classes are mostly on weekends. After your trial, we match
                    you to a time that fits.
                  </div>
                </div>

                <div className="mt-6">
                  <Button asChild variant="gecko" className="w-full rounded-full">
                    <Link href="/trial">Book a Free Trial</Link>
                  </Button>

                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Calm, clear, and no pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              A simple process that parents understand
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Gecko exists to remove confusion and make the weekly routine easy.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-gray-900">Book a trial</div>
              <p className="mt-2 text-sm text-gray-600">Pick a time. No payment. No forms.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-gray-900">Trial → trust</div>
              <p className="mt-2 text-sm text-gray-600">We confirm level and show how classes work.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-gray-900">Enroll monthly</div>
              <p className="mt-2 text-sm text-gray-600">One simple plan. Month-to-month.</p>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-gray-900">Use Class Hub</div>
              <p className="mt-2 text-sm text-gray-600">Meet link, recordings, homework, announcements.</p>
            </div>
          </div>

          <div className="mt-10">
            <Button asChild size="lg" variant="gecko" className="rounded-full">
              <Link href="/trial">Book a Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">FAQ</h2>

            <div className="mt-8 space-y-6">
              <div>
                <div className="font-semibold text-gray-900">Do we pay before the trial?</div>
                <p className="mt-2 text-gray-600">
                  No. You enroll only after the trial if it feels like a fit.
                </p>
              </div>

              <div>
                <div className="font-semibold text-gray-900">When are classes?</div>
                <p className="mt-2 text-gray-600">
                  Mostly on weekends. After the trial we place you into the best time.
                </p>
              </div>

              <div>
                <div className="font-semibold text-gray-900">What does the Class Hub include?</div>
                <p className="mt-2 text-gray-600">
                  Meet link, recordings, homework, schedule, and announcements.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <Button asChild size="lg" variant="gecko" className="rounded-full">
                <Link href="/trial">Book a Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}