'use client';

import { useActionState, useRef, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  updateMyProfileAction,
  uploadAvatarAction,
  updateAvatarUrlAction,
} from '@/lib/actions/profile';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
import { Loader2, Upload } from 'lucide-react';

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

type Props = {
  user: { id: number; name: string | null; email: string; avatarUrl?: string | null };
  roleLabel: string;
};

export function ProfileCard({ user, roleLabel }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => updateMyProfileAction(_prev, formData),
    null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      setUploadError(null);
      setUploadPending(true);
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const formData = new FormData();
      formData.set('file', file);
      const result = await uploadAvatarAction(null, formData);
      if (result.success) {
        const updateResult = await updateAvatarUrlAction(result.url);
        if (updateResult.success) {
          setAvatarUrl(result.url);
        } else {
          setUploadError(updateResult.error);
        }
      } else {
        setUploadError(result.error);
      }
      setUploadPending(false);
    },
    []
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid file type. Use PNG, JPG, or WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File too large (max 2 MB).');
      return;
    }
    setUploadError(null);
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCropConfirm(blob: Blob) {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    uploadBlob(blob);
  }

  function handleCropCancel() {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="text-xl">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {roleLabel}
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadPending}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Change photo
                  </>
                )}
              </Button>
            </div>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name ?? ''}
              placeholder="Your name"
              className="max-w-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </Card>
  );
}
