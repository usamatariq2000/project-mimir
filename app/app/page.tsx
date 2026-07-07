import type { Metadata } from "next";
import CommandDeck from "./CommandDeck";

export const metadata: Metadata = { title: "Command Deck" };

export default function AppPage() {
  return <CommandDeck />;
}
