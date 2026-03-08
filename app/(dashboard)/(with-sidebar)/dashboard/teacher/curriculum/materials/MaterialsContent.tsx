'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  uploadCurriculumFileAction,
  deleteCurriculumFileAction,
  getCurriculumFileDownloadUrl,
} from '@/lib/actions/curriculum';
import { CURRICULUM_MAX_FILE_SIZE } from '@/lib/curriculum/constants';
import { Download, Trash2, Upload } from 'lucide-react';
import type { CurriculumFileRow } from '@/lib/db/queries/curriculum';

type Props = {
  classId: string;
  files: CurriculumFileRow[];
  className: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/m4a': 'M4A',
    'audio/x-m4a': 'M4A',
  };
  return map[mime] ?? mime.split('/').pop() ?? 'File';
}

export function MaterialsContent({ classId, files, className }: Props) {
  const router = useRouter();
  const t = useTranslations('curriculum');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    setUploadPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('classId', classId);

    const file = formData.get('file') as File | null;
    if (!file?.size) {
      setUploadError(t('file') + ' is required.');
      setUploadPending(false);
      return;
    }
    if (file.size > CURRICULUM_MAX_FILE_SIZE) {
      setUploadError(t('fileTooBig', { max: CURRICULUM_MAX_FILE_SIZE / 1024 / 1024 }));
      setUploadPending(false);
      return;
    }

    const result = await uploadCurriculumFileAction(formData);
    setUploadPending(false);
    if (!result.success) {
      setUploadError(result.error);
      return;
    }
    setUploadOpen(false);
    router.refresh();
  }

  async function handleDownload(fileId: string) {
    const result = await getCurriculumFileDownloadUrl(fileId);
    if (result.success) {
      window.open(result.url, '_blank', 'noopener');
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1f2937] tracking-tight sm:text-2xl">
            {t('materialsTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{className}</p>
        </div>
        <Button
          onClick={() => {
            setUploadOpen(true);
            setUploadError(null);
          }}
          className="rounded-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {t('uploadMaterial')}
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
              {t('noMaterialsYet')}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-muted/30">
                      <th className="px-4 py-3 font-medium text-[#1f2937]">{t('file')}</th>
                      <th className="px-4 py-3 font-medium text-[#1f2937]">Type</th>
                      <th className="px-4 py-3 font-medium text-[#1f2937]">Size</th>
                      <th className="px-4 py-3 font-medium text-[#1f2937]">Uploaded</th>
                      <th className="px-4 py-3 font-medium text-[#1f2937]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b border-[#e5e7eb]/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-[#1f2937]">
                          {f.title ?? f.originalFilename}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {getFileType(f.mimeType)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatBytes(f.sizeBytes)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => handleDownload(f.id)}
                            >
                              <Download className="mr-1 h-3.5 w-3.5" />
                              {t('download')}
                            </Button>
                            <form action={(fd) => void deleteCurriculumFileAction(fd)} className="inline">
                              <input type="hidden" name="fileId" value={f.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                {t('delete')}
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden sm:p-6">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-[#e5e7eb] bg-white p-4"
                  >
                    <p className="font-medium text-[#1f2937]">
                      {f.title ?? f.originalFilename}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getFileType(f.mimeType)} · {formatBytes(f.sizeBytes)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-10 rounded-full"
                        onClick={() => handleDownload(f.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('download')}
                      </Button>
                      <form action={(fd) => void deleteCurriculumFileAction(fd)} className="inline">
                        <input type="hidden" name="fileId" value={f.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="min-h-10 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('delete')}
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-[#1f2937]">
              {t('uploadMaterial')}
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="curriculum-file">
                  {t('file')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="curriculum-file"
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.mp3,.m4a"
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="curriculum-title">{t('titleOptional')}</Label>
                <Input id="curriculum-title" name="title" className="w-full" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="curriculum-tag">{t('tagOptional')}</Label>
                <Input id="curriculum-tag" name="tag" className="w-full" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="curriculum-week">{t('weekOptional')}</Label>
                <Input
                  id="curriculum-week"
                  name="weekNumber"
                  type="number"
                  min={1}
                  max={52}
                  className="w-full"
                />
              </div>
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUploadOpen(false);
                    setUploadError(null);
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={uploadPending}>
                  {uploadPending ? '...' : t('upload')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
