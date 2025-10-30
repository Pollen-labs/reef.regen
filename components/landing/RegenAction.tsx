export default function RegenAction() {
  const cards = [
    { title: "Microfragmentation", color: "bg-vulcan-50" },
    { title: "Nursery", color: "bg-orange" },
    { title: "Transplantation", color: "bg-vulcan-600" },
    { title: "Direct Transplant", color: "bg-vulcan-300" },
    { title: "Larval Enhancement", color: "bg-vulcan-50" },
  ];

  return (
    <section className="relative bg-vulcan-900 text-white">
      <div className="w-full max-w-[1060px] mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-10 md:pb-16 flex flex-col items-center gap-10">
        <div className="text-center max-w-[820px]">
          <h2 className="hd-3 text-vulcan-100">
            Your regen action deserves to be seen.
          </h2>
          <p className="mt-4 text-baseb md:text-lgb text-vulcan-200">
            Whether you’re planting coral fragments, running a nursery, or organizing a community dive, your work matters. Submitting your activity helps build a verifiable map of ocean restoration and opens doors to future funding.
          </p>
        </div>

        {/* Cards grid (wraps on small screens) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className={`relative min-h-[180px] rounded-3xl overflow-hidden ${c.color}`}
            >
              <div className="absolute inset-4 rounded-2xl bg-black/10" aria-hidden />
              <div className="absolute left-6 bottom-6 text-2xl font-black leading-8 tracking-tight text-black/80">
                {c.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
