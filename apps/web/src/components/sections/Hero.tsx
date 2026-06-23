import React from "react";

export interface HeroProps {
  content: {
    title: string;
    subtitle?: string;
    image?: { url: string; alt?: string };
    ctaButtons?: Array<{ id: string; label: string; actionType: string; target: string }>;
  };
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  return (
    <section className="py-20 px-6 bg-[var(--background)] text-[var(--text)] transition-all">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--text)]">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        )}
        
        {content.ctaButtons && content.ctaButtons.length > 0 && (
          <div className="flex justify-center gap-4 pt-4">
            {content.ctaButtons.map((btn) => (
              <a
                key={btn.id}
                href={btn.target}
                className="px-6 py-3 font-semibold rounded-[var(--radius)] transition-all active:scale-95 bg-[var(--primary)] text-[var(--background)] hover:opacity-90"
              >
                {btn.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
