import type { Metadata } from "next";
import AuthConsole from "../AuthConsole";

export const metadata: Metadata = { title: "Get access" };

export default function SignupPage() {
  return (
    <AuthConsole
      mode="register"
      title="New operator"
      steps={[
        {
          key: "name",
          prompt: "Who’s taking the controls?",
          placeholder: "Your full name",
          type: "text",
          logLine: "operator registered",
        },
        {
          key: "email",
          prompt: "Where do we reach you?",
          placeholder: "you@company.com",
          type: "email",
          logLine: "identity anchored",
        },
        {
          key: "password",
          prompt: "Cut your key.",
          placeholder: "A strong passphrase",
          type: "password",
          logLine: "key cut · rings aligned",
        },
      ]}
      completeLog="credentials sealed · commissioning next"
      redirectTo="/onboarding"
      altText="Already an operator?"
      altHref="/login"
      altLabel="Log in"
    />
  );
}
