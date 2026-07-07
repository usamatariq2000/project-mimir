"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* Renders an assistant reply as themed Markdown — headings, lists, bold, code —
   in the Operations Ledger palette. Used for streamed and finalized replies alike. */
export default function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ash">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <p className="display text-base text-bone">{children}</p>,
          h2: ({ children }) => <p className="display text-sm text-bone">{children}</p>,
          h3: ({ children }) => (
            <p className="font-mono text-[0.7rem] uppercase tracking-wider text-acid">{children}</p>
          ),
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-bone">{children}</strong>,
          em: ({ children }) => <em className="text-bone/90">{children}</em>,
          ul: ({ children }) => <ul className="ml-1 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-1 space-y-1">{children}</ol>,
          li: ({ children }) => (
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 bg-acid" aria-hidden />
              <span>{children}</span>
            </li>
          ),
          code: ({ children }) => (
            <code className="bg-carbon px-1 py-0.5 font-mono text-[0.72rem] text-acid">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto border border-rule-soft bg-carbon p-3 font-mono text-[0.72rem] text-bone">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-acid underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
