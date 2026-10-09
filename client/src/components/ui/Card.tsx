import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`w-full min-w-0 rounded-xl border border-[#DCE5F0] bg-white p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}