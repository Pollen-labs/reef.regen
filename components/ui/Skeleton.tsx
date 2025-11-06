"use client";
import React from "react";

type Props = {
  className?: string;
};

export default function Skeleton({ className = "" }: Props) {
  return (
    <div className={["animate-pulse bg-vulcan-800/60 rounded-lg", className].join(" ")} />
  );
}

