import type { Metadata } from "next";
import SignUp from "../../components/SignUp";

export const metadata: Metadata = {
  title: "Get Started — Nautilus Money",
  description: "Create your Nautilus Money account and start navigating your financial future.",
};

export default function SignUpPage() {
  return <SignUp />;
}
