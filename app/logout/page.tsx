import type { Metadata } from "next";
import LogoutSeal from "./LogoutSeal";

export const metadata: Metadata = { title: "Signing off" };

export default function LogoutPage() {
  return <LogoutSeal />;
}
