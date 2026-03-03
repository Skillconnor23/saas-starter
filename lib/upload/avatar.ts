/**
 * Type-safe avatar upload validation.
 * Allowed: PNG, JPG, JPEG, WEBP. Max 2MB.
 */
export const AVATAR_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export type AvatarAllowedMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export function isAllowedAvatarMimeType(
  mimeType: string
): mimeType is AvatarAllowedMimeType {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateAvatarFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file.size) return { ok: false, error: 'File is empty.' };
  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return { ok: false, error: 'File too large (max 2 MB).' };
  }
  if (!isAllowedAvatarMimeType(file.type)) {
    return {
      ok: false,
      error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP.',
    };
  }
  return { ok: true };
}
