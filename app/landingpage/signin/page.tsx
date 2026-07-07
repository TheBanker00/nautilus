import type { Metadata } from "next";
import SignIn from "../../components/SignIn";

export const metadata: Metadata = {
  title: "Sign In — Nautilius Money",
  description:
    "Sign in to your Nautilius Financial Command Center. See today, plan tomorrow, build wealth.",
};

export default function SignInPage() {
  return <SignIn />;
}