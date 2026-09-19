import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { requireAdmin } from "@/queries/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPG, PNG, or WebP image." },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const fileName = `${Date.now()}-${cleanName}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${fileName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const url = body.url as string | undefined;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // Strictly restrict deletion to files inside /uploads/products/
    const prefix = "/uploads/products/";
    if (!url.startsWith(prefix)) {
      return NextResponse.json(
        { error: "Only uploaded custom product images can be deleted from disk." },
        { status: 400 },
      );
    }

    const fileName = path.basename(url);
    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "products");
    const filePath = path.resolve(uploadDir, fileName);

    // Verify the resolved path is inside uploadDir (prevent directory traversal attacks)
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }

    try {
      await fs.unlink(filePath);
    } catch (unlinkErr: unknown) {
      const code = (unlinkErr as { code?: string })?.code;
      if (code !== "ENOENT") {
        throw unlinkErr;
      }
    }

    return NextResponse.json({ success: true, message: "Image deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

