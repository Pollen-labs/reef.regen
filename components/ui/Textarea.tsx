"use client";

import { forwardRef } from "react";

type Size = "sm" | "md" | "lg";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: Size;
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm py-2",
  md: "text-base py-3",
  lg: "text-lg py-4",
};

/**
 * Standard textarea used across the app.
 * - Matches Input styling via rr-input base class
 * - Size token for font/padding adjustments
 */
const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { size = "md", className, ...rest },
  ref
) {
  return (
    <textarea ref={ref} className={`rr-input ${sizeClasses[size]} ${className || ""}`} {...rest} />
  );
});

export default Textarea;

