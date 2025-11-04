"use client";

import React from "react";

type Size = "sm" | "md" | "lg";

export type TagProps = {
  label: string;
  size?: Size;
  className?: string;
  bgClass?: string; // tailwind class e.g. bg-ribbon-300
  textClass?: string; // tailwind class e.g. text-vulcan-950
};

const sizeMap: Record<Size, string> = {
  sm: "badge-sm",
  md: "badge",
  lg: "badge-lg",
};

export default function Tag({ label, size = "md", className, bgClass, textClass }: TagProps) {
  const color = `${bgClass || "bg-ribbon-300"} ${textClass || "text-vulcan-900"}`;
  return (
    <span className={[sizeMap[size], color, className || ""].join(" ")}>{label}</span>
  );
}

