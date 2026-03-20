import React from "react";
import { cn } from "./utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 rounded-lg",
          "bg-white/[0.05] border border-white/[0.12]",
          "text-white placeholder:text-white/40",
          "focus:outline-none focus:ring-2 focus:ring-[#2DD4D4]/50 focus:border-[#2DD4D4]",
          "transition-all duration-200",
          error && "border-[#FF5A5A] focus:ring-[#FF5A5A]/50",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#FF5A5A]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-white/50">{helperText}</p>
      )}
    </div>
  );
}
