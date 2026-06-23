import React from "react";

export interface ContactProps {
  content: {
    title: string;
    subtitle?: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    showForm?: boolean;
  };
}

export const Contact: React.FC<ContactProps> = ({ content }) => {
  return (
    <section id="contact" className="py-16 px-6 bg-[var(--background)] text-[var(--text)] transition-all">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="text-[var(--text-muted)]">{content.subtitle}</p>}
        </div>
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-4">
            <h4 className="text-xl font-bold">Contact Details</h4>
            <p className="text-sm text-[var(--text-muted)]">Reach out directly through any of our channels.</p>
            <div className="space-y-3 text-sm">
              {content.address && <p>📍 {content.address}</p>}
              {content.phone && <p>📞 {content.phone}</p>}
              {content.email && <p>✉️ {content.email}</p>}
              {content.whatsapp && (
                <a
                  href={`https://wa.me/${content.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--primary)] hover:underline block font-semibold"
                >
                  💬 Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
          {content.showForm && (
            <div className="flex-1 p-6 rounded-[var(--radius)] bg-[var(--surface)] border border-slate-800/10 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Your Name</label>
                <input
                  type="text"
                  className="w-full bg-[var(--background)] border border-slate-800/10 px-3 py-2 rounded text-sm text-[var(--text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Your Message</label>
                <textarea
                  rows={4}
                  className="w-full bg-[var(--background)] border border-slate-800/10 px-3 py-2 rounded text-sm text-[var(--text)] focus:outline-none"
                />
              </div>
              <button className="w-full py-2.5 rounded-[var(--radius)] bg-[var(--primary)] text-[var(--background)] font-bold text-sm hover:opacity-90 active:scale-98 transition-all">
                Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
