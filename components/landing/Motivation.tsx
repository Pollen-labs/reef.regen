export default function Motivation() {
  return (
    <section className="bg-black text-vulcan-50">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 py-20 pb-12 md:py-24 grid grid-cols-12 items-center gap-y-10 gap-x-8">
        {/* Illustration */}
        <div className="col-span-12 lg:col-span-5 min-w-0 w-full flex justify-center lg:justify-start">
          <img
            src="/assets/img-map.png"
            alt="Globe with reef markers"
            className="w-full max-w-[520px] h-auto"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Copy */}
        <div className="col-span-12 lg:col-span-7 min-w-0  lg:ml-auto">
          <p className="body-xl font-bold text-vulcan-50">
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
