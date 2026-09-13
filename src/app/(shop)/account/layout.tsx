import { redirect } from "next/navigation";

import { getShopUser } from "@/queries/shop";
import { AccountNav } from "@/components/shop/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getShopUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.fullName?.split(" ")[0] ?? "friend"} 👋
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}