import React from "react";
import { cn } from "./utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "inner" | "highlight";
}

export default function Card({ children, className, variant = "default" }: CardProps) {
  const variantStyles = {
    default: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
    inner: "bg-black/30 border border-white/[0.08]",
    highlight: "bg-[#0B1516] border border-[#2DD4D4]/35",
  };

  return (
    <div className={cn("rounded-xl p-6", variantStyles[variant], className)}>{children}</div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={cn("text-xl font-bold text-white", className)}>{children}</h3>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn("mt-4 pt-4 border-t border-white/[0.08]", className)}>{children}</div>;
}
