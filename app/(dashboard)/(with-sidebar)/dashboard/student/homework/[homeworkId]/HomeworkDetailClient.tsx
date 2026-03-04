'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  upsertHomeworkSubmissionAction,
  uploadHomeworkSubmissionFileAction,
} from '@/lib/actions/homework';
import { Loader2, Download, Upload } from 'lucide-react';
import type { Homework, HomeworkSubmission } from '@/lib/db/schema';

type FileItem = { url: string; mimeType: string; name: string; size: number };

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}
function isAudio(mime: string): boolean {
  return mime.startsWith('audio/');
}

const ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,audio/mpeg,audio/mp3,audio/m4a,audio/x-m4a,audio/wav';
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export function HomeworkDetailClient({
  homework,
  submission,
  className,
}: {
  homework: Homework;
  submission: HomeworkSubmission | null;
  className: string;
}) {
  const t = useTranslations('homework');
  const [files, setFiles] = useState<FileItem[]>(
    (submission?.files ?? []) as FileItem[]
  );
  const [textNote, setTextNote] = useState(submission?.textNote ?? '');
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFileSelect(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    setUploading(true);
    const newFiles: FileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file) continue;
      if (file.size > MAX_SIZE) {
        setError(`File "${file.name}" is too large (max 20 MB).`);
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.set('file', file);
      const result = await uploadHomeworkSubmissionFileAction(null, formData);
      if (!result.success) {
        setError(result.error);
        setUploading(false);
        return;
      }
      newFiles.push({
        url: result.url,
        mimeType: file.type,
        name: file.name,
        size: file.size,
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData();
    formData.set('homeworkId', homework.id);
    formData.set('textNote', textNote);
    formData.set('files', JSON.stringify(files));
    const result = await upsertHomeworkSubmissionAction(null, formData);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-base">{t('instructions')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('due')}{' '}
            {homework.dueDate
              ? new Date(homework.dueDate).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : t('noDueDate')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {homework.instructions && (
            <p className="text-sm text-[#1f2937] whitespace-pre-wrap">
              {homework.instructions}
            </p>
          )}
          {homework.attachmentUrl && (
            <a
              href={homework.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#429ead] hover:underline"
            >
              <Download className="h-4 w-4" />
              {t('downloadWorksheet')}
            </a>
          )}
        </CardContent>
      </Card>

      {submission ? (
        <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base">{t('yourSubmission')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('submittedOn', {
                date: new Date(submission.submittedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.textNote && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t('note')}
                </p>
                <p className="text-sm text-[#1f2937] whitespace-pre-wrap">
                  {submission.textNote}
                </p>
              </div>
            )}
            {((submission.files ?? []) as FileItem[]).length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('files')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {((submission.files ?? []) as FileItem[]).map((f, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#e5e7eb] p-2 bg-muted/30"
                    >
                      {isImage(f.mimeType) ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={f.url}
                            alt={f.name}
                            className="w-full h-24 object-cover rounded"
                          />
                          <p className="text-xs mt-1 truncate">{f.name}</p>
                        </a>
                      ) : isAudio(f.mimeType) ? (
                        <div>
                          <audio
                            controls
                            src={f.url}
                            className="w-full max-h-10"
                          />
                          <p className="text-xs mt-1 truncate">{f.name}</p>
                        </div>
                      ) : (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#429ead] hover:underline truncate block"
                        >
                          {f.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(submission.feedback || submission.score != null) && (
              <div className="pt-4 border-t border-[#e5e7eb]">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t('teacherFeedback')}
                </p>
                {submission.feedback && (
                  <p className="text-sm text-[#1f2937] whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                )}
                {submission.score != null && (
                  <p className="text-sm font-medium text-[#7daf41] mt-2">
                    {t('scoreLabel', { score: submission.score })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-base">
            {submission ? t('resubmit') : t('submitHomework')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('uploadHint')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="files">{t('filesLabel')}</Label>
              <div
                className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                  dragOver
                    ? 'border-[#429ead] bg-[#429ead]/5'
                    : 'border-[#e5e7eb] hover:border-[#429ead]/50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {t('dragDrop')}
                </p>
                <input
                  id="files"
                  type="file"
                  accept={ACCEPT}
                  multiple
                  disabled={uploading}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <label htmlFor="files">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('browse')
                    )}
                  </Button>
                </label>
              </div>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {t('remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label htmlFor="note">{t('optionalNote')}</Label>
              <textarea
                id="note"
                value={textNote}
                onChange={(e) => setTextNote(e.target.value)}
                rows={3}
                placeholder={t('notePlaceholder')}
                className="mt-1 flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              disabled={pending || (files.length === 0 && !textNote.trim())}
              className="rounded-full"
              variant="primary"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                submission ? t('resubmit') : t('submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
