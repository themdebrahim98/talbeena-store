import { NextResponse } from "next/server";

import { newsletterSchema } from "@/validations/newsletter";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 },
    );
  }

  const email = parsed.data.email;

  // Passively collect signups in dev; wire this to an provider/CDP later.
  if (process.env.NODE_ENV === "development") {
    console.info(`[newsletter] new subscriber: ${email}`);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}