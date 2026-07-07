import { Marquee } from "@/components/ui/marquee";

/* The audit log as a living column — entries stream upward forever.
   Nothing on this page is more honest than this. */
const LINES = [
  ["14:02:11.204", "intent received", "u.tariq"],
  ["14:02:11.688", "tool selected — refund_payment", "runtime"],
  ["14:02:12.101", "approval granted", "u.tariq"],
  ["14:02:12.532", "POST /v1/refunds → 200", "engine"],
  ["14:02:12.540", "record sealed", "audit"],
  ["14:05:03.017", "intent received", "a.chen"],
  ["14:05:03.552", "tool selected — get_orders", "runtime"],
  ["14:05:04.104", "GET /admin/orders → 200", "engine"],
  ["14:05:04.111", "record sealed", "audit"],
  ["14:09:41.900", "rate limit respected — queued 2s", "engine"],
  ["14:09:44.213", "reply_ticket drafted", "runtime"],
  ["14:09:47.850", "approval granted", "u.tariq"],
];

export default function AuditFeed() {
  return (
    <div className="relative h-full overflow-hidden [mask-image:linear-gradient(180deg,transparent,white_18%,white_82%,transparent)]">
      <Marquee vertical className="[--duration:26s] h-full">
        {LINES.map((l, i) => (
          <div
            key={i}
            className="rule-b grid grid-cols-[7rem_1fr_auto] gap-3 py-2.5 font-mono text-[0.68rem]"
          >
            <span className="text-dust">{l[0]}</span>
            <span className="text-ash">{l[1]}</span>
            <span className="text-acid">{l[2]}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
