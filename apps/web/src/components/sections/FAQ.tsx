import React, { useState } from "react";

export interface FAQProps {
  content: {
    title: string;
    subtitle?: string;
    items: Array<{ id: string; question: string; answer: string }>;
  };
}

export const FAQ: React.FC<FAQProps> = ({ content }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="py-16 px-6 bg-[var(--surface)] text-[var(--text)] transition-all border-y border-slate-800/10">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="text-[var(--text-muted)]">{content.subtitle}</p>}
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          {content.items?.map((item) => (
            <div key={item.id} className="border-b border-slate-700/20 pb-4">
              <button
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between text-left font-semibold py-2 focus:outline-none"
              >
                <span>{item.question}</span>
                <span className="text-[var(--primary)] font-mono">{openId === item.id ? "−" : "+"}</span>
              </button>
              {openId === item.id && (
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
