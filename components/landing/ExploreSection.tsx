export default function ExploreSection() {
  return (
    <section className="bg-vulcan-900 text-white">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-24 py-8 pb-32">
        <div className="rounded-3xl bg-vulcan-800 px-6 py-12 md:px-10 md:py-12 grid grid-cols-12 items-center gap-6">
          <div className="col-span-12 md:col-span-6 min-w-0">
          <h3 className="hd-4 text-white">
            Discover coral restoration around the world
          </h3>
            <p className="mt-2 text-baseb text-vulcan-200">
              Dive into the map to explore attested reef regeneration actions by location, date, and contributor.
            </p>
            <a
              href="/map"
              className="mt-6 inline-flex rounded-2xl px-6 py-2 border-4 border-orange text-white font-bold hover:bg-white/5"
            >
              Explore the Map
            </a>
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="rounded-2xl relative" aria-hidden="true">
              {/* Aspect box ensures consistent sizing across breakpoints */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src="/assets/img-explore.svg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain object-right select-none pointer-events-none"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
