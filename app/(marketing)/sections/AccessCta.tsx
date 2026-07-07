import Link from "next/link";
import Scramble from "../../components/Scramble";

/* Entry 005. The only loud block on the page: an acid plate, stamped. */
export default function AccessCta() {
  return (
    <section id="access" className="scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 006 / Access
      </div>
      <div className="bg-acid px-6 py-16 text-carbon xl:pl-20">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em]">Private beta</p>
        <Scramble
          as="h2"
          className="display mt-4 block max-w-3xl text-5xl sm:text-7xl"
          text="Put an operator on your software."
        />
        <p className="mt-5 max-w-md font-medium">
          Bring an API. Leave with an AI that runs the work — under rules you set.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 border border-carbon bg-carbon px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-acid transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            Request access →
          </Link>
          <Link
            href="/platform"
            className="inline-flex items-center gap-2 border border-carbon/40 px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-carbon transition-colors hover:border-carbon"
          >
            Read the schematic
          </Link>
        </div>
      </div>
    </section>
  );
}
