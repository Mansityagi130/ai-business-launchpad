import React from "react";

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = "primary", disabled = false }) => {
  const baseStyle = "px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] select-none text-sm inline-flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-brand-primary text-brand-bg hover:bg-brand-dark hover:shadow-lg hover:shadow-brand-primary/10 shadow-sm",
    secondary: "bg-brand-surface text-brand-text hover:bg-brand-surface/80 shadow-sm",
    outline: "border-2 border-brand-primary/20 text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
    >
      {label}
    </button>
  );
};
