export default function Hero() {
  return (
    <section className="relative isolate bg-black text-white">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 pt-8 pb-12 md:pt-20 md:pb-28 flex flex-col items-stretch gap-8">
        {/* Heading + Image: stack on mobile, 12-col grid on desktop */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 items-end gap-6">
          <div className="min-w-0 text-center md:text-right md:col-span-7">
            <h1 className="hd-1">
              Make
              <br />
              every coral
              <br />
              count
            </h1>
          </div>
          <div className="w-full flex justify-center md:justify-start md:col-span-5 md:-mt-8 lg:-mt-12">
            <img
              src="/assets/img-hero.svg"
              alt="Reef.Regen hero illustration"
              className="h-[380px] md:h-[380px] lg:h-[480px] w-auto select-none pointer-events-none"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Body text + CTA */}
        <div className="w-full max-w-[820px] self-center flex flex-col items-center gap-6">
          <p className="text-center text-xlb md:text-xlb font-light text-white/90">
            Reef.Regen empowers communities, scientists, and organizations to document and verify coral restoration actions on the blockchain. Together, we’re building an open, transparent record of ocean impact.
          </p>
          <a
            href="/submit/steps/1"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-8 py-2.5 font-bold leading-8 hover:opacity-95"
          >
            Create a regen attestation
          </a>
        </div>
      </div>
    </section>
  );
}
