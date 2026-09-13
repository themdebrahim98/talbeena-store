import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { ChangePasswordForm } from "@/components/shop/account/change-password-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: true },
};

export default function AccountSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}