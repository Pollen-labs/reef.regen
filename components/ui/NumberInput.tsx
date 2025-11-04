"use client";

import React, { useId, useMemo, useRef } from "react";

type Props = {
  value: number | "";
  onChangeValue: (v: number | "") => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
};

export default function NumberInput({ value, onChangeValue, step = 1, min, max, placeholder, className }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const display = useMemo(() => (value === "" ? "" : String(value)), [value]);

  function clamp(v: number): number {
    if (typeof min === "number" && v < min) return min;
    if (typeof max === "number" && v > max) return max;
    return v;
  }

  function parse(s: string): number | "" {
    if (s.trim() === "") return "";
    const n = Number(s);
    if (Number.isNaN(n)) return value === "" ? "" : value; // ignore invalid
    return n;
  }

  function bump(dir: 1 | -1) {
    const cur = value === "" ? 0 : Number(value);
    const next = clamp(Number((cur + dir * step).toFixed(10)));
    onChangeValue(next);
    // focus input for accessibility
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className={["relative w-full", className || ""].join(" ")}>      
      <input
        ref={inputRef}
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min as any}
        max={max as any}
        className="rr-input rr-input-number pr-12"
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChangeValue(parse(e.target.value))}
      />
      <div className="rr-stepper" aria-hidden>
        <button type="button" className="rr-stepper-btn" onClick={() => bump(1)} tabIndex={-1} aria-label="Increase">
          <i className="f7-icons text-sm">chevron_up</i>
        </button>
        <button type="button" className="rr-stepper-btn" onClick={() => bump(-1)} tabIndex={-1} aria-label="Decrease">
          <i className="f7-icons text-sm">chevron_down</i>
        </button>
      </div>
    </div>
  );
}

