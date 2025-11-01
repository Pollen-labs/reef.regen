"use client";

import React from "react";

type Variant = "solid" | "outline";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const base = "inline-flex items-center justify-center rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const variants: Record<Variant, string> = {
  solid: "bg-orange text-white hover:bg-orange/90",
  outline: "outline outline-4 outline-offset-[-4px] outline-vulcan-500 text-white hover:bg-white/5",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-xl",
};

export default function Button({ variant = "solid", size = "md", fullWidth, className, ...rest }: Props) {
  return (
    <button
      className={[base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className || ""].join(" ")}
      {...rest}
    />
  );
}

