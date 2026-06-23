import React from "react";

export interface AboutProps {
  content: {
    title: string;
    content: string;
    image?: { url: string; alt?: string };
  };
}

export const About: React.FC<AboutProps> = ({ content }) => {
  return (
    <section id="about" className="py-16 px-6 bg-[var(--surface)] text-[var(--text)] transition-all border-y border-slate-800/10">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-line">{content.content}</p>
        </div>
        {content.image?.url && (
          <div className="flex-1 w-full">
            <img
              src={content.image.url}
              alt={content.image.alt || "About section visual"}
              className="rounded-[var(--radius)] shadow-lg max-h-80 w-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
};
