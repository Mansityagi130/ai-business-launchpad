import React from "react";

export interface FeaturesProps {
  content: {
    title: string;
    subtitle?: string;
    items: Array<{ id: string; icon?: string; title: string; description: string }>;
  };
}

export const Features: React.FC<FeaturesProps> = ({ content }) => {
  return (
    <section id="features" className="py-16 px-6 bg-[var(--background)] text-[var(--text)] transition-all">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="text-[var(--text-muted)]">{content.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {content.items?.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-[var(--radius)] bg-[var(--surface)] border border-slate-800/10 shadow-sm space-y-2"
            >
              <h4 className="text-xl font-bold">{item.title}</h4>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
