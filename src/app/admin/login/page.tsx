import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

import { getShopUser } from "@/queries/shop";
import { AuthCard } from "@/components/shop/auth-card";
import { AdminLoginForm } from "@/app/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getShopUser();

  if (user?.role === "admin") redirect("/admin");

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-4 py-12">
      {user && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-1.5 text-center text-sm text-destructive">
          Your account does not have admin access. Please sign in with a staff account.
        </p>
      )}
      <AuthCard
        title="Admin sign in"
        subtitle="Restricted to team members only"
        footer={
          <Link href="/" className="font-medium text-primary hover:underline">
            Back to the store
          </Link>
        }
      >
        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <Shield className="size-4" />
          <span className="text-xs">Protected area — staff accounts only</span>
        </div>
        <AdminLoginForm />
      </AuthCard>
    </div>
  );
}