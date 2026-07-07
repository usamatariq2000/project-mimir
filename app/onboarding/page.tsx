import type { Metadata } from "next";
import CommissioningFlow from "./CommissioningFlow";

export const metadata: Metadata = { title: "Commissioning" };

export default function OnboardingPage() {
  return <CommissioningFlow />;
}
