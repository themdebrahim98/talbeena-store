import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/shop/auth-card";
import { RegisterForm } from "@/components/shop/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join Talbeena and get healthy foods delivered to your door.",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Talbeena for faster checkout and order tracking"
      className="max-w-lg"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}