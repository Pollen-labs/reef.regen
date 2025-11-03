type Card = { title: string; color?: string; img?: string; imgAlt?: string };

export default function RegenAction() {
  const cards: Card[] = [
    { title: "Microfragmentation", color: "bg-vulcan-50" , img: "/assets/img-placeholder.png", imgAlt: "Microfragmentation" },
    { title: "Nursery", color: "bg-orange" , img: "/assets/img-placeholder.png", imgAlt: "Nursery" },
    { title: "Transplantation", color: "bg-vulcan-600" , img: "/assets/img-placeholder.png", imgAlt: "Transplantation" },
    { title: "Direct Transplant", color: "bg-vulcan-300" , img: "/assets/img-placeholder.png", imgAlt: "Direct Transplant" },
    { title: "Larval Enhancement", color: "bg-vulcan-50" , img: "/assets/img-placeholder.png", imgAlt: "Larval Enhancement" },
  ];

  return (
    <section className="relative bg-vulcan-900 text-white">
      <div className="w-full max-w-[1060px] mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-16 md:pb-16 flex flex-col items-center gap-10">
        <div className="text-center max-w-[820px]">
          <h2 className="hd-3 text-vulcan-100">
            Your regen action deserves to be seen.
          </h2>
          <p className="mt-4 text-baseb md:text-lgb text-vulcan-200">
            Whether you’re planting coral fragments, running a nursery, or organizing a community dive, your work matters. Submitting your activity helps build a verifiable map of ocean restoration and opens doors to future funding.
          </p>
        </div>

        {/* Cards grid — dynamic rows by count on large screens; 1/2 cols on smaller */}
        {(() => {
          const count = cards.length;
          const plan: Record<number, number[]> = {
            1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [2, 3], 6: [3, 3],
            7: [3, 4], 8: [4, 4], 9: [3, 3, 3], 10: [3, 3, 4], 11: [3, 4, 4], 12: [4, 4, 4],
          };
          const rows = plan[count] || (() => {
            const r: number[] = [];
            let n = count;
            while (n > 0) {
              if (n % 3 === 1 && n >= 4) { r.push(4); n -= 4; }
              else { const take = Math.min(3, n); r.push(take); n -= take; }
            }
            return r;
          })();
          const chunks: Card[][] = [];
          let i = 0;
          for (const c of rows) { chunks.push(cards.slice(i, i + c)); i += c; }
          const rowClass = (c: number) => {
            const lg = c === 1 ? "lg:grid-cols-1" : c === 2 ? "lg:grid-cols-2" : c === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
            const md = c >= 2 ? "md:grid-cols-2" : "md:grid-cols-1";
            return `grid grid-cols-1 ${md} ${lg} gap-2`;
          };
          return (
            <div className="w-full flex flex-col gap-2">
              {chunks.map((row, idx) => (
                <div key={idx} className={rowClass(row.length)}>
                  {row.map((c) => (
                    <div
                      key={c.title}
                      className={`relative min-h-[180px] rounded-3xl overflow-hidden ${c.color || "bg-vulcan-300"}`}
                    >
                      {c.img && (
                        <img src={c.img} alt={c.imgAlt || ""} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/10" aria-hidden />
                      <div className="absolute left-6 bottom-6 text-2xl font-black leading-8 tracking-tight text-black/80">
                        {c.title}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
