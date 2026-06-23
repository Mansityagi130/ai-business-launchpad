import React from "react";
import { Website, Section } from "@launchpad/types";
import { ComponentRegistry } from "./ComponentRegistry";
import { ThemeEngine } from "./ThemeEngine";

interface WebsiteRendererProps {
  website: Website;
  activeSlug?: string;
}

export const WebsiteRenderer: React.FC<WebsiteRendererProps> = ({ website, activeSlug = "/" }) => {
  const activePage = website.pages?.find((p) => p.slug === activeSlug);

  return (
    <ThemeEngine theme={website.theme as any}>
      {/* Dynamic Header */}
      <header className="py-4 px-6 bg-[var(--surface)] text-[var(--text)] flex justify-between items-center border-b border-slate-800/10 transition-all">
        <div className="font-bold text-lg">{website.siteName}</div>
        
        {website.navigation?.header?.links && (
          <nav className="hidden sm:flex gap-6 text-sm font-medium">
            {website.navigation.header.links.map((link, idx) => (
              <a key={idx} href={link.target} className="hover:text-[var(--primary)] transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {website.navigation?.header?.ctaButton && (
          <a
            href={website.navigation.header.ctaButton.target}
            className="px-4 py-2 text-xs font-bold rounded-[var(--radius)] bg-[var(--primary)] text-[var(--background)] hover:opacity-90 transition-all"
          >
            {website.navigation.header.ctaButton.label}
          </a>
        )}
      </header>

      {/* Pages Sections Loop */}
      <main className="w-full">
        {activePage ? (
          activePage.sections?.map((section: Section) => {
            const SectionComponent = ComponentRegistry[section.type];
            if (!SectionComponent) {
              return (
                <div key={section.id} className="p-4 bg-red-950 text-red-200 text-center font-mono">
                  Error: Component '{section.type}' is missing from mapping registry.
                </div>
              );
            }
            return <SectionComponent key={section.id} content={section as any} />;
          })
        ) : (
          <div className="p-12 text-center text-slate-500">404 - Request page was not found.</div>
        )}
      </main>

      {/* Dynamic Footer */}
      <footer className="py-12 px-6 bg-[var(--surface)] text-[var(--text-muted)] text-sm border-t border-slate-800/10 text-center space-y-4">
        {website.navigation?.footer?.links && (
          <div className="flex justify-center gap-6 text-xs font-medium">
            {website.navigation.footer.links.map((link, idx) => (
              <a key={idx} href={link.target} className="hover:text-[var(--text)] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        )}
        <div className="text-xs">{website.navigation?.footer?.copyrightText || `© ${new Date().getFullYear()} ${website.siteName}`}</div>
      </footer>
    </ThemeEngine>
  );
};
