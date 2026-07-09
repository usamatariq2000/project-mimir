"use client";

import { useState } from "react";
import { engineRotateAuth, type CoupleAuth } from "../lib/engine";

/* Reconnect — rotate a coupled system's credential in place when its token has
   expired or was revoked, without deleting and re-coupling (which would lose the
   system's context + knowledge). Same vault guarantees: the AI never sees it. */

export default function ReconnectPanel({
  systemId,
  systemName,
  onDone,
  onClose,
}: {
  systemId: string;
  systemName: string;
  onDone: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [authType, setAuthType] = useState<CoupleAuth["type"]>("bearer");
  const [token, setToken] = useState("");
  const [header, setHeader] = useState("X-API-Key");
  const [value, setValue] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = (): CoupleAuth =>
    authType === "bearer"
      ? { type: "bearer", token }
      : authType === "api_key"
        ? { type: "api_key", header, value }
        : authType === "basic"
          ? { type: "basic", username: user, password: pass }
          : { type: "none" };

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await engineRotateAuth(systemId, build());
    setSaving(false);
    if (!res) {
      setError("Couldn't update the credential — is the engine reachable?");
      return;
    }
    await onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-carbon/90 p-6" role="dialog" aria-label="Reconnect a system">
      <div className="plate w-full max-w-md">
        <div className="rule-b flex items-center justify-between px-5 py-3">
          <p className="engrave">Reconnect · {systemName}</p>
          <button type="button" onClick={onClose} className="font-mono text-xs text-ash hover:text-bone">✕ close</button>
        </div>
        <div className="p-5">
          <p className="mb-3 text-xs text-ash">
            Rotate this system&apos;s credential — use when its token has expired or was revoked. The
            system keeps its tools, context, and history.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(["bearer", "api_key", "basic", "none"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAuthType(t)}
                className={`border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-colors ${authType === t ? "border-acid bg-acid/10 text-acid" : "border-rule text-ash hover:border-dust"}`}
              >
                {t === "api_key" ? "API key" : t}
              </button>
            ))}
          </div>
          {authType === "bearer" && (
            <input className="field mt-3 font-mono" type="password" placeholder="New bearer token" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Bearer token" autoFocus />
          )}
          {authType === "api_key" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input className="field font-mono" placeholder="Header name" value={header} onChange={(e) => setHeader(e.target.value)} aria-label="API key header" />
              <input className="field font-mono" type="password" placeholder="Key value" value={value} onChange={(e) => setValue(e.target.value)} aria-label="API key value" />
            </div>
          )}
          {authType === "basic" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input className="field font-mono" placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} aria-label="Basic auth username" />
              <input className="field font-mono" type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} aria-label="Basic auth password" />
            </div>
          )}
          <p className="mt-2 font-mono text-[0.6rem] text-dust">
            Sealed in the vault (encrypted). The AI never sees it — only the executor injects it.
          </p>
          {error && <p role="alert" className="mt-2 font-mono text-xs text-ember">{error}</p>}
          <button type="button" onClick={save} disabled={saving} className="btn-primary mt-4 w-full disabled:opacity-50">
            {saving ? "updating…" : "Update credential"}
          </button>
        </div>
      </div>
    </div>
  );
}
