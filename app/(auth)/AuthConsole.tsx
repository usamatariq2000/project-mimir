"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { engineAuth } from "../lib/engine";

gsap.registerPlugin(useGSAP);

/* The operator handshake: one field at a time, conversational, while the
   instrument dial on the left mechanically engages ring by ring. Front-end
   only — nothing is sent anywhere. */

export interface AuthStep {
  key: string;
  prompt: string;
  placeholder: string;
  type: "text" | "email" | "password";
  logLine: string;
}

export default function AuthConsole({
  mode,
  title,
  steps,
  completeLog,
  redirectTo,
  altText,
  altHref,
  altLabel,
}: {
  mode: "login" | "register";
  title: string;
  steps: AuthStep[];
  completeLog: string;
  redirectTo: string;
  altText: string;
  altHref: string;
  altLabel: string;
}) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [value, setValue] = useState("");
  const [log, setLog] = useState<string[]>(["link opened · channel secure"]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<Record<string, string>>({});

  const step = steps[stepIndex];
  const progress = done ? 1 : stepIndex / steps.length;

  const { contextSafe } = useGSAP({ scope: root });

  const advance = contextSafe(() => {
    if (!value.trim()) {
      setError("This one’s required to proceed.");
      return;
    }
    if (step.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
      setError("That doesn’t read as an email address.");
      return;
    }
    setError(null);

    // Engage the corresponding dial ring
    gsap.to(`[data-ring="${stepIndex}"]`, {
      strokeDashoffset: 0,
      duration: 0.8,
      ease: "power2.inOut",
    });
    gsap.fromTo(
      "[data-dial-core]",
      { rotate: stepIndex * 45 },
      { rotate: (stepIndex + 1) * 45, duration: 0.8, ease: "back.out(1.4)" }
    );

    answers.current[step.key] = value;
    setLog((l) => [...l, step.logLine]);

    if (stepIndex === steps.length - 1) {
      // Final step: actually authenticate against the engine.
      const grant = contextSafe(() => {
        setDone(true);
        setLog((l) => [...l, completeLog]);
        gsap.to("[data-console]", { autoAlpha: 0, y: -12, duration: 0.4 });
        gsap.fromTo(
          "[data-granted]",
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: 0.5, delay: 0.8, ease: "power2.out" }
        );
        setTimeout(() => router.push(redirectTo), 2000);
      });
      setLog((l) => [...l, "verifying credentials…"]);
      engineAuth(mode, {
        email: answers.current.email ?? "",
        password: answers.current.password ?? "",
        name: answers.current.name,
      }).then((res) => {
        if ("error" in res) {
          setError(res.error);
          setLog((l) => [...l, "✗ " + res.error]);
          // re-open the ring so the operator can retry
          gsap.to(`[data-ring="${stepIndex}"]`, { strokeDashoffset: 2 * Math.PI * R[stepIndex], duration: 0.4 });
        } else {
          grant();
        }
      });
    } else {
      gsap.fromTo(
        "[data-console]",
        { autoAlpha: 1, x: 0 },
        {
          autoAlpha: 0,
          x: -18,
          duration: 0.22,
          onComplete: () => {
            setStepIndex((i) => i + 1);
            setValue("");
            gsap.fromTo(
              "[data-console]",
              { autoAlpha: 0, x: 18 },
              { autoAlpha: 1, x: 0, duration: 0.28 }
            );
            inputRef.current?.focus();
          },
        }
      );
    }
  });

  const R = [52, 64, 76];

  return (
    <div ref={root} className="plate grid w-full max-w-4xl overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
      {/* Instrument dial */}
      <div className="plate-graphite !rounded-none flex flex-col justify-between p-8">
        <p className="engrave-dark">Operator handshake</p>
        <div className="relative mx-auto my-8 h-44 w-44">
          <svg viewBox="0 0 176 176" className="h-full w-full" aria-hidden>
            {R.slice(0, steps.length).map((r, i) => {
              const c = 2 * Math.PI * r;
              return (
                <g key={r}>
                  <circle cx="88" cy="88" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="2" />
                  <circle
                    data-ring={i}
                    cx="88"
                    cy="88"
                    r={r}
                    fill="none"
                    stroke="#c8f31d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c}
                    transform="rotate(-90 88 88)"
                  />
                </g>
              );
            })}
          </svg>
          <div
            data-dial-core
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-gradient-to-b from-[#1a1a17] to-[#131311] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_rgba(0,0,0,0.4)]"
          >
            <span className="h-2 w-2 rotate-45 rounded-[2px] bg-gradient-to-br from-[#c8f31d] to-bronze-deep" aria-hidden />
          </div>
        </div>
        <div aria-live="polite">
          <ul className="space-y-1.5 font-mono text-[0.7rem] text-white/50">
            {log.slice(-4).map((line, i) => (
              <li key={i}>
                <span className="text-white/30">·</span> {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conversational console */}
      <div className="relative flex min-h-[26rem] flex-col justify-center p-8 sm:p-12">
        <div data-console>
          <p className="engrave">{title}</p>
          <p className="mt-6 font-mono text-xs text-steel">
            {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
          <label htmlFor="auth-input" className="display mt-2 block text-3xl">
            {step.prompt}
          </label>
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              advance();
            }}
          >
            <input
              id="auth-input"
              ref={inputRef}
              autoFocus
              type={step.type}
              value={value}
              placeholder={step.placeholder}
              onChange={(e) => setValue(e.target.value)}
              className="field"
              autoComplete={step.type === "password" ? "current-password" : step.type}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex items-center justify-between">
              <button type="submit" className="btn-primary">
                {stepIndex === steps.length - 1 ? "Engage" : "Continue"}
              </button>
              <p className="text-sm text-slate">
                {altText}{" "}
                <Link href={altHref} className="text-bronze-deep underline-offset-4 hover:underline">
                  {altLabel}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Success state */}
        <div
          data-granted
          className="pointer-events-none absolute inset-0 grid place-items-center opacity-0"
        >
          <div className="text-center">
            <span
              aria-hidden
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-hairline bg-gradient-to-b from-white to-fog shadow"
            >
              <span className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-gradient-to-br from-bronze to-bronze-deep" />
            </span>
            <p className="display mt-5 text-2xl">Access granted</p>
            <p className="mt-1 font-mono text-xs text-steel">routing to your deck…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
