import React from "react";

export interface ThemeConfig {
  mode: "light" | "dark";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
  };
  uiConfig: {
    borderRadius: "none" | "sm" | "md" | "lg" | "full";
    buttonStyle: "solid" | "outline" | "ghost";
  };
}

interface ThemeEngineProps {
  theme: ThemeConfig;
  children: React.ReactNode;
}

export const ThemeEngine: React.FC<ThemeEngineProps> = ({ theme, children }) => {
  const getRadius = (val: string) => {
    switch (val) {
      case "none": return "0px";
      case "sm": return "4px";
      case "md": return "8px";
      case "lg": return "16px";
      case "full": return "9999px";
      default: return "8px";
    }
  };

  // Convert theme tokens into css variables
  const cssProperties = {
    "--primary": theme.colors.primary,
    "--background": theme.colors.background,
    "--surface": theme.colors.surface || theme.colors.secondary,
    "--text": theme.colors.text,
    "--text-muted": theme.colors.textMuted,
    "--radius": getRadius(theme.uiConfig?.borderRadius || "md"),
    "--font-heading": theme.typography?.headingFont || "Outfit",
    "--font-body": theme.typography?.bodyFont || "Inter",
    "--font-size-base": `${theme.typography?.baseFontSize || 16}px`,
  } as React.CSSProperties;

  return (
    <div style={cssProperties} className="w-full min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-300">
      {children}
    </div>
  );
};
