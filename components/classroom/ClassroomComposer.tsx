'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createClassroomPostAction,
  uploadClassroomFileAction,
} from '@/lib/actions/classroom';
import { Loader2 } from 'lucide-react';
import { classroomPostTypeEnum } from '@/lib/db/schema';

const TYPE_LABELS: Record<string, string> = {
  homework: 'Homework',
  test: 'Test',
  recording: 'Recording',
  announcement: 'Announcement',
  document: 'Document',
};

export function ClassroomComposer({
  classId,
  defaultType = 'announcement',
}: {
  classId: string;
  defaultType?: string;
}) {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'link' | 'upload'>(defaultType === 'recording' ? 'link' : 'upload');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      let fileUrl: string | null = null;
      if (mode === 'upload') {
        if (!file?.size) {
          setError('Please select a file to upload.');
          setPending(false);
          return;
        }
        const formData = new FormData();
        formData.set('file', file);
        const uploadResult = await uploadClassroomFileAction(null, formData);
        if (!uploadResult.success) {
          setError(uploadResult.error);
          setPending(false);
          return;
        }
        fileUrl = uploadResult.url;
      }

      const postForm = new FormData();
      postForm.set('classId', classId);
      postForm.set('type', type);
      if (title.trim()) postForm.set('title', title.trim());
      if (body.trim()) postForm.set('body', body.trim());
      if (fileUrl) postForm.set('fileUrl', fileUrl);
      if (mode === 'link' && linkUrl.trim()) {
        const url = linkUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          postForm.set('linkUrl', `https://${url}`);
        } else {
          postForm.set('linkUrl', url);
        }
      }

      await createClassroomPostAction(null, postForm);
      // Action redirects to /classroom/[classId] on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add to feed</CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a document or add a recording link.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                const v = e.target.value;
                setType(v);
                if (v === 'recording') setMode('link');
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {classroomPostTypeEnum.filter((t) => t !== 'quiz').map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3 handout"
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Brief note..."
              rows={2}
              className="flex w-full max-w-md rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'upload'}
                onChange={() => setMode('upload')}
                className="rounded-full border-input"
              />
              <span className="text-sm">Upload file</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === 'link'}
                onChange={() => setMode('link')}
                className="rounded-full border-input"
              />
              <span className="text-sm">Add link</span>
            </label>
          </div>

          {mode === 'upload' && (
            <div className="space-y-2">
              <Label htmlFor="file">File (PDF, DOCX, PNG, JPG — max 10 MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,image/png,image/jpeg,image/jpg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {mode === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="max-w-md"
                required={mode === 'link'}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Post'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
