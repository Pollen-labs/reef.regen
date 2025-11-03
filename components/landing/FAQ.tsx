const faqs = [
  {
    q: "What is Reef.Regen?",
    a: "Reef.Regen is a decentralized platform for documenting and verifying coral restoration actions using blockchain attestations.",
  },
  {
    q: "Do I need blockchain experience to use it?",
    a: "No. You can log in with Google, Apple, or LinkedIn; your wallet is created automatically and we cover the transaction gas.",
  },
  {
    q: "Who can submit a restoration action?",
    a: "Anyone. From community groups to NGOs, dive shops, or individual volunteers.",
  },
  {
    q: "What happens after I submit an action?",
    a: "Your submission is stored as a verifiable record on Ethereum (Optimism network) and appears on the public reef map.",
  },
  {
    q: "Can I attach evidence or data?",
    a: "Yes. You can include photos, reports, or other files (up to 5MB) to support your attestation.",
  },
  {
    q: "Is Reef.Regen free to use?",
    a: "Yes. All transactions are gasless; you don’t pay any blockchain fees.",
  },
  {
    q: "Why does the logo look like fries?",
    a: "Our logo is actually inspired by the Red Sea Finger coral (Alcyonium glomeratum), a vibrant soft coral with branching, finger like shapes. Its playful form reminded us of something familiar and friendly, like a bunch of fries shared among friends. That’s exactly the feeling we want Reef.Regen to evoke: an open, welcoming space where people can hang out, share their coral restoration work, and learn from one another. Just like sharing fries, it’s casual, joyful, and all about coming together for a shared purpose.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-black text-white">
      <div className="w-full max-w-[1060px] mx-auto px-6 md:px-10 pt-20 pb-20 flex flex-col items-center gap-8">
        {/* Overlapping mascot from previous section */}
        <img
          src="/assets/Logo-face-left.svg"
          alt=""
          aria-hidden
          className="w-40 md:w-48 -mt-30 md:-mt-40"
        />
        <h3 className="hd-5 text-center text-white">
          Frequently Asked Questions
        </h3>

        <dl className="w-full grid gap-6">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 p-6">
              <dt className="text-xl md:text-2xl font-black leading-8 text-white">
                {f.q}
              </dt>
              <dd className="mt-2 text-baseb md:text-lgb text-vulcan-200">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
