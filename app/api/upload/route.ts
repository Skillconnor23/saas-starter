import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { getUser } from "@/lib/db/queries";

/** Allowed MIME types: images and PDFs only. */
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Not signed in" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large (max 10 MB)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return new Response(
        JSON.stringify({
          error: "Invalid file type. Allowed: images (PNG, JPG) and PDF only.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      return new Response(
        JSON.stringify({ error: "Storage not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
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
