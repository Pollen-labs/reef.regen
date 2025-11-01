"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { useState } from "react";

type Props = {
  returnTo?: string;
};

export function SignInRequired({ returnTo = "/submit/steps/1" }: Props) {
  const href = `/profile/setup?redirect=${encodeURIComponent(returnTo)}` as const;
  const router = useRouter();
  const { connect: connectWeb3Auth, loading } = useWeb3AuthConnect();
  const [connecting, setConnecting] = useState(false);

  async function onSignIn() {
    try {
      setConnecting(true);
      await connectWeb3Auth();
      router.push(href);
    } catch (e) {
      // swallow; user can try again
    } finally {
      setConnecting(false);
    }
  }
  return (
    <section className="w-full max-w-[960px] mx-auto px-6 md:px-8 py-12 md:py-16 text-center">
      <div className="flex w-full items-center justify-center mb-8 md:mb-12">
        <img
          src="/assets/submit-signin-placeholder.svg"
          alt="Sign in illustration placeholder"
          className="w-[320px] md:w-[420px] h-auto opacity-90"
        />
      </div>
      <h1 className="text-white font-black leading-[1.04] text-4xl md:text-6xl mb-3">
        Please sign in to
        <br className="hidden md:block" />
        continue
      </h1>
      <p className="text-white/70 text-base md:text-lg max-w-[680px] mx-auto mb-8">
        The submit process would take about 5 mins to complete, there are 10 fields to be entered.
        You can take a look of <a href="#" className="font-semibold underline">our sample</a> on blockchain here.
      </p>
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onSignIn}
          disabled={loading || connecting}
          className="px-6 py-3 rounded-2xl bg-orange text-black font-bold disabled:opacity-60"
        >
          {loading || connecting ? "Connecting…" : "Sign in now"}
        </button>
      </div>
    </section>
  );
}
