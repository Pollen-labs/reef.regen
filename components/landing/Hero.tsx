export default function Hero() {
  return (
    <section className="relative isolate bg-black text-white">
      <div className="mx-auto w-full max-w-[1060px] px-6 md:px-10 pt-16 pb-20 md:pt-20 md:pb-28 flex flex-col items-stretch gap-8">
        {/* Heading + Image: stack on mobile, two columns on desktop */}
        <div className="w-full flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="min-w-0 text-left md:text-right md:basis-[65%] md:grow-0 md:shrink-0">
            <h1 className="hd-1">
              Make
              <br />
              every coral
              <br />
              count
            </h1>
          </div>
          <div className="w-full flex justify-center md:justify-end md:basis-[35%] md:grow-0 md:shrink-0">
            <img
              src="/assets/img-hero.svg"
              alt="Reef.Regen hero illustration"
              className="h-64 md:h-80 w-auto"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Body text + CTA */}
        <div className="w-full max-w-[820px] self-center flex flex-col items-center gap-6">
          <p className="text-center text-baseb md:text-xlb font-light text-white/90">
            Reef.Regen empowers communities, scientists, and organizations to document and verify coral restoration actions on the blockchain. Together, we’re building an open, transparent record of ocean impact.
          </p>
          <a
            href="/attest"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-8 py-2.5 font-bold leading-8 hover:opacity-95"
          >
            Create a regen attestation
          </a>
        </div>
      </div>
    </section>
  );
}
