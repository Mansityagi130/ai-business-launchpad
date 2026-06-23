import React from "react";

export interface TestimonialsProps {
  content: {
    title: string;
    subtitle?: string;
    items: Array<{ id: string; author: string; role?: string; quote: string; avatarUrl?: string }>;
  };
}

export const Testimonials: React.FC<TestimonialsProps> = ({ content }) => {
  return (
    <section className="py-16 px-6 bg-[var(--surface)] text-[var(--text)] transition-all border-y border-slate-800/10">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="text-[var(--text-muted)]">{content.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.items?.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-[var(--radius)] bg-[var(--background)] border border-slate-800/10 shadow-sm flex flex-col justify-between"
            >
              <p className="italic text-sm text-[var(--text-muted)]">"{item.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                {item.avatarUrl && (
                  <img
                    src={item.avatarUrl}
                    alt={item.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <h5 className="font-bold text-sm text-[var(--text)]">{item.author}</h5>
                  {item.role && <p className="text-xs text-[var(--text-muted)]">{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
