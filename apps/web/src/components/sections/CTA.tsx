import React from "react";

export interface CTAProps {
  content: {
    title: string;
    subtitle?: string;
    ctaButton?: { label: string; target: string };
  };
}

export const CTA: React.FC<CTAProps> = ({ content }) => {
  return (
    <section className="py-16 px-6 bg-[var(--primary)] text-[var(--background)] text-center transition-all">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
        {content.subtitle && <p className="text-md opacity-90 max-w-xl mx-auto">{content.subtitle}</p>}
        {content.ctaButton && (
          <a
            href={content.ctaButton.target}
            className="inline-block px-6 py-3 font-bold text-sm bg-[var(--text)] text-[var(--background)] rounded-[var(--radius)] hover:opacity-95 active:scale-95 transition-all"
          >
            {content.ctaButton.label}
          </a>
        )}
      </div>
    </section>
  );
};
