import React from "react";

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = "primary", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded font-medium transition-all duration-200 active:scale-95";
  const variants = {
    primary: "bg-amber-500 text-slate-900 hover:bg-amber-600",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
    outline: "border border-slate-700 text-slate-300 hover:bg-slate-800"
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
