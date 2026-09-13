import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/shop/auth-card";
import { LoginForm } from "@/components/shop/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Talbeena account.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue shopping"
      footer={
        <>
          New to Talbeena?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}