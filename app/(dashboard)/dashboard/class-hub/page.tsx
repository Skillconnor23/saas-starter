'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, FileVideo, FileText, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';

// Mock data - replace with API when ready
const MOCK_NEXT_CLASS = {
  title: 'English Speaking - Level 2',
  scheduledAt: new Date(Date.now() + 1000 * 60 * 8), // 8 mins from now
  meetingLink: 'https://meet.example.com/class-123',
};

const MOCK_LATEST_RECORDING = {
  title: 'English Speaking - Level 2',
  recordedAt: 'Last Saturday',
  url: '#',
};

const MOCK_HOMEWORK = [
  { id: '1', title: 'Reading: Ben and Sarah', completed: false },
  { id: '2', title: 'Practice sentences', completed: true },
];

function useCanJoinClass(scheduledAt: Date) {
  return useMemo(() => {
    const now = new Date();
    const tenMinsBefore = new Date(scheduledAt.getTime() - 10 * 60 * 1000);
    return now >= tenMinsBefore && now <= new Date(scheduledAt.getTime() + 60 * 60 * 1000);
  }, [scheduledAt]);
}

function formatNextClassTime(date: Date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 0) return 'In progress';
  if (diffMins < 60) return `In ${diffMins} minutes`;
  const diffHours = Math.floor(diffMins / 60);
  return `In ${diffHours}h ${diffMins % 60}m`;
}

export default function ClassHubPage() {
  const canJoin = useCanJoinClass(MOCK_NEXT_CLASS.scheduledAt);
  const [homeworkFiles, setHomeworkFiles] = useState<string[]>([]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).map((f) => f.name);
    setHomeworkFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).map((f) => f.name) : [];
    setHomeworkFiles((prev) => [...prev, ...files]);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-[#3d4236] mb-12">
        What do I do right now?
      </h1>

      {/* Join Class - High visibility */}
      <div className="mb-16">
        <Button
          asChild
          variant="primary"
          disabled={!canJoin}
          className={`w-full py-6 text-lg ${
            canJoin ? '' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <a
            href={canJoin ? MOCK_NEXT_CLASS.meetingLink : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={!canJoin ? 'pointer-events-none' : ''}
          >
            <Video className="mr-2 h-6 w-6" />
            Join Class
          </a>
        </Button>
        {!canJoin && (
          <p className="mt-3 text-center text-sm text-[#5a5f57]">
            Available 10 minutes before class starts
          </p>
        )}
      </div>

      {/* Next Class + Latest Recording */}
      <div className="space-y-12">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-medium text-[#3d4236]">
              Next Class
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="text-[#3d4236]">
              <p className="font-medium">{MOCK_NEXT_CLASS.title}</p>
              <p className="text-sm text-[#5a5f57] mt-1">
                {formatNextClassTime(MOCK_NEXT_CLASS.scheduledAt)} ·{' '}
                {MOCK_NEXT_CLASS.scheduledAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-medium text-[#3d4236]">
              Latest Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <a
              href={MOCK_LATEST_RECORDING.url}
              className="flex items-center gap-3 text-[#3d4236] hover:text-[#7daf41] transition-colors"
            >
              <FileVideo className="h-5 w-5 text-[#5a5f57]" />
              <div>
                <p className="font-medium">{MOCK_LATEST_RECORDING.title}</p>
                <p className="text-sm text-[#5a5f57]">{MOCK_LATEST_RECORDING.recordedAt}</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Homework */}
      <div className="mt-16 pt-12 border-t border-gray-100">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-medium text-[#3d4236]">
              Homework
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
            <ul className="space-y-4">
              {MOCK_HOMEWORK.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 text-[#3d4236]"
                >
                  <FileText className="h-4 w-4 text-[#5a5f57] shrink-0" />
                  <span className={item.completed ? 'line-through text-[#5a5f57]' : ''}>
                    {item.title}
                  </span>
                  {item.completed && (
                    <span className="text-xs text-[#7daf41] ml-auto">Done</span>
                  )}
                </li>
              ))}
            </ul>

            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#7daf41]/40 transition-colors"
            >
              <input
                type="file"
                id="homework-upload"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="homework-upload"
                className="cursor-pointer flex flex-col items-center gap-2 text-[#5a5f57]"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm">Drop files or click to upload</span>
              </label>
              {homeworkFiles.length > 0 && (
                <ul className="mt-4 text-sm text-[#3d4236] text-left space-y-1">
                  {homeworkFiles.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
