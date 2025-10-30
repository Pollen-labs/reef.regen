export default function ExploreSection() {
  return (
    <section className="bg-vulcan-900 text-white">
      <div className="mx-auto w-full max-w-[1120px] px-6 md:px-10 py-14">
        <div className="rounded-3xl bg-vulcan-800 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 min-w-0">
          <h3 className="hd-6 text-white">
            Discover coral restoration around the world
          </h3>
            <p className="mt-2 text-baseb text-vulcan-200">
              Dive into the map to explore verified reef regeneration actions by location, date, and contributor.
            </p>
            <a
              href="/map"
              className="mt-6 inline-flex rounded-2xl px-6 py-2 border-4 border-orange text-white font-bold hover:bg-white/5"
            >
              Explore the Map
            </a>
          </div>
          <div className="flex-1 w-full h-40 md:h-48 rounded-2xl bg-vulcan-700" aria-hidden />
        </div>
      </div>
    </section>
  );
}
