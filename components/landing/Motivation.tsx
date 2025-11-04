export default function Motivation() {
  return (
    <section className="bg-black text-vulcan-50">
      <div className="mx-auto w-full max-w-[1120px] px-6 md:px-10 py-20 pb-12 md:py-24 flex flex-col md:flex-row items-center gap-10">
        {/* Illustration */}
        <div className="flex-1 min-w-0 w-full flex justify-center md:justify-start">
          <img
            src="/assets/img-motivation-earth.svg"
            alt="Globe with reef markers"
            className="w-full max-w-[520px] h-auto"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0 max-w-[640px]">
          <p className="body-2xl font-bold text-vulcan-50">
            Coral reefs are disappearing at an alarming rate, and while countless restoration projects are happening worldwide, their stories remain scattered and hard to verify.
            <br />
            <br />
            Reef.Regen solves this by creating a <span className="text-orange font-bold">simple, permissionless way to log and prove restoration efforts,</span> all visible to the public and secured on the Ethereum blockchain.
            <br />
            <br />
            By connecting traditional conservation work with decentralized technology, we’re making coral restoration transparent, traceable, and fundable.
          </p>
        </div>
      </div>
    </section>
  );
}
