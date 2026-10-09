import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#102644] text-white hover:bg-[#1769E0] active:scale-95 shadow-2xs",
    secondary:
      "bg-white border border-[#DCE5F0] text-[#102644] hover:bg-slate-50 active:scale-95",
    danger:
      "bg-[#C43D4B] text-white hover:bg-rose-700 active:scale-95",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}