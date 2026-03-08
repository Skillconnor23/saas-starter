import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2, getR2Bucket, getR2PublicBaseUrl } from "@/lib/r2";
import { requireApiAuth } from "@/lib/auth/api-auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  UPLOAD_API_MAX_BYTES,
  UPLOAD_API_ALLOWED,
} from "@/lib/upload/constants";
import { validateUpload, sanitizeStorageFilename } from "@/lib/upload/validate";

export async function POST(req: Request) {
  try {
    const auth = await requireApiAuth();
    if (auth.response) return auth.response;

    if (!checkRateLimit("upload", String(auth.user.id))) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = validateUpload(
      buffer,
      file.type || "application/octet-stream",
      file.name || "",
      UPLOAD_API_ALLOWED,
      UPLOAD_API_MAX_BYTES
    );

    if (!result.ok) {
      const status = result.error.includes("Invalid") || result.error.includes("does not match")
        ? 415
        : 400;
      return NextResponse.json(
        { error: result.error },
        { status, headers: { "Content-Type": "application/json" } }
      );
    }

    const safeName = sanitizeStorageFilename(file.name || "file");
    const key = `uploads/${Date.now()}-${safeName}`;
    const baseUrl = getR2PublicBaseUrl();
    const publicUrl = `${baseUrl}/${key}`;
    const bucket = getR2Bucket();
    const client = getR2();

    const contentType = UPLOAD_API_ALLOWED.find((e) => e.mime === file.type)?.mime ?? file.type;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return Response.json({ key, publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Upload failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
