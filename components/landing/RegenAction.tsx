type Card = { title: string; img: string; imgAlt: string };

export default function RegenAction() {
  const cards: Card[] = [
    { title: "Hybridization",     img: "/assets/img-regen-tube.svg", imgAlt: "Hybridization" },
    { title: "Nursery Phase",     img: "/assets/img-regen-ban.svg",  imgAlt: "Nursery phase" },
    { title: "Transplantation",   img: "/assets/img-regen-2punk.svg",imgAlt: "Transplantation" },
    { title: "Artificial reef",   img: "/assets/img-regen-arti.svg", imgAlt: "Artificial reef" },
    { title: "Microfragmentation",img: "/assets/img-regen-sun.svg",  imgAlt: "Microfragmentation" },
  ];

  return (
    <section className="relative bg-vulcan-900 text-white">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-24 pt-24 md:pt-32 pb-16 md:pb-16 flex flex-col items-center gap-10">
        <div className="text-center max-w-[820px]">
          <h2 className="hd-3 text-vulcan-100">
            Your regen action deserves to be seen.
          </h2>
          <p className="mt-4 text-baseb md:text-lgb text-vulcan-200">
            Whether you’re planting coral fragments, running a nursery, or organizing a community dive, your work matters. Submitting your activity helps build a verifiable map of ocean restoration and opens doors to future funding.
          </p>
        </div>
        {/* Cards grid — 12‑column layout: 3 on first row, 2 wide on second */}
        <div className="grid grid-cols-12 gap-4 w-full">
          {cards.map((c, idx) => {
            const lgSpan = idx < 3 ? "lg:col-span-4" : "lg:col-span-6"; // 3 then 2
            return (
              <div key={c.title} className={`col-span-12 sm:col-span-6 ${lgSpan}`}>
                <div className="h-[260px] md:h-[260px] rounded-3xl bg-black overflow-hidden grid grid-rows-[1fr_auto]">
                  {/* Sticker image (row 1) */}
                  <div className="grid place-items-center pt-6">
                    <img
                      src={c.img}
                      alt={c.imgAlt}
                      className="h-36 md:h-40 w-auto object-contain select-none pointer-events-none"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {/* Title (row 2, naturally at bottom) */}
                  <div className="px-6 pb-6 text-2xl md:text-2xl text-center font-black tracking-hd text-white">
                    {c.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
