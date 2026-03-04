"use client";

import { useState } from "react";
import { Section } from "@/components/landing/Section";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import type { PricingTier } from "@/lib/pricing/tiers";

interface PricingPageClientProps {
  tiers: PricingTier[];
  billingToggleLabel?: string;
}

export function PricingPageClient({
  tiers,
  billingToggleLabel,
}: PricingPageClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  return (
    <Section className="py-8 sm:py-12">
      <div className="flex justify-center">
        <BillingToggle
          value={billingPeriod}
          onChange={setBillingPeriod}
          annualDisabled
        />
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            billingPeriod={billingPeriod}
          />
        ))}
      </div>
    </Section>
  );
}
