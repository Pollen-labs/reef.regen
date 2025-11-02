"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RedirectToProfileSetting() {
  const router = useRouter();
  const search = useSearchParams();
  useEffect(() => {
    const redirect = search.get("redirect");
    const to = redirect ? `/profile/setting?redirect=${encodeURIComponent(redirect)}` : "/profile/setting";
    router.replace(to);
  }, [router, search]);
  return null;
}
