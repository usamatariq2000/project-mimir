import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";

/* Entry 001. The one thing a first-time visitor must understand:
   assistants talk about the work — Mimir is connected to your systems
   and does the work. Same request, both answers, side by side. */

const REQUEST = "Refund the failed payments from yesterday";

export default function TheDifference() {
  return (
    <section id="difference" className="rule-b scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 001 / Read this first
      </div>
      <div className="px-6 py-14 xl:pl-20">
        <Scramble
          as="h2"
          className="display block max-w-3xl text-4xl sm:text-6xl"
          text="It doesn't tell you how. It does it."
        />
        <p className="mt-5 max-w-lg text-ash">
          You've used AI that answers questions about your business. Mimir is
          connected to your actual systems — so the same sentence that would get
          you advice gets you a finished operation instead.
        </p>

        <Reveal className="mt-12 grid gap-px bg-rule-soft lg:grid-cols-2">
          {/* The usual assistant */}
          <div data-reveal className="bg-carbon p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="engrave">A typical AI assistant</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-dust">talks</p>
            </div>
            <div className="plate-sunken mt-5 p-5 font-mono text-xs leading-6">
              <p className="text-bone">❯ {REQUEST}</p>
              <p className="mt-4 text-ash">
                “Here's how you can process those refunds:
                <br />
                1. Log into your Stripe dashboard
                <br />
                2. Go to Payments and filter by ‘failed’
                <br />
                3. Cross-reference each with your orders
                <br />
                4. Open each payment and click Refund
                <br />
                5. Email each customer to confirm…”
              </p>
            </div>
            <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-ember">
              → a to-do list. The work is still yours.
            </p>
          </div>

          {/* Mimir */}
          <div data-reveal className="bg-carbon p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="engrave">Mimir, wired into your systems</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-acid">acts</p>
            </div>
            <div className="plate-sunken mt-5 p-5 font-mono text-xs leading-6">
              <p className="text-bone">❯ {REQUEST}</p>
              <div className="mt-4 space-y-1.5">
                <p className="text-ash">01 &nbsp;get_payments() <span className="text-acid">✓ 12 found</span></p>
                <p className="text-ash">02 &nbsp;get_orders() <span className="text-acid">✓ matched</span></p>
                <p className="text-ash">03 &nbsp;refund_payment() ×12 <span className="text-acid">✓ $1,847.20</span></p>
                <p className="text-ash">04 &nbsp;reply_ticket() ×12 <span className="text-acid">✓ customers told</span></p>
                <p className="mt-2 border-l-2 border-acid pl-3 text-bone">
                  Done. 12 refunds issued, customers notified, every step logged.
                </p>
              </div>
            </div>
            <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-acid">
              → the work is done. You approved one step.
            </p>
          </div>
        </Reveal>

        <p className="mt-8 max-w-xl text-sm leading-relaxed text-ash">
          That's the whole idea: your software's capabilities become actions an
          AI can take on your behalf — with your permission rules, your red
          lines, and a record of everything. You talk to it. It operates.
        </p>
      </div>
    </section>
  );
}
