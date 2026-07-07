"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* First-login walkthrough (driver.js), covering the whole deck: command
   surface, systems, then the tour flips to the Monitor tab for liveness,
   API updates, and the activity ledger. Replayable from the [?] button. */

type SetTab = (t: "deck" | "monitor") => void;

const TAB_SWITCH_INDEX = 3; // the "Deck & Monitor" step — Next crosses into the Monitor tab

export function startTour(setTab: SetTab) {
  const d = driver({
    popoverClass: "mimir-tour",
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Take the deck",
    overlayColor: "rgba(12, 12, 10, 0.85)",
    stagePadding: 6,
    onNextClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (i === TAB_SWITCH_INDEX) {
        setTab("monitor");
        setTimeout(() => d.moveNext(), 420);
      } else {
        d.moveNext();
      }
    },
    onPrevClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (i === TAB_SWITCH_INDEX + 1) {
        setTab("deck");
        setTimeout(() => d.movePrevious(), 420);
      } else {
        d.movePrevious();
      }
    },
    onDestroyed: () => {
      localStorage.setItem("mimir.tourDone", "1");
      setTab("deck");
    },
    steps: [
      {
        element: "[data-tour='intent']",
        popover: {
          title: "State your intent",
          description:
            "This line is the whole product. Type what you want done in plain language — Mimir picks the tools and runs the operation in your systems.",
        },
      },
      {
        element: "[data-tour='samples']",
        popover: {
          title: "Or borrow one",
          description: "Sample intents to get a feel for what an operator can ask.",
        },
      },
      {
        element: "[data-tour='systems']",
        popover: {
          title: "Your coupled systems",
          description:
            "Everything Mimir can reach. Click a system to confine the operator to it — it becomes mechanically unable to touch anything else.",
        },
      },
      {
        element: "[data-tour='tabs']",
        popover: {
          title: "Deck & Monitor",
          description:
            "The Deck runs commands. The Monitor watches them. Next takes you there.",
        },
      },
      {
        element: "[data-tour='liveness']",
        popover: {
          title: "System liveness",
          description:
            "Live health for every coupled system — latency, 30-day uptime, incidents. The deck also pings all of this at every login before it unlocks.",
        },
      },
      {
        element: "[data-tour='update']",
        popover: {
          title: "Keep tools current",
          description:
            "When a system's API changes, Update APIs scans the spec, shows you exactly what's new, and regenerates the tools on apply.",
        },
      },
      {
        element: "[data-tour='activity']",
        popover: {
          title: "The activity ledger",
          description:
            "Every operation ever run — who asked, which systems acted, what was held for approval. Your session's runs land here too.",
        },
      },
      {
        element: "[data-tour='logout']",
        popover: {
          title: "Seal the session",
          description:
            "Done operating? Logging out files open records and seals the audit tape. That's the tour — take the deck.",
        },
      },
    ],
  });
  d.drive();
  return d;
}

export default function TourGuide({ ready, setTab }: { ready: boolean; setTab: SetTab }) {
  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem("mimir.tourDone")) return;
    const t = setTimeout(() => startTour(setTab), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}
