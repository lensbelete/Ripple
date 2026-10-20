import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-line bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-accent ${className}`}
      {...props}
    />
  );
}
