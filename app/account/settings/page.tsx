"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";

function RedirectInner() {
  const router = useRouter();
  const search = useSearchParams();
  useEffect(() => {
    const redirect = search.get("redirect");
    const to: Route = redirect
      ? (`/profile/setting?redirect=${encodeURIComponent(redirect)}` as Route)
      : ("/profile/setting" as Route);
    router.replace(to);
  }, [router, search]);
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  );
}
