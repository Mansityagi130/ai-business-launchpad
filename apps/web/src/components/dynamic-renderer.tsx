import React from "react";
import { Section } from "@launchpad/types";

interface DynamicRendererProps {
  sections: Section[];
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ sections }) => {
  return (
    <div className="w-full flex flex-col">
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="py-12 bg-slate-900 text-center border-b border-slate-800">
                <h2 className="text-3xl font-bold">{section.title}</h2>
                {section.subtitle && <p className="mt-2 text-slate-400">{section.subtitle}</p>}
              </section>
            );
          case "about":
            return (
              <section key={section.id} className="py-12 bg-slate-800 px-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-4 text-slate-300">{section.content}</p>
              </section>
            );
          default:
            return (
              <div key={section.id} className="p-4 bg-red-950 text-red-200">
                Unsupported or Unimplemented Section Type: {section.type} (Version: {section.componentVersion})
              </div>
            );
        }
      })}
    </div>
  );
};
