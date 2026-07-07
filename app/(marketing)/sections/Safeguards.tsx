import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";

/* Entry 003. Constraints as ledger clauses — numbered, dry, mechanical. */
const CLAUSES = [
  { n: "3.1", title: "Credential isolation", body: "The model is handed capability, never keys. A leaked prompt cannot leak a secret." },
  { n: "3.2", title: "Permission-scoped tools", body: "Each tool carries its own boundary. The agent physically lacks the surface to overreach." },
  { n: "3.3", title: "Approval gates", body: "Refunds, deletions, outbound messages — held until a human says yes. The yes is logged too." },
  { n: "3.4", title: "Immutable audit", body: "Prompt, tool choice, call, response, timestamp. The full causal chain of every action." },
  { n: "3.5", title: "Encryption throughout", body: "At rest and in transit, tenant-isolated. One client can never bleed into another." },
];

export default function Safeguards() {
  return (
    <section id="safeguards" className="rule-b scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 004 / Safeguards
      </div>
      <div className="grid md:grid-cols-[1fr_1.4fr]">
        <div className="rule-b px-6 py-14 md:border-b-0 md:border-r md:border-rule xl:pl-20">
          <Scramble as="h2" className="display block text-4xl sm:text-5xl" text="Able to act. Unable to overreach." />
          <p className="mt-5 max-w-sm text-ash">
            Boundaries are enforced in the runtime, not requested in the prompt.
          </p>
        </div>
        <Reveal>
          <ul>
            {CLAUSES.map((c) => (
              <li key={c.n} data-reveal className="rule-b flex gap-6 px-6 py-6 last:border-b-0">
                <span className="font-mono text-xs text-acid">{c.n}</span>
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-wider text-bone">{c.title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ash">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
