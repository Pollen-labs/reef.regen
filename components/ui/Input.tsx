"use client";

import { forwardRef } from "react";

type Size = "sm" | "md" | "lg";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: string; // f7 icon name
  rightIcon?: string; // f7 icon name
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  size?: Size;
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm py-2",
  md: "text-base py-3",
  lg: "text-lg py-4",
};

/**
 * Standard input used across the app.
 * - Uses rr-input base class for consistent theming
 * - Optional left/right Framework7 icons
 * - Size token for font/padding adjustments
 */
const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { leftIcon, rightIcon, onLeftIconClick, onRightIconClick, size = "md", className, ...rest },
  ref
) {
  const padLeft = leftIcon ? "pl-12" : "";
  const padRight = rightIcon ? "pr-12" : "";
  return (
    <div className={`relative w-full ${className || ""}`}>
      <input ref={ref} className={`rr-input ${sizeClasses[size]} ${padLeft} ${padRight}`} {...rest} />
      {leftIcon && (
        <button type="button" onClick={onLeftIconClick} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
          <i className="f7-icons">{leftIcon}</i>
        </button>
      )}
      {rightIcon && (
        <button type="button" onClick={onRightIconClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
          <i className="f7-icons">{rightIcon}</i>
        </button>
      )}
    </div>
  );
});

export default Input;

