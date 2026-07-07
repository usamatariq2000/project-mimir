import LedgerRail from "../components/LedgerRail";
import Hero from "./sections/Hero";
import TapeDivider from "./sections/TapeDivider";
import TheDifference from "./sections/TheDifference";
import ToolLedger from "./sections/ToolLedger";
import ExecutionDemo from "./sections/ExecutionDemo";
import Safeguards from "./sections/Safeguards";
import Applications from "./sections/Applications";
import AccessCta from "./sections/AccessCta";

export default function HomePage() {
  return (
    <div className="xl:pl-14">
      <LedgerRail />
      <Hero />
      <TapeDivider />
      <TheDifference />
      <ToolLedger />
      <ExecutionDemo />
      <Safeguards />
      <Applications />
      <TapeDivider />
      <AccessCta />
    </div>
  );
}
