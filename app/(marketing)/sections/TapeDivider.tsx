import { Marquee } from "@/components/ui/marquee";
import { SYSTEMS } from "../../lib/mock-data";

/* The operations tape: a ticker of executed tool calls running between
   entries, like a stock tape for your software. */
export default function TapeDivider() {
  const tools = SYSTEMS.flatMap((s) => s.tools.map((t) => ({ ...t, system: s.name })));

  return (
    <div className="rule-b bg-soot">
      <Marquee className="[--duration:40s] [--gap:0px] py-2.5">
        {tools.map((t, i) => (
          <span
            key={t.system + t.name}
            className="flex items-center font-mono text-[0.7rem] uppercase tracking-[0.1em]"
          >
            <span className="px-4 text-dust">{String(i + 1).padStart(3, "0")}</span>
            <span className="text-bone">{t.name}()</span>
            <span className="px-2 text-dust">·</span>
            <span className="text-ash">{t.system}</span>
            <span className="px-2 text-dust">·</span>
            <span className={t.permission === "approval" ? "text-ember" : "text-acid"}>
              {t.permission === "approval" ? "gated" : "auto"}
            </span>
            <span className="pl-4 text-dust">/</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
