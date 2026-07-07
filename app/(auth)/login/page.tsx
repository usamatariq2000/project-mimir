import type { Metadata } from "next";
import AuthConsole from "../AuthConsole";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthConsole
      mode="login"
      title="Returning operator"
      steps={[
        {
          key: "email",
          prompt: "State your identity.",
          placeholder: "you@company.com",
          type: "email",
          logLine: "identity received · locating operator",
        },
        {
          key: "password",
          prompt: "Present your key.",
          placeholder: "••••••••••••",
          type: "password",
          logLine: "key accepted · rings aligned",
        },
      ]}
      completeLog="handshake complete · deck unlocked"
      redirectTo="/app"
      altText="New here?"
      altHref="/signup"
      altLabel="Get access"
    />
  );
}
