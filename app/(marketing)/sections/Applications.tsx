import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";

/* Entry 004. Use cases as a dense operator's index, not feature cards. */
const CASES = [
  { field: "Finance", ops: ["refund failed payments", "generate invoices", "flag anomalies"] },
  { field: "E-commerce", ops: ["manage orders", "reconcile inventory", "process returns"] },
  { field: "Support", ops: ["resolve tickets end-to-end", "draft replies", "close stale queues"] },
  { field: "Analytics", ops: ["answer questions against live data", "report KPIs", "watch trends"] },
  { field: "Logistics", ops: ["optimize routing", "track deliveries", "manage fleet"] },
];

export default function Applications() {
  return (
    <section id="applications" className="rule-b scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 005 / Applications
      </div>
      <div className="px-6 py-14 xl:pl-20">
        <Scramble as="h2" className="display block text-4xl sm:text-5xl" text="One layer. Every operation." />
        <Reveal className="mt-12">
          <div className="rule-t">
            {CASES.map((c, i) => (
              <div key={c.field} data-reveal className="rule-b grid grid-cols-[3rem_10rem_1fr] items-baseline gap-4 px-2 py-5 transition-colors hover:bg-soot sm:grid-cols-[4rem_14rem_1fr]">
                <span className="font-mono text-xs text-dust">4.{i + 1}</span>
                <span className="display text-lg text-bone sm:text-xl">{c.field}</span>
                <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ash">
                  {c.ops.join(" / ")}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
