/**
 * Schemas for AI-generated homework.
 * Maps AI output to existing homework table (title, instructions, attachmentUrl).
 * Structured tasks are serialized into instructions text for students.
 */

export type AITaskType =
  | 'fill_in_blank'
  | 'short_answer'
  | 'speaking'
  | 'writing'
  | 'reading_comprehension';

export type AIHomeworkTask = {
  type: AITaskType;
  prompt: string;
  answer: string | null;
};

export type AIHomeworkResult = {
  title: string;
  instructions: string;
  tasks: AIHomeworkTask[];
  teacherNotes?: string;
};

/**
 * Maps AI homework result to the format expected by createHomework.
 * Tasks are serialized into instructions text (student-facing; no answers).
 */
export function aiHomeworkToCreatePayload(result: AIHomeworkResult): {
  title: string;
  instructions: string;
} {
  const title = result.title?.trim() || 'Homework';
  const parts: string[] = [];

  if (result.instructions?.trim()) {
    parts.push(result.instructions.trim());
  }

  const tasks = result.tasks ?? [];
  if (tasks.length > 0) {
    if (parts.length > 0) parts.push('');
    tasks.forEach((t, i) => {
      if (t.prompt?.trim()) {
        const label = t.type === 'fill_in_blank' ? 'Fill in the blank' :
          t.type === 'short_answer' ? 'Short answer' :
          t.type === 'speaking' ? 'Speaking' :
          t.type === 'writing' ? 'Writing' :
          t.type === 'reading_comprehension' ? 'Reading' : 'Task';
        parts.push(`${i + 1}. [${label}] ${t.prompt.trim()}`);
      }
    });
  }

  const instructions = parts.join('\n\n').trim() || title;
  return { title, instructions };
}
