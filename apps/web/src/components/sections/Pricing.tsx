import React from "react";

export interface PricingProps {
  content: {
    title: string;
    subtitle?: string;
    tiers: Array<{
      id: string;
      name: string;
      price: string;
      period: string;
      features: string[];
      isPopular?: boolean;
      ctaButton?: { label: string; target: string };
    }>;
  };
}

export const Pricing: React.FC<PricingProps> = ({ content }) => {
  return (
    <section className="py-16 px-6 bg-[var(--background)] text-[var(--text)] transition-all">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="text-[var(--text-muted)]">{content.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {content.tiers?.map((tier) => (
            <div
              key={tier.id}
              className={`p-6 rounded-[var(--radius)] bg-[var(--surface)] border flex flex-col justify-between relative ${
                tier.isPopular ? "border-[var(--primary)] shadow-md" : "border-slate-800/10"
              }`}
            >
              {tier.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-[var(--background)] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Popular
                </span>
              )}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{tier.name}</h4>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-1">/{tier.period}</span>
                </div>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                  {tier.features?.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[var(--primary)]">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              {tier.ctaButton && (
                <a
                  href={tier.ctaButton.target}
                  className="mt-6 block text-center py-2 rounded-[var(--radius)] font-bold text-xs bg-[var(--primary)] text-[var(--background)] hover:opacity-90 transition-all"
                >
                  {tier.ctaButton.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
